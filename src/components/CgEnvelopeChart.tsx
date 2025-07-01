import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Area,
} from "recharts";

type CgEnvelopeChartProps = {
  envelope: { x: number; y: number }[];
  cg: number;
  weight: number;
};

function isPointInsideEnvelope(
  envelope: { x: number; y: number }[],
  cg: number,
  weight: number
) {
  let inside = false;
  for (let i = 0, j = envelope.length - 1; i < envelope.length; j = i++) {
    const xi = envelope[i].x,
      yi = envelope[i].y;
    const xj = envelope[j].x,
      yj = envelope[j].y;

    const intersect =
      yi > weight !== yj > weight &&
      cg < ((xj - xi) * (weight - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const CgEnvelopeChart: React.FC<CgEnvelopeChartProps> = ({
  envelope,
  cg,
  weight,
}) => {
  const inside = isPointInsideEnvelope(envelope, cg, weight);

  if (!envelope || envelope.length < 3) {
    return <p>No valid envelope.</p>;
  }

  const closedEnvelope = [...envelope, envelope[0]];

  const cgMin = Math.min(...envelope.map((p) => p.x)) - 1;
  const cgMax = Math.max(...envelope.map((p) => p.x)) + 1;
  const weightMin = Math.min(...envelope.map((p) => p.y)) - 100;
  const weightMax = Math.max(...envelope.map((p) => p.y)) + 100;

  return (
    <div style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[cgMin, cgMax]}
            label={{ value: "CG (in)", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[weightMin, weightMax]}
            label={{
              value: "Weight (lbs)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Area
            data={closedEnvelope}
            type="linear"
            dataKey="y"
            stroke="#007bff"
            fill="rgba(0, 123, 255, 0.2)"
          />
          <Line
            data={closedEnvelope}
            type="linear"
            dataKey="y"
            stroke="#007bff"
            dot={false}
          />
          <ReferenceDot
            x={cg}
            y={weight}
            r={6}
            fill={inside ? "green" : "red"}
            label={{
              value: `CG: ${cg.toFixed(1)}, W: ${weight.toFixed(0)}`,
              position: "top",
              fontSize: 12,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ color: inside ? "green" : "red", fontWeight: "bold" }}>
        {inside ? "✅ CG in limits" : "⚠️ CG out of limits!"}
      </p>
    </div>
  );
};

export default CgEnvelopeChart;
