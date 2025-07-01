import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCheckbox,
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import "./Checklist.css";

// Define types
type ChecklistItem = {
  task: string;
  completed: boolean;
};

type AircraftChecklists = {
  [key: string]: {
    [phase: string]: ChecklistItem[];
  };
};

// Aircraft-specific checklists
const aircraftChecklists: AircraftChecklists = {
  "Cessna 172": {
    "Outside Preflight": [
      { task: "Check fuel quantity", completed: false },
      { task: "Check tire pressure", completed: false },
      { task: "Check pitot tube", completed: false },
      { task: "Inspect control surfaces", completed: false },
      { task: "Check for visible damage", completed: false },
    ],
    "Inside Preflight": [
      { task: "Verify instruments", completed: false },
      { task: "Check avionics", completed: false },
      { task: "Set flight plan in GPS", completed: false },
      { task: "Set transponder code", completed: false },
      { task: "Check communication radios", completed: false },
      { task: "Check altimeter setting", completed: false },
    ],
    "Run Up": [
      { task: "Test throttle", completed: false },
      { task: "Check magnetos", completed: false },
      { task: "Verify RPM drop on both magnetos", completed: false },
      {
        task: "Check engine parameters (oil temp, fuel pressure)",
        completed: false,
      },
    ],
    "Take Off": [
      { task: "Set flaps to take-off position", completed: false },
      { task: "Check trim settings", completed: false },
      { task: "Verify seatbelts and harnesses", completed: false },
      { task: "Verify flight controls free and correct", completed: false },
      { task: "Set takeoff power settings", completed: false },
      { task: "Verify departure route", completed: false },
    ],
    "Mid Flight": [
      { task: "Monitor fuel consumption", completed: false },
      { task: "Check engine parameters", completed: false },
      { task: "Monitor cabin pressure", completed: false },
      { task: "Verify fuel tank levels", completed: false },
    ],
    Landing: [
      { task: "Check landing gear position", completed: false },
      { task: "Verify approach speeds", completed: false },
      { task: "Perform landing briefing", completed: false },
      { task: "Check for wind conditions", completed: false },
      { task: "Ensure landing lights are on", completed: false },
      { task: "Confirm altitude and approach path", completed: false },
    ],
  },
  // Add more aircraft models as needed...
};

const PreFlightChecklist: React.FC = () => {
  const [selectedAircraft, setSelectedAircraft] =
    useState<string>("Cessna 172");
  const [selectedPhase, setSelectedPhase] =
    useState<string>("Outside Preflight");
  const [checklist, setChecklist] = useState(
    aircraftChecklists[selectedAircraft][selectedPhase]
  );
  const [newTask, setNewTask] = useState("");

  const handleAircraftChange = (e: CustomEvent) => {
    const selectedAircraft = e.detail.value;
    setSelectedAircraft(selectedAircraft);

    // Check if the selected phase exists for the new aircraft
    const validPhase = aircraftChecklists[selectedAircraft][selectedPhase]
      ? selectedPhase
      : "Outside Preflight"; // Fallback to a default phase

    setSelectedPhase(validPhase); // Set phase to valid one
    setChecklist(aircraftChecklists[selectedAircraft][validPhase]); // Load the checklist for the valid phase
  };

  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    setChecklist(aircraftChecklists[selectedAircraft][phase]); // Load the selected phase for the current aircraft
  };

  const toggleTask = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setChecklist(newChecklist);
  };

  const addTask = () => {
    if (newTask.trim() !== "") {
      const newChecklist = [...checklist, { task: newTask, completed: false }];
      setChecklist(newChecklist);
      setNewTask(""); // Clear input
    }
  };

  const removeTask = (index: number) => {
    const newChecklist = checklist.filter((_, i) => i !== index); // Remove the task at the specified index
    setChecklist(newChecklist);
  };

  const saveChecklist = () => {
    console.log("Checklist saved:", checklist);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pre-Flight Checklist</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="checklist-page">
          <h1>Pre-Flight Checklist</h1>

          {/* Aircraft Selector */}
          <IonSelect
            value={selectedAircraft}
            onIonChange={handleAircraftChange}
            placeholder="Select Aircraft"
          >
            <IonSelectOption value="Cessna 172">Cessna 172</IonSelectOption>
            <IonSelectOption value="Piper PA-28">Piper PA-28</IonSelectOption>
            <IonSelectOption value="Cirrus SR22">Cirrus SR22</IonSelectOption>
          </IonSelect>

          {/* Phase Navigation */}
          <div className="phase-navigation">
            <IonButton onClick={() => handlePhaseChange("Outside Preflight")}>
              Outside Preflight
            </IonButton>
            <IonButton onClick={() => handlePhaseChange("Inside Preflight")}>
              Inside Preflight
            </IonButton>
            <IonButton onClick={() => handlePhaseChange("Run Up")}>
              Run Up
            </IonButton>
            <IonButton onClick={() => handlePhaseChange("Take Off")}>
              Take Off
            </IonButton>
            <IonButton onClick={() => handlePhaseChange("Mid Flight")}>
              Mid Flight
            </IonButton>
            <IonButton onClick={() => handlePhaseChange("Landing")}>
              Landing
            </IonButton>
          </div>

          <IonList>
            {checklist.map((item: ChecklistItem, index: number) => (
              <IonItem key={index}>
                <IonCheckbox
                  checked={item.completed}
                  onIonChange={() => toggleTask(index)}
                />
                <IonLabel>{item.task}</IonLabel>
                <IonButton
                  color="danger"
                  onClick={() => removeTask(index)}
                  slot="end"
                >
                  Remove
                </IonButton>
              </IonItem>
            ))}
          </IonList>

          <div className="add-task">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter new task"
            />
            <IonButton expand="block" onClick={addTask}>
              Add Task
            </IonButton>
          </div>

          <IonButton expand="block" onClick={saveChecklist}>
            Save Checklist
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PreFlightChecklist;
