export type UserRole = 'teacher' | 'master_teacher' | 'ict_coordinator' | 'principal' | 'stakeholder';

export type SubjectClassification =
  | 'jhs_core'
  | 'jhs_tle_mapeh'
  | 'shs_core'
  | 'shs_field_exposure'
  | 'shs_arts_sports_wellness'
  | 'shs_research_design'
  | 'shs_techpro'
  | 'shs_work_immersion';

export type GradingMode = 'adjusted_transmutation' | 'zero_based';
export type GradingModeEnum = GradingMode;

export type EnrollmentStatus = 'enrolled' | 'transferred_out' | 'dropped' | 'graduated';

export type GradeStatus = 'DRAFT' | 'SUBMITTED' | 'MT_APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'LOCKED';
export type GradeStatusEnum = GradeStatus;

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_adviser: boolean;
  section_id?: string | null;
  created_at: string;
}

export interface Section {
  id: string;
  grade_level: string;
  section_name: string;
  school_year: string;
  adviser_id?: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  classification: SubjectClassification;
  created_at: string;
}

export interface SubjectWeight {
  classification: SubjectClassification;
  written_work_weight: number;
  performance_task_weight: number;
  examination_weight: number;
}

export interface TransmutationRow {
  id: number;
  min_ig: number;
  max_ig: number;
  transmuted_grade: number;
}

export interface SchoolSettings {
  id: string;
  grading_mode: GradingMode;
  updated_at: string;
}

export interface Student {
  id: string;
  lrn: string;
  full_name: string;
  birthdate?: string | null;
  sex?: string | null;
  address?: string | null;
  grade_level: string;
  section_id?: string | null;
  enrollment_status: EnrollmentStatus;
  sf10_file_url?: string | null;
  created_at: string;
}

export interface StakeholderLink {
  id: string;
  stakeholder_id: string;
  student_id: string;
  relationship: string;
  created_at: string;
}

export interface ClassRecordGrade {
  id: string;
  student_id: string;
  subject_id: string;
  quarter: number;
  written_work_raw?: number | null;
  written_work_highest?: number | null;
  performance_task_raw?: number | null;
  performance_task_highest?: number | null;
  st1_raw?: number | null;
  st1_highest?: number | null;
  st2_raw?: number | null;
  st2_highest?: number | null;
  te_raw?: number | null;
  te_highest?: number | null;
  initial_grade?: number | null;
  transmuted_grade?: number | null;
  status: GradeStatus;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormativeLog {
  id: string;
  student_id: string;
  subject_id: string;
  quarter: number;
  activity_name: string;
  esru_rating: 'E' | 'S' | 'R' | 'U' | string;
  notes?: string | null;
  created_at: string;
}

export type EnrollmentRequestStatus = 'pending_review' | 'confirmed' | 'rejected';

export interface EnrollmentRequest {
  id: string;
  uploaded_file_url: string;
  submitted_by?: string | null;
  status: EnrollmentRequestStatus;
  reviewer_notes?: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile>; Relationships: [] };
      sections: { Row: Section; Insert: Omit<Section, 'id' | 'created_at'>; Update: Partial<Section>; Relationships: [] };
      subjects: { Row: Subject; Insert: Omit<Subject, 'id' | 'created_at'>; Update: Partial<Subject>; Relationships: [] };
      subject_weights: { Row: SubjectWeight; Insert: SubjectWeight; Update: Partial<SubjectWeight>; Relationships: [] };
      transmutation_table: { Row: TransmutationRow; Insert: Omit<TransmutationRow, 'id'>; Update: Partial<TransmutationRow>; Relationships: [] };
      school_settings: { Row: SchoolSettings; Insert: Omit<SchoolSettings, 'id' | 'updated_at'>; Update: Partial<SchoolSettings>; Relationships: [] };
      students: { Row: Student; Insert: Omit<Student, 'id' | 'created_at'>; Update: Partial<Student>; Relationships: [] };
      enrollment_requests: { Row: EnrollmentRequest; Insert: Omit<EnrollmentRequest, 'id' | 'created_at'>; Update: Partial<EnrollmentRequest>; Relationships: [] };
      stakeholder_links: { Row: StakeholderLink; Insert: Omit<StakeholderLink, 'id' | 'created_at'>; Update: Partial<StakeholderLink>; Relationships: [] };
      class_record_grades: { Row: ClassRecordGrade; Insert: Omit<ClassRecordGrade, 'id' | 'created_at' | 'updated_at'>; Update: Partial<ClassRecordGrade>; Relationships: [] };
      formative_logs: { Row: FormativeLog; Insert: Omit<FormativeLog, 'id' | 'created_at'>; Update: Partial<FormativeLog>; Relationships: [] };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      subject_classification: SubjectClassification;
      grading_mode_enum: GradingMode;
      enrollment_status_enum: EnrollmentStatus;
      grade_status_enum: GradeStatus;
      enrollment_request_status: EnrollmentRequestStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
