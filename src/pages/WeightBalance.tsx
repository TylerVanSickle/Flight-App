import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { IonContent } from "@ionic/react";
import CgEnvelopeChart from "../components/CgEnvelopeChart";

type WBInput = {
  name: string;
  weight: number;
  arm: number;
};

type Aircraft = {
  id: string;
  name: string;
  tail_num: string;
  bew: number;
  arm: number;
  envelope: { x: number; y: number }[] | null;
  cg_min: number;
  cg_max: number;
  weight_min: number;
  weight_max: number;
};

const defaultItems: WBInput[] = [
  { name: "Pilot & Front Pax", weight: 0, arm: 37 },
  { name: "Rear Pax", weight: 0, arm: 73 },
  { name: "Fuel (Gallons)", weight: 0, arm: 48 },
  { name: "Baggage", weight: 0, arm: 95 },
];

const WeightBalance = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(
    null
  );
  const [items, setItems] = useState<WBInput[]>(defaultItems);
  const [notes, setNotes] = useState("");

  const handleAircraftChange = async (aircraftId: string) => {
    const found = aircraftList.find((a) => a.id === aircraftId);
    setSelectedAircraft(found || null);
    setItems(defaultItems);
  };

  useEffect(() => {
    const fetchAircraft = async () => {
      const { data, error } = await supabase.from("aircraft").select("*");
      if (error) console.error(error);
      else setAircraftList(data as Aircraft[]);
    };
    fetchAircraft();
  }, []);

  const handleChange = (index: number, value: number) => {
    const updated = [...items];
    if (updated[index].name === "Fuel (Gallons)") {
      updated[index].weight = value * 6;
    } else {
      updated[index].weight = value;
    }
    setItems(updated);
  };

  const calcMoment = (weight: number, arm: number) => weight * arm;

  const totalMoment = selectedAircraft
    ? items.reduce((acc, i) => acc + calcMoment(i.weight, i.arm), 0) +
      calcMoment(selectedAircraft.bew, selectedAircraft.arm)
    : 0;

  const totalWeight = selectedAircraft
    ? items.reduce((acc, i) => acc + i.weight, 0) + selectedAircraft.bew
    : 0;

  const cg = totalWeight > 0 ? totalMoment / totalWeight : 0;

  const isCGWithin = selectedAircraft
    ? cg >= selectedAircraft.cg_min && cg <= selectedAircraft.cg_max
    : false;

  const isWeightWithin = selectedAircraft
    ? totalWeight >= selectedAircraft.weight_min &&
      totalWeight <= selectedAircraft.weight_max
    : false;

  const isInsideEnvelope = selectedAircraft?.envelope
    ? pointInsidePolygon({ x: cg, y: totalWeight }, selectedAircraft.envelope)
    : false;

  function pointInsidePolygon(
    point: { x: number; y: number },
    polygon: { x: number; y: number }[]
  ) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.00001) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  return (
    <IonContent>
      <div className="weight-balance-page" style={{ padding: "2rem" }}>
        <h1>Aircraft Weight & Balance</h1>

        <p style={{ maxWidth: "600px" }}>
          This tool helps you calculate your aircraft's weight & balance for
          safe flight. Select your aircraft, adjust your load, and verify that
          your CG is within the safe limits.
        </p>

        <h2>1️⃣ Select Aircraft</h2>
        <select
          value={selectedAircraft?.id || ""}
          onChange={(e) => handleAircraftChange(e.target.value)}
          style={{ padding: "0.5rem", fontSize: "1rem", marginBottom: "1rem" }}
        >
          <option value="">-- Select --</option>
          {aircraftList.map((ac) => (
            <option key={ac.id} value={ac.id}>
              {ac.tail_num} — {ac.name}
            </option>
          ))}
        </select>

        {selectedAircraft && (
          <>
            <h2>2️⃣ Aircraft Details</h2>
            <p>
              Basic Empty Weight (BEW): <strong>{selectedAircraft.bew}</strong>{" "}
              lbs @ <strong>{selectedAircraft.arm}"</strong> arm.
            </p>
            <p>
              CG Range:{" "}
              <strong>
                {selectedAircraft.cg_min}–{selectedAircraft.cg_max} in
              </strong>
            </p>
            <p>
              Weight Limit:{" "}
              <strong>
                {selectedAircraft.weight_min}–{selectedAircraft.weight_max} lbs
              </strong>
            </p>

            <h2>3️⃣ Load Your Aircraft</h2>
            {items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: "1.5rem" }}>
                <label>{item.name}</label>
                <input
                  type="number"
                  value={
                    item.name === "Fuel (Gallons)"
                      ? item.weight / 6
                      : item.weight
                  }
                  onChange={(e) => handleChange(idx, Number(e.target.value))}
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    width: "100%",
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={item.name === "Fuel (Gallons)" ? 100 : 1000}
                  step={item.name === "Fuel (Gallons)" ? 1 : 10}
                  value={
                    item.name === "Fuel (Gallons)"
                      ? item.weight / 6
                      : item.weight
                  }
                  onChange={(e) => handleChange(idx, Number(e.target.value))}
                  style={{ width: "100%" }}
                />
                <p>Arm: {item.arm}"</p>
                {item.name === "Fuel (Gallons)" && (
                  <small>ℹ️ Fuel weight estimated at 6 lbs per gallon.</small>
                )}
              </div>
            ))}

            <h2>4️⃣ Results & Status</h2>
            <div className="weight-balance-summary">
              <p>
                <strong>Total Weight:</strong> {totalWeight.toFixed(1)} lbs
              </p>
              <p>
                <strong>Total Moment:</strong> {totalMoment.toFixed(1)}
              </p>
              <p>
                <strong>CG:</strong> {cg.toFixed(2)} in
              </p>

              <p>CG Limit: {isCGWithin ? "PASS" : "FAIL"}</p>
              <p>Weight Limit: {isWeightWithin ? "PASS" : "FAIL"}</p>
              <p>Inside Envelope: {isInsideEnvelope ? "PASS" : "FAIL"}</p>

              {!isInsideEnvelope && (
                <p style={{ color: "red" }}>
                  ⚠️ Your CG or Weight is out of safe limits — adjust your load!
                </p>
              )}
            </div>

            <h2>5️⃣ CG Envelope Chart</h2>
            {selectedAircraft.envelope && (
              <CgEnvelopeChart
                envelope={selectedAircraft.envelope}
                cg={cg}
                weight={totalWeight}
                cgMin={selectedAircraft.cg_min}
                cgMax={selectedAircraft.cg_max}
                weightMin={selectedAircraft.weight_min}
                weightMax={selectedAircraft.weight_max}
              />
            )}

            <h2 style={{ marginTop: "2rem" }}>6️⃣ Preflight Notes</h2>
            <textarea
              placeholder="Add your preflight safety notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", minHeight: "100px", marginTop: "1rem" }}
            />

            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
              ✈️ Always verify your calculations against your official POH and
              local regulations.
            </p>
          </>
        )}
      </div>
    </IonContent>
  );
};

export default WeightBalance;
