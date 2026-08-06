import React from "react";

export const SunburstBackground: React.FC = () => {
  const numRays = 24;
  const rays = Array.from({ length: numRays });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
      <svg
        viewBox="0 0 800 800"
        className="w-[140%] h-[140%] min-w-[800px] min-h-[800px] animate-pulse"
        style={{ animationDuration: "8s" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(400, 400)">
          {rays.map((_, i) => {
            const startAngle = (i * 360) / numRays;
            const endAngle = ((i + 1) * 360) / numRays;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = Math.cos(startRad) * 600;
            const y1 = Math.sin(startRad) * 600;
            const x2 = Math.cos(endRad) * 600;
            const y2 = Math.sin(endRad) * 600;

            const pathData = `M 0 0 L ${x1} ${y1} L ${x2} ${y2} Z`;
            const color = i % 2 === 0 ? "#F5A623" : "#E8720C";

            return (
              <path
                key={i}
                d={pathData}
                fill={color}
                fillOpacity="0.10"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
