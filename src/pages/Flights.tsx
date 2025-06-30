import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Flights.css";
import AirportAutoComplete from "../components/AirportAutoComplete";
import rawAirportData from "../data/airports.json";
import FlightMap from "../components/FlightMap";
import { IonContent } from "@ionic/react";

interface Airport {
  name: string;
  city: string;
  country: string;
  iata: string;
  lat: number;
  lon: number;
}

// Cast imported JSON to the correct type:
const airportData = rawAirportData as Record<string, Airport>;

interface Flight {
  id: number;
  pilotName: string;
  date: string;
  aircraft: string;
  duration: string;
  departure: string;
  arrival: string;
  stops: string[];
  notes: string;
}

interface Aircraft {
  id: string;
  name: string;
  tail_num: string;
}
// Helper to convert degrees to radians and calculate nautical miles
function haversineDistanceNM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3440.1; // Earth's radius in nautical miles

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total NM for a flight with possible stops
function calculateFlightDistanceNM(
  airportData: Record<string, Airport>,
  flight: Flight
): number {
  const legs = [flight.departure, ...(flight.stops || []), flight.arrival];
  let total = 0;

  for (let i = 0; i < legs.length - 1; i++) {
    const a1 = airportData[legs[i]];
    const a2 = airportData[legs[i + 1]];

    if (a1 && a2) {
      total += haversineDistanceNM(a1.lat, a1.lon, a2.lat, a2.lon);
    }
  }

  return total;
}

const Flights: React.FC = () => {
  const [pilotName, setPilotName] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [date, setDate] = useState("");
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [newAircraftInput, setNewAircraftInput] = useState("");
  const [addingNewAircraft, setAddingNewAircraft] = useState(false);
  const [duration, setDuration] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [notes, setNotes] = useState("");
  const [editingFlightId, setEditingFlightId] = useState<number | null>(null);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [stops, setStops] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated", userError);
        return;
      }

      const { data: aircraftData, error: aircraftError } = await supabase
        .from("aircraft")
        .select("id, name, tail_num")
        .eq("user_id", user.id);

      if (aircraftError) {
        console.error("Error fetching aircraft:", aircraftError);
        return;
      }

      setAircraftList(aircraftData || []);

      const { data: flightsData, error: flightsError } = await supabase
        .from("flights")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (flightsError) {
        console.error("Error fetching flights:", flightsError);
        return;
      }

      interface SupabaseFlight {
        id: number;
        pilotName: string;
        date: string;
        aircraft_id: string;
        duration: string;
        departure: string;
        arrival: string;
        stops: string[];
        notes: string;
        user_id: string;
      }

      const flightsWithNames = flightsData.map((f: SupabaseFlight) => {
        const ac = aircraftData?.find((a) => a.id === f.aircraft_id);
        return {
          ...f,
          aircraft: ac ? `${ac.name} (${ac.tail_num})` : "Unknown",
        };
      });

      setFlights(flightsWithNames);
    }

    fetchData();
  }, []);
  const saveFlight = async () => {
    if (
      !pilotName.trim() ||
      !date ||
      (!selectedAircraft && !addingNewAircraft) ||
      !duration.trim() ||
      !departure.trim() ||
      !arrival.trim()
    ) {
      alert("Please fill all required fields");
      return;
    }

    let aircraftId = null;

    if (addingNewAircraft) {
      // You should add the new aircraft first, get its id, then continue
      alert(
        "Please add the new aircraft first using 'Add new aircraft' button"
      );
      return;
    } else {
      aircraftId = selectedAircraft || null;
    }

    // Get current user for user_id
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("User not authenticated");
      return;
    }

    const flightData = {
      pilotName: pilotName.trim(),
      date,
      aircraft_id: aircraftId,
      duration: duration.trim(),
      departure: departure.trim(),
      arrival: arrival.trim(),
      stops: stops.filter((s) => s.trim() !== ""), // array of strings
      notes: notes.trim(),
      user_id: user.id,
    };

    try {
      if (editingFlightId) {
        // Update existing flight
        const { error } = await supabase
          .from("flights")
          .update(flightData)
          .eq("id", editingFlightId);

        if (error) throw error;

        setFlights((prev) =>
          prev.map((f) =>
            f.id === editingFlightId ? { ...f, ...flightData } : f
          )
        );
      } else {
        // Insert new flight
        const { data, error } = await supabase
          .from("flights")
          .insert([flightData])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          setFlights((prev) => [...prev, data[0]]);
        }
      }

      resetForm();
      setShowFlightForm(false);
      setEditingFlightId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Failed to save flight: " + err.message);
        console.error("Supabase error:", err);
      } else {
        alert("Failed to save flight: " + String(err));
        console.error("Supabase error:", err);
      }
    }
  };

  const resetForm = () => {
    setPilotName("");
    setDate("");
    setSelectedAircraft("");
    setDuration("");
    setDeparture("");
    setArrival("");
    setStops([]);
    setNotes("");
    setEditingFlightId(null);
    setAddingNewAircraft(false);
    setNewAircraftInput("");
  };

  const handleEdit = (flight: Flight) => {
    setEditingFlightId(flight.id);
    setPilotName(flight.pilotName);
    setDate(flight.date);
    setDuration(flight.duration);
    setDeparture(flight.departure);
    setArrival(flight.arrival);
    setNotes(flight.notes);
    setStops(flight.stops || []);

    // Try to match the aircraft string back to the id
    const ac = aircraftList.find(
      (a) => `${a.name} (${a.tail_num})` === flight.aircraft
    );

    if (ac) {
      setSelectedAircraft(ac.id);
      setAddingNewAircraft(false);
      setNewAircraftInput("");
    } else {
      // Aircraft not found (was likely deleted), allow re-select or new entry
      setSelectedAircraft("");
      setAddingNewAircraft(false);
    }

    setShowFlightForm(true);
  };

  const handleDelete = async (flightId: number) => {
    if (!window.confirm("Are you sure you want to delete this flight?")) return;

    const { error } = await supabase
      .from("flights")
      .delete()
      .eq("id", flightId);

    if (error) {
      alert("Failed to delete flight");
      console.error(error);
    } else {
      setFlights((prev) => prev.filter((f) => f.id !== flightId));
    }
  };

  const handleAircraftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__add_new__") {
      setAddingNewAircraft(true);
      setSelectedAircraft("");
    } else {
      setAddingNewAircraft(false);
      setSelectedAircraft(val);
      setNewAircraftInput("");
    }
  };

  const handleAddNewAircraft = async () => {
    const newName = newAircraftInput.trim();
    if (!newName) return;

    if (
      aircraftList.some(
        (ac) =>
          ac.name.toLowerCase() === newName.toLowerCase() ||
          ac.tail_num.toLowerCase() === newName.toLowerCase()
      )
    ) {
      alert("This aircraft is already in the list.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to add an aircraft.");
      return;
    }

    const { data, error } = await supabase
      .from("aircraft")
      .insert([
        {
          name: newName,
          tail_num: newName,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      alert("Failed to add new aircraft.");
      console.error(error);
    } else if (data && data.length > 0) {
      const newAc = data[0];
      setAircraftList((prev) => [...prev, newAc]);
      setSelectedAircraft(newAc.id);
      setAddingNewAircraft(false);
      setNewAircraftInput("");
    }
  };

  const durationToMinutes = (duration: string): number => {
    const [hours, minutes] = duration.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const minutesToDuration = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const totalMinutes = flights.reduce(
    (sum, flight) => sum + durationToMinutes(flight.duration),
    0
  );

  const totalDuration = minutesToDuration(totalMinutes);
  const totalNM = flights.reduce((sum, flight) => {
    return sum + calculateFlightDistanceNM(airportData, flight);
  }, 0);

  const roundedNM = Math.round(totalNM);

  return (
    <IonContent scrollY={true}>
      <div className="flights-page">
        <h2>Flight Log</h2>

        {!showFlightForm && (
          <button
            className="show-form-btn"
            onClick={() => {
              resetForm();
              setShowFlightForm(true);
            }}
          >
            + Add New Flight
          </button>
        )}

        {showFlightForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveFlight();
            }}
          >
            <label htmlFor="pilotName">Pilot Name*:</label>
            <input
              id="pilotName"
              type="text"
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value)}
              required
            />

            <label htmlFor="date">Date*:</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <label htmlFor="aircraft">Aircraft*:</label>
            <select
              id="aircraft"
              value={addingNewAircraft ? "__add_new__" : selectedAircraft}
              onChange={handleAircraftChange}
              required
            >
              <option value="" disabled>
                Select aircraft
              </option>
              {aircraftList.map((ac) => (
                <option key={ac.id} value={ac.id}>
                  {ac.name} ({ac.tail_num})
                </option>
              ))}
              <option value="__add_new__">Add new aircraft...</option>
            </select>

            {addingNewAircraft && (
              <div className="new-aircraft-input-container">
                <input
                  type="text"
                  value={newAircraftInput}
                  onChange={(e) => setNewAircraftInput(e.target.value)}
                  placeholder="Enter aircraft name or tail number"
                />
                <button
                  type="button"
                  onClick={handleAddNewAircraft}
                  disabled={!newAircraftInput.trim()}
                >
                  Add Aircraft
                </button>
              </div>
            )}

            <label htmlFor="duration">Flight Duration* (e.g., 1:30):</label>
            <input
              id="duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="HH:MM"
              required
            />

            <AirportAutoComplete
              airports={airportData}
              label="Departure Airport*:"
              value={departure}
              onChange={setDeparture}
            />

            {/* Stops input fields */}
            {stops.map((stop, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <AirportAutoComplete
                  airports={airportData}
                  label={`Stop ${index + 1}:`}
                  value={stop}
                  onChange={(newValue) => {
                    const updatedStops = [...stops];
                    updatedStops[index] = newValue;
                    setStops(updatedStops);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedStops = stops.filter((_, i) => i !== index);
                    setStops(updatedStops);
                  }}
                  style={{
                    padding: "0.4rem 0.6rem",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    height: "fit-content",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setStops([...stops, ""])}
              className="add-stop-button"
              style={{ marginBottom: "1rem" }}
            >
              + Add Stop
            </button>

            <AirportAutoComplete
              airports={airportData}
              label="Arrival Airport*:"
              value={arrival}
              onChange={setArrival}
            />

            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details"
            />

            <button type="submit">
              {editingFlightId ? "Update Flight" : "Add Flight"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowFlightForm(false);
              }}
              className="cancel-button"
            >
              Cancel
            </button>
          </form>
        )}

        <hr style={{ margin: "2rem 0" }} />

        <h3>Logged Flights</h3>
        {flights.length === 0 && <p>No flights logged yet.</p>}
        <ul className="flights-list">
          {flights.map((f) => (
            <li key={f.id}>
              <strong>{f.pilotName}</strong>
              <div className="flight-details">
                <span>{f.date}</span>
                <span>{f.aircraft}</span>
                <span>{f.duration}</span>
                <span>
                  {[f.departure, ...(f.stops || []), f.arrival].join(" → ")}
                </span>
                <span>
                  ~{calculateFlightDistanceNM(airportData, f).toFixed(0)} NM
                </span>
              </div>

              {/* Show map/details only for the selected flight */}
              {selectedFlight?.id === f.id && (
                <div style={{ marginTop: "2rem" }}>
                  <h3>Flight Details for {selectedFlight.pilotName}</h3>
                  <FlightMap flight={selectedFlight} airports={airportData} />
                </div>
              )}

              {f.notes && <p>{f.notes}</p>}

              <div className="flight-actions">
                <button onClick={() => handleEdit(f)}>Edit</button>
                <button onClick={() => handleDelete(f.id)}>Delete</button>
                <button
                  onClick={() =>
                    setSelectedFlight(selectedFlight?.id === f.id ? null : f)
                  }
                >
                  {selectedFlight?.id === f.id
                    ? "Hide Details"
                    : "More Details"}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="total-flight-time">
          Total Flight Time: {totalDuration} hour(s)
        </div>
        <div className="total-flight-time">
          Total Flight Time: ~{totalDuration} hour(s) <br />
          Total Miles Flown: ~{roundedNM} NM
        </div>
      </div>
    </IonContent>
  );
};

export default Flights;
