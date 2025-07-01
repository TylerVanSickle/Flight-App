import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import "./Crosswind.css";

const Crosswind: React.FC = () => {
  const [runwayHeading, setRunwayHeading] = useState("");
  const [windDirection, setWindDirection] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    headwind: string;
    crosswind: string;
  } | null>(null);

  const handleCalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Placeholder for calculation logic
      const headwind = "15 knots"; // Example value
      const crosswind = "5 knots"; // Example value
      setResult({ headwind, crosswind });
      setIsLoading(false);
    }, 1500); // Simulating loading time
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Crosswind Calculator</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="crosswind-page">
          <h1>Aircraft Crosswind Calculator</h1>

          <p>
            Enter your runway heading, wind direction, and wind speed to
            calculate headwind and crosswind components.
          </p>

          <div className="crosswind-form">
            <label>Runway Heading (°)</label>
            <input
              type="number"
              placeholder="e.g. 27"
              value={runwayHeading}
              onChange={(e) => setRunwayHeading(e.target.value)}
            />

            <label>Wind Direction (°)</label>
            <input
              type="number"
              placeholder="e.g. 30"
              value={windDirection}
              onChange={(e) => setWindDirection(e.target.value)}
            />

            <label>Wind Speed (knots)</label>
            <input
              type="number"
              placeholder="e.g. 12"
              value={windSpeed}
              onChange={(e) => setWindSpeed(e.target.value)}
            />

            <IonButton
              expand="block"
              onClick={handleCalculate}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : "Calculate"}
            </IonButton>
          </div>

          {result && (
            <div className="crosswind-result">
              <h2>Results</h2>
              <p>
                <strong>Headwind:</strong> {result.headwind}
              </p>
              <p>
                <strong>Crosswind:</strong> {result.crosswind}
              </p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Crosswind;
