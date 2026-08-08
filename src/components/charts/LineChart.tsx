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

interface LineChartProps {
  categories: string[];
  series: SeriesItem[];
  height?: number;
  className?: string;
}

export function LineChart({
  categories,
  series,
  height = 300,
  className = "",
}: LineChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: "#1A1A1A",
    },
    colors: ["#1B3B8C", "#F5A623"],
    stroke: { curve: "smooth", width: 3 },
    dataLabels: { enabled: false },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.55,
        opacityTo: 0.05,
      },
    },
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
      x: { show: false },
    },
  };

  return (
    <div className={`max-w-full overflow-x-auto custom-scrollbar ${className}`}>
      <div className="min-w-[600px]">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={height}
        />
      </div>
    </div>
  );
}
