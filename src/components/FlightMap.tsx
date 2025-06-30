import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import { DivIcon } from "leaflet";
import planeImg from "../assests/plane.png"; // Ensure correct path & file

interface Airport {
  lat: number;
  lon: number;
  name: string;
  city: string;
  country: string;
  iata: string;
}

interface Flight {
  id: number;
  departure: string;
  arrival: string;
  aircraft: string;
  pilotName: string;
  stops?: string[];
}

interface FlightMapProps {
  flight: Flight;
  airports: Record<string, Airport>;
}

const FitBounds: React.FC<{ positions: [number, number][] }> = ({
  positions,
}) => {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!fittedRef.current) {
      if (positions.length > 1) {
        map.fitBounds(positions, { padding: [50, 50] });
      } else if (positions.length === 1) {
        map.setView(positions[0], 6);
      }
      fittedRef.current = true;
    }
  }, [positions, map]);

  return null;
};

// Linear interpolation helper
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FlightMap: React.FC<FlightMapProps> = ({ flight, airports }) => {
  const [planePosition, setPlanePosition] = useState<[number, number] | null>(
    null
  );
  const [planeRotation, setPlaneRotation] = useState<number>(0);
  const [animatedLine, setAnimatedLine] = useState<[number, number][]>([]);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentSegmentRef = useRef(0);

  const fullRoute = useMemo(() => {
    return [
      airports[flight.departure],
      ...(flight.stops || []).map((code) => airports[code]),
      airports[flight.arrival],
    ].filter(Boolean);
  }, [flight, airports]);

  const path = useMemo<[number, number][]>(() => {
    return fullRoute.map((ap) => [ap.lat, ap.lon]);
  }, [fullRoute]);

  useEffect(() => {
    if (path.length < 2) {
      setPlanePosition(path[0] || null);
      setAnimatedLine(path);
      return;
    }

    // Reset state
    setAnimatedLine([path[0]]);
    setPlanePosition(path[0]);
    currentSegmentRef.current = 0;
    startTimeRef.current = null;

    const durationPerSegment = 1500; // ms per segment, slow for visible animation

    const animate = (timestamp: number) => {
      const i = currentSegmentRef.current;
      if (i >= path.length - 1) return;

      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / durationPerSegment, 1);

      const [startLat, startLng] = path[i];
      const [endLat, endLng] = path[i + 1];
      const newLat = lerp(startLat, endLat, t);
      const newLng = lerp(startLng, endLng, t);

      // Update plane position
      setPlanePosition([newLat, newLng]);

      // Update animated line to include current interpolated position
      setAnimatedLine([...path.slice(0, i + 1), [newLat, newLng]]);
      // Calculate orientation
      const dx = endLng - startLng;
      const dy = endLat - startLat;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;

      // Adjust for plane image orientation (pointing northeast)
      // Add 180 if the plane appears backward
      const correctedAngle = angleDeg - 45 + 177; // or angleDeg - 45 + 180 if backward

      setPlaneRotation(correctedAngle);

      if (t < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // Move to next segment
        currentSegmentRef.current += 1;
        startTimeRef.current = null;
        if (currentSegmentRef.current < path.length - 1) {
          requestRef.current = requestAnimationFrame(animate);
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [flight.id, path]);

  // Plane icon with rotation applied via inline style inside DivIcon
  const planeIcon = new DivIcon({
    className: "plane-marker",
    html: `<img src="${planeImg}" style="width: 40px; transform: rotate(${planeRotation}deg);" />`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <MapContainer
      center={path[0] || [39.5, -98.35]}
      zoom={5}
      scrollWheelZoom={true}
      style={{
        height: "500px",
        width: "100%",
        marginTop: "1rem",
        borderRadius: "8px",
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds positions={path} />

      {/* Airport markers */}
      {fullRoute.map((airport, i) => (
        <Marker key={i} position={[airport.lat, airport.lon]}>
          <Popup>
            {airport.name} ({airport.iata || "No IATA"})
          </Popup>
        </Marker>
      ))}

      {/* Animated polyline */}
      {animatedLine.length >= 2 && (
        <Polyline positions={animatedLine} color="hotpink" weight={5} />
      )}

      {/* Animated plane marker */}
      {planePosition && <Marker position={planePosition} icon={planeIcon} />}
    </MapContainer>
  );
};

export default FlightMap;
