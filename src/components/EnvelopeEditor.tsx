import React, { useState, useRef } from "react";
import { supabase } from "../supabaseClient";

type Point = { x: number; y: number };

type Aircraft = {
  id: string;
  name: string;
  cg_min?: number;
  cg_max?: number;
  weight_min?: number;
  weight_max?: number;
};

const EnvelopeEditor: React.FC<{ aircraft: Aircraft }> = ({ aircraft }) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [manualCG, setManualCG] = useState("");
  const [manualWeight, setManualWeight] = useState("");

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
  const [bgScale, setBgScale] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(0.6);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const cgMin = aircraft.cg_min ?? 35;
  const cgMax = aircraft.cg_max ?? 47;
  const weightMin = aircraft.weight_min ?? 1600;
  const weightMax = aircraft.weight_max ?? 2400;

  const viewBoxWidth = 800;
  const viewBoxHeight = 400;

  const snapCG = (value: number) => Math.round(value * 10) / 10;
  const snapWeight = (value: number) => Math.round(value / 10) * 10;

  const mapPixelsToDomain = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * viewBoxWidth;
    const relY = ((clientY - rect.top) / rect.height) * viewBoxHeight;

    const cg = snapCG(cgMin + (relX / viewBoxWidth) * (cgMax - cgMin));
    const weight = snapWeight(
      weightMax - (relY / viewBoxHeight) * (weightMax - weightMin)
    );
    return { x: cg, y: weight };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const newPoint = mapPixelsToDomain(e.clientX, e.clientY);
    setPoints([...points, newPoint]);
  };

  const handleMouseDown = (index: number) => {
    setDragIndex(index);
    document.body.style.userSelect = "none";
  };

  const handleMouseUp = () => {
    setDragIndex(null);
    document.body.style.userSelect = "auto";
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragIndex === null) return;
    const newPoint = mapPixelsToDomain(e.clientX, e.clientY);
    const newPoints = [...points];
    newPoints[dragIndex] = newPoint;
    setPoints(newPoints);
  };

  const removeLastPoint = () => setPoints(points.slice(0, -1));
  const clearPoints = () => setPoints([]);

  const saveEnvelope = async () => {
    const { error } = await supabase
      .from("aircraft")
      .update({ envelope: points })
      .eq("id", aircraft.id);
    if (error) console.error(error);
    else alert("✅ Envelope saved!");
  };

  const exportEnvelope = () => {
    const json = JSON.stringify(points, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert("✅ Envelope JSON copied!");
    });
  };

  const importEnvelope = () => {
    const input = prompt("Paste your JSON:");
    if (!input) return;
    try {
      const parsed = JSON.parse(input) as Point[];
      if (Array.isArray(parsed)) setPoints(parsed);
      else alert("Invalid JSON format");
    } catch {
      alert("Invalid JSON");
    }
  };

  const addManualPoint = () => {
    const cgNum = parseFloat(manualCG);
    const weightNum = parseFloat(manualWeight);
    if (
      isNaN(cgNum) ||
      isNaN(weightNum) ||
      cgNum < cgMin ||
      cgNum > cgMax ||
      weightNum < weightMin ||
      weightNum > weightMax
    ) {
      alert(`❌ CG ${cgMin}-${cgMax}, Weight ${weightMin}-${weightMax}`);
      return;
    }
    setPoints([...points, { x: snapCG(cgNum), y: snapWeight(weightNum) }]);
    setManualCG("");
    setManualWeight("");
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeBgImage = () => setBgImage(null);

  return (
    <div>
      <h2>Envelope Editor: {aircraft.name}</h2>

      <input type="file" accept="image/*" onChange={handleBgUpload} />

      {bgImage && (
        <button onClick={removeBgImage} style={{ marginLeft: "10px" }}>
          ❌ Remove Image
        </button>
      )}

      <div style={{ marginTop: "1rem" }}>
        <label>BG X:</label>
        <input
          type="number"
          value={bgOffset.x}
          onChange={(e) =>
            setBgOffset({ ...bgOffset, x: parseFloat(e.target.value) })
          }
        />
        <label>BG Y:</label>
        <input
          type="number"
          value={bgOffset.y}
          onChange={(e) =>
            setBgOffset({ ...bgOffset, y: parseFloat(e.target.value) })
          }
        />
        <label>Scale:</label>
        <input
          type="number"
          value={bgScale}
          step="0.1"
          onChange={(e) => setBgScale(parseFloat(e.target.value))}
        />
        <label>Opacity:</label>
        <input
          type="number"
          value={bgOpacity}
          step="0.1"
          min="0.1"
          max="1"
          onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
        />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width="100%"
        height="400"
        onClick={handleSvgClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ background: "#fff", cursor: "crosshair" }}
      >
        {bgImage && (
          <image
            href={bgImage}
            x={bgOffset.x}
            y={bgOffset.y}
            width={viewBoxWidth * bgScale}
            height={viewBoxHeight * bgScale}
            opacity={bgOpacity}
          />
        )}

        {[...Array(10)].map((_, i) => (
          <line
            key={`v-${i}`}
            x1={(i / 9) * viewBoxWidth}
            y1={0}
            x2={(i / 9) * viewBoxWidth}
            y2={viewBoxHeight}
            stroke="#eee"
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={(i / 9) * viewBoxHeight}
            x2={viewBoxWidth}
            y2={(i / 9) * viewBoxHeight}
            stroke="#eee"
          />
        ))}

        {points.length > 1 &&
          points.map((p, i) => {
            const next = points[(i + 1) % points.length];
            const x1 = ((p.x - cgMin) / (cgMax - cgMin)) * viewBoxWidth;
            const y1 =
              ((weightMax - p.y) / (weightMax - weightMin)) * viewBoxHeight;
            const x2 = ((next.x - cgMin) / (cgMax - cgMin)) * viewBoxWidth;
            const y2 =
              ((weightMax - next.y) / (weightMax - weightMin)) * viewBoxHeight;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#007bff" />
            );
          })}

        {points.map((p, i) => {
          const cx = ((p.x - cgMin) / (cgMax - cgMin)) * viewBoxWidth;
          const cy =
            ((weightMax - p.y) / (weightMax - weightMin)) * viewBoxHeight;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={6}
              fill="#007bff"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(i);
              }}
            />
          );
        })}
      </svg>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={removeLastPoint}>Remove Last</button>
        <button onClick={clearPoints}>Clear All</button>
        <button onClick={exportEnvelope}>Export JSON</button>
        <button onClick={importEnvelope}>Import JSON</button>
        <button onClick={saveEnvelope}>Save Envelope</button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>Manual CG:</label>
        <input
          type="number"
          value={manualCG}
          onChange={(e) => setManualCG(e.target.value)}
        />
        <label style={{ marginLeft: "1rem" }}>Manual Weight:</label>
        <input
          type="number"
          value={manualWeight}
          onChange={(e) => setManualWeight(e.target.value)}
        />
        <button onClick={addManualPoint} style={{ marginLeft: "1rem" }}>
          Add Point
        </button>
      </div>
    </div>
  );
};

export default EnvelopeEditor;
