import React, { useState, useEffect, useCallback } from "react";
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
  IonInput,
} from "@ionic/react";
import { supabase } from "../supabaseClient"; // Assuming you have your Supabase client setup
import { v4 as uuidv4 } from "uuid"; // Importing UUID to generate unique ids
import "./Checklist.css";

// Define types for checklist items and aircraft data
type ChecklistItem = {
  id: string;
  task: string;
  completed: boolean;
};

type Aircraft = {
  id: string;
  name: string;
  tail_num: string;
};

// Define the structure of Preset 1
type Preset1 = {
  [phase: string]: { task: string; completed: boolean; id: string }[];
};

// Hardcoded checklist data for preset
const preset1: Preset1 = {
  "Outside Preflight": [
    { id: uuidv4(), task: "Check fuel quantity", completed: false },
    { id: uuidv4(), task: "Check tire pressure", completed: false },
    { id: uuidv4(), task: "Check pitot tube", completed: false },
    { id: uuidv4(), task: "Inspect control surfaces", completed: false },
    { id: uuidv4(), task: "Check for visible damage", completed: false },
  ],
  "Inside Preflight": [
    { id: uuidv4(), task: "Verify instruments", completed: false },
    { id: uuidv4(), task: "Check avionics", completed: false },
    { id: uuidv4(), task: "Set flight plan in GPS", completed: false },
    { id: uuidv4(), task: "Set transponder code", completed: false },
    { id: uuidv4(), task: "Check communication radios", completed: false },
    { id: uuidv4(), task: "Check altimeter setting", completed: false },
  ],
  "Run Up": [
    { id: uuidv4(), task: "Test throttle", completed: false },
    { id: uuidv4(), task: "Check magnetos", completed: false },
    {
      id: uuidv4(),
      task: "Verify RPM drop on both magnetos",
      completed: false,
    },
    {
      id: uuidv4(),
      task: "Check engine parameters (oil temp, fuel pressure)",
      completed: false,
    },
  ],
  "Take Off": [
    { id: uuidv4(), task: "Set flaps to take-off position", completed: false },
    { id: uuidv4(), task: "Check trim settings", completed: false },
    { id: uuidv4(), task: "Verify seatbelts and harnesses", completed: false },
    {
      id: uuidv4(),
      task: "Verify flight controls free and correct",
      completed: false,
    },
    { id: uuidv4(), task: "Set takeoff power settings", completed: false },
    { id: uuidv4(), task: "Verify departure route", completed: false },
  ],
  "Mid Flight": [
    { id: uuidv4(), task: "Monitor fuel consumption", completed: false },
    { id: uuidv4(), task: "Check engine parameters", completed: false },
    { id: uuidv4(), task: "Monitor cabin pressure", completed: false },
    { id: uuidv4(), task: "Verify fuel tank levels", completed: false },
  ],
  Landing: [
    { id: uuidv4(), task: "Check landing gear position", completed: false },
    { id: uuidv4(), task: "Verify approach speeds", completed: false },
    { id: uuidv4(), task: "Perform landing briefing", completed: false },
    { id: uuidv4(), task: "Check for wind conditions", completed: false },
    { id: uuidv4(), task: "Ensure landing lights are on", completed: false },
    {
      id: uuidv4(),
      task: "Confirm altitude and approach path",
      completed: false,
    },
  ],
};

const PreFlightChecklist: React.FC = () => {
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [selectedPhase, setSelectedPhase] =
    useState<string>("Outside Preflight");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);

  // Fetch aircraft data from Supabase
  const fetchAircraft = async () => {
    const { data, error } = await supabase.from("aircraft").select("*");
    if (error) {
      console.error("Error fetching aircraft:", error);
    } else {
      setAircraftList(data || []);
    }
  };

  // Fetch checklist data from Supabase or use preset if not found
  const fetchChecklist = useCallback(async () => {
    if (selectedAircraft) {
      const { data, error } = await supabase
        .from("aircraft_checklists")
        .select("*")
        .eq("aircraft_id", selectedAircraft)
        .eq("phase", selectedPhase);

      if (error) {
        console.error("Error fetching checklist:", error);
      } else {
        // If no checklist exists in Supabase, use preset
        if (data && data.length === 0) {
          const presetChecklist = preset1[selectedPhase];
          setChecklist(presetChecklist || []); // Use preset if no data
        } else {
          // Combine preset and Supabase data
          const presetChecklist = preset1[selectedPhase];
          const combinedChecklist = [
            ...(presetChecklist || []), // Preload the preset
            ...data, // Append custom user tasks from Supabase
          ];
          setChecklist(combinedChecklist); // Use combined data
        }
      }
    }
  }, [selectedAircraft, selectedPhase]);

  useEffect(() => {
    fetchAircraft(); // Fetch aircraft data on component mount
  }, []);

  useEffect(() => {
    if (selectedAircraft) {
      fetchChecklist(); // Fetch checklist for the selected aircraft and phase
    }
  }, [selectedAircraft, selectedPhase, fetchChecklist]);

  // Handle aircraft change
  const handleAircraftChange = (e: CustomEvent) => {
    setSelectedAircraft(e.detail.value);
  };

  // Handle phase change
  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    fetchChecklist(); // Fetch checklist for the new phase
  };

  // Add a new task
  const addTask = async () => {
    if (newTask.trim() !== "") {
      // Add to Supabase
      const { error } = await supabase.from("aircraft_checklists").insert([
        {
          aircraft_id: selectedAircraft,
          phase: selectedPhase,
          task: newTask,
          completed: false,
        },
      ]);
      if (error) {
        console.error("Error adding task:", error);
      } else {
        setNewTask(""); // Clear input field
        fetchChecklist(); // Refresh checklist
      }
    }
  };

  // Toggle task completion
  const toggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from("aircraft_checklists")
      .update({ completed: !completed })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
    } else {
      fetchChecklist(); // Refresh checklist
    }
  };

  // Remove a task
  const removeTask = async (taskId: string) => {
    const { error } = await supabase
      .from("aircraft_checklists")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("Error removing task:", error);
    } else {
      fetchChecklist(); // Refresh checklist
    }
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
            {aircraftList.map((ac) => (
              <IonSelectOption key={ac.id} value={ac.id}>
                {ac.name}
              </IonSelectOption>
            ))}
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
            {checklist.map((task) => (
              <IonItem key={task.id}>
                <IonCheckbox
                  checked={task.completed}
                  onIonChange={() => toggleTask(task.id, task.completed)}
                />
                <IonLabel>{task.task}</IonLabel>
                <IonButton
                  color="danger"
                  onClick={() => removeTask(task.id)}
                  slot="end"
                >
                  Remove
                </IonButton>
              </IonItem>
            ))}
          </IonList>

          <div className="add-task">
            <IonInput
              value={newTask}
              onIonChange={(e) => setNewTask(e.detail.value!)}
              placeholder="Enter new task"
            />
            <IonButton expand="block" onClick={addTask}>
              Add Task
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PreFlightChecklist;
