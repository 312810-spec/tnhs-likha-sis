"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type SeriesItem = {
  name: string;
  data: number[];
};

interface BarChartProps {
  categories: string[];
  series: SeriesItem[];
  height?: number;
  className?: string;
}

export function BarChart({
  categories,
  series,
  height = 260,
  className = "",
}: BarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: "#1A1A1A",
    },
    colors: ["#1B3B8C", "#F5A623", "#1E6B3A", "#E8720C"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 10,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories,
      labels: { style: { colors: "#1A1A1A" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#1A1A1A" } },
    },
    grid: { strokeDashArray: 4, borderColor: "#E5E7EB" },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value: number) => `${value}`,
      },
    },
  };

  return (
    <div className={`max-w-full overflow-x-auto custom-scrollbar ${className}`}>
      <div className="min-w-[600px]">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={height}
        />
      </div>
    </div>
  );
}
