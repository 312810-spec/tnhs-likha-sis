import { db, LocalClassRecordGrade, SyncQueueItem } from "./db";
import { supabase } from "./supabase";

let isSyncing = false;

/**
 * Save grade locally to Dexie.js first, then enqueue for Supabase sync
 */
export async function saveGradeRecordOffline(gradeRecord: LocalClassRecordGrade): Promise<LocalClassRecordGrade> {
  const updatedRecord: LocalClassRecordGrade = {
    ...gradeRecord,
    synced: 0,
    updated_at: new Date().toISOString(),
  };

  // 1. Store in Dexie.js IndexedDB first
  await db.class_record_grades.put(updatedRecord);

  // 2. Enqueue into sync_queue
  const existingQueue = await db.sync_queue
    .where("table_name")
    .equals("class_record_grades")
    .filter((item) => item.payload.id === updatedRecord.id && item.status !== "SUCCESS")
    .first();

  if (existingQueue && existingQueue.id) {
    await db.sync_queue.update(existingQueue.id, {
      payload: updatedRecord,
      timestamp: new Date().toISOString(),
      status: "PENDING",
    });
  } else {
    await db.sync_queue.add({
      table_name: "class_record_grades",
      action: "UPSERT",
      payload: updatedRecord,
      timestamp: new Date().toISOString(),
      status: "PENDING",
      retry_count: 0,
    });
  }

  // 3. Attempt immediate sync if connection is active
  if (typeof window !== "undefined" && navigator.onLine) {
    processSyncQueue().catch((err) => console.warn("Background auto-sync deferred:", err));
  }

  return updatedRecord;
}

/**
 * Process all pending items in Dexie sync queue and push to Supabase
 */
export async function processSyncQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (isSyncing) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  if (typeof window !== "undefined" && !navigator.onLine) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  isSyncing = true;
  let succeeded = 0;
  let failed = 0;

  try {
    const pendingItems = await db.sync_queue
      .where("status")
      .anyOf(["PENDING", "FAILED"])
      .toArray();

    for (const item of pendingItems) {
      if (!item.id) continue;

      // Mark as SYNCING
      await db.sync_queue.update(item.id, { status: "SYNCING" });

      try {
        if (item.table_name === "class_record_grades" && item.action === "UPSERT") {
          // Prepare payload for Supabase (strip Dexie local 'synced' field)
          const { synced, ...supabasePayload } = item.payload;

          const { error } = await supabase
            .from("class_record_grades")
            .upsert(supabasePayload as any, { onConflict: "student_id,subject_id,quarter" });

          if (error) {
            throw error;
          }

          // Mark queue item success
          await db.sync_queue.update(item.id, { status: "SUCCESS", last_error: undefined });

          // Update Dexie grade record synced flag to 1
          if (supabasePayload.id) {
            await db.class_record_grades.update(supabasePayload.id, { synced: 1 });
          }

          succeeded++;
        }
      } catch (err: any) {
        console.warn(`Sync failed for item ${item.id}:`, err?.message || err);
        failed++;
        await db.sync_queue.update(item.id, {
          status: "FAILED",
          retry_count: item.retry_count + 1,
          last_error: err?.message || String(err),
        });
      }
    }

    return { processed: pendingItems.length, succeeded, failed };
  } finally {
    isSyncing = false;
  }
}

/**
 * Setup automatic online listener to flush queue whenever internet restores
 */
export function initOnlineSyncListener() {
  if (typeof window === "undefined") return;

  const handleOnline = () => {
    console.log("Network online detected. Triggering Dexie sync queue flush...");
    processSyncQueue();
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}
