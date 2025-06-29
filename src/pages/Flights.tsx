import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Flights.css";

interface Flight {
  id: number;
  pilotName: string;
  date: string;
  aircraft: string;
  duration: string;
  departure: string;
  arrival: string;
  notes: string;
}

interface Aircraft {
  id: string;
  name: string;
  tail_num: string;
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

  // NEW: Show/hide flight form toggle
  const [showFlightForm, setShowFlightForm] = useState(false);

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to add or edit flights.");
      return;
    }

    if (editingFlightId) {
      const { error } = await supabase
        .from("flights")
        .update({
          pilotName: pilotName.trim(),
          date,
          aircraft_id: selectedAircraft,
          duration: duration.trim(),
          departure: departure.trim(),
          arrival: arrival.trim(),
          notes: notes.trim(),
        })
        .eq("id", editingFlightId);

      if (error) {
        alert("Failed to update flight");
        console.error(error);
      } else {
        setFlights((prev) =>
          prev.map((f) =>
            f.id === editingFlightId
              ? {
                  ...f,
                  pilotName: pilotName.trim(),
                  date,
                  aircraft: aircraftList.find((a) => a.id === selectedAircraft)
                    ? `${
                        aircraftList.find((a) => a.id === selectedAircraft)
                          ?.name
                      } (${
                        aircraftList.find((a) => a.id === selectedAircraft)
                          ?.tail_num
                      })`
                    : f.aircraft,
                  duration: duration.trim(),
                  departure: departure.trim(),
                  arrival: arrival.trim(),
                  notes: notes.trim(),
                }
              : f
          )
        );
        resetForm();
        setShowFlightForm(false); // hide form after update
      }
    } else {
      const { data, error } = await supabase
        .from("flights")
        .insert([
          {
            user_id: user.id,
            pilotName: pilotName.trim(),
            date,
            aircraft_id: selectedAircraft,
            duration: duration.trim(),
            departure: departure.trim(),
            arrival: arrival.trim(),
            notes: notes.trim(),
          },
        ])
        .select();

      if (error) {
        alert("Failed to add flight");
        console.error(error);
      } else if (data && data.length > 0) {
        const newFlight = data[0];
        const ac = aircraftList.find((a) => a.id === newFlight.aircraft_id);
        setFlights((prev) => [
          {
            ...newFlight,
            aircraft: ac ? `${ac.name} (${ac.tail_num})` : "Unknown",
          },
          ...prev,
        ]);
        resetForm();
        setShowFlightForm(false); // hide form after add
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
    setNotes("");
    setEditingFlightId(null);
    setAddingNewAircraft(false);
    setNewAircraftInput("");
  };

  const handleEdit = (flight: Flight) => {
    setEditingFlightId(flight.id);
    setPilotName(flight.pilotName);
    setDate(flight.date);
    const ac = aircraftList.find(
      (a) =>
        flight.aircraft.startsWith(a.name) &&
        flight.aircraft.includes(a.tail_num)
    );
    setSelectedAircraft(ac ? ac.id : "");
    setDuration(flight.duration);
    setDeparture(flight.departure);
    setArrival(flight.arrival);
    setNotes(flight.notes);
    setAddingNewAircraft(false);
    setShowFlightForm(true); // show form when editing
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
  // Helper function to convert "HH:MM" string to total minutes
  const durationToMinutes = (duration: string): number => {
    const [hours, minutes] = duration.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Helper function to convert total minutes back to "HH:MM" format
  const minutesToDuration = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Calculate total duration in minutes
  const totalMinutes = flights.reduce(
    (sum, flight) => sum + durationToMinutes(flight.duration),
    0
  );

  // Format total duration for display
  const totalDuration = minutesToDuration(totalMinutes);

  return (
    <div className="flights-page">
      <h2>Flight Log</h2>

      {/* NEW: Toggle button */}
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

      {/* Flight form */}
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

          <label htmlFor="departure">Departure Airport*:</label>
          <input
            id="departure"
            type="text"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            placeholder="ICAO/IATA code or airport name"
            required
          />

          <label htmlFor="arrival">Arrival Airport*:</label>
          <input
            id="arrival"
            type="text"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            placeholder="ICAO/IATA code or airport name"
            required
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
                {f.departure} → {f.arrival}
              </span>
            </div>

            {f.notes && <p>{f.notes}</p>}

            <div className="flight-actions">
              <button onClick={() => handleEdit(f)}>Edit</button>
              <button onClick={() => handleDelete(f.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="total-flight-time">
        Total Flight Time: {totalDuration} hour(s)
      </div>
    </div>
  );
};

export default Flights;
