import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonInput,
} from "@ionic/react";
import {
  addOutline,
  searchOutline,
  trashOutline,
  pencilOutline,
  closeOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { supabase } from "../supabaseClient";
import "./Aircraft.css";
import EnvelopeEditor from "../components/EnvelopeEditor";

interface Aircraft {
  id: string;
  name: string;
  tail_num: string;
  bew: number;
  arm: number;
  moment: number;
  cg_min: number; // ✅ new
  cg_max: number; // ✅ new
  weight_min: number; // ✅ new
  weight_max: number; // ✅ new
}

const Aircraft: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [filteredAircraft, setFilteredAircraft] = useState<Aircraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTailNum, setEditTailNum] = useState("");
  const [editBEW, setEditBEW] = useState("");
  const [editArm, setEditArm] = useState("");
  const [editMoment, setEditMoment] = useState("");
  const [editCgMin, setEditCgMin] = useState("");
  const [editCgMax, setEditCgMax] = useState("");
  const [editWeightMin, setEditWeightMin] = useState("");
  const [editWeightMax, setEditWeightMax] = useState("");

  const [name, setName] = useState("");
  const [tailNum, setTailNum] = useState("");
  const [bew, setBEW] = useState("");
  const [arm, setArm] = useState("");
  const [moment, setMoment] = useState("");
  const [cgMin, setCgMin] = useState("");
  const [cgMax, setCgMax] = useState("");
  const [weightMin, setWeightMin] = useState("");
  const [weightMax, setWeightMax] = useState("");

  const [selectedAircraftForEnvelope, setSelectedAircraftForEnvelope] =
    useState<Aircraft | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchAircraft();
  }, []);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  useEffect(() => {
    const filtered = aircraftList.filter((ac) => {
      const query = searchQuery.toLowerCase();
      return (
        ac.name.toLowerCase().includes(query) ||
        ac.tail_num.toLowerCase().includes(query)
      );
    });
    setFilteredAircraft(filtered);
  }, [searchQuery, aircraftList]);

  const fetchAircraft = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not authenticated", userError);
      return;
    }
    const { data, error } = await supabase
      .from("aircraft")
      .select("*") // ✅ all fields pulled
      .eq("user_id", user.id);
    if (error) {
      console.error("Error fetching aircraft:", error);
    } else {
      setAircraftList(data || []);
      setFilteredAircraft(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add an aircraft.");
      return;
    }
    const { error } = await supabase.from("aircraft").insert([
      {
        name,
        tail_num: tailNum,
        bew: parseFloat(bew),
        arm: parseFloat(arm),
        moment: parseFloat(moment),
        cg_min: parseFloat(cgMin),
        cg_max: parseFloat(cgMax),
        weight_min: parseFloat(weightMin),
        weight_max: parseFloat(weightMax),
        user_id: user.id,
      },
    ]);
    if (error) {
      console.error("Error adding aircraft:", error);
    } else {
      setName("");
      setTailNum("");
      setBEW("");
      setArm("");
      setMoment("");
      setCgMin("");
      setCgMax("");
      setWeightMin("");
      setWeightMax("");
      setShowForm(false);
      fetchAircraft();
    }
  };

  const startEdit = (ac: Aircraft) => {
    setEditingId(ac.id);
    setEditName(ac.name);
    setEditTailNum(ac.tail_num);
    setEditBEW(ac.bew.toString());
    setEditArm(ac.arm.toString());
    setEditMoment(ac.moment.toString());
    setEditCgMin(ac.cg_min.toString());
    setEditCgMax(ac.cg_max.toString());
    setEditWeightMin(ac.weight_min.toString());
    setEditWeightMax(ac.weight_max.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditTailNum("");
    setEditBEW("");
    setEditArm("");
    setEditMoment("");
    setEditCgMin("");
    setEditCgMax("");
    setEditWeightMin("");
    setEditWeightMax("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in.");
      return;
    }
    const { error } = await supabase
      .from("aircraft")
      .update({
        name: editName,
        tail_num: editTailNum,
        bew: parseFloat(editBEW),
        arm: parseFloat(editArm),
        moment: parseFloat(editMoment),
        cg_min: parseFloat(editCgMin),
        cg_max: parseFloat(editCgMax),
        weight_min: parseFloat(editWeightMin),
        weight_max: parseFloat(editWeightMax),
      })
      .eq("id", editingId)
      .eq("user_id", user.id);
    if (error) {
      console.error("Error updating aircraft:", error);
    } else {
      cancelEdit();
      fetchAircraft();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this aircraft?"))
      return;
    const { error } = await supabase.from("aircraft").delete().eq("id", id);
    if (error) {
      console.error("Delete failed:", error);
    } else {
      if (editingId === id) cancelEdit();
      fetchAircraft();
    }
  };

  return (
    <IonPage className="content-wrapper">
      <IonHeader>
        <IonToolbar></IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="aircraft-toolbar">
          <div className="aircraft-title">Your Aircraft</div>
          <div className="aircraft-actions">
            {searchActive && (
              <IonInput
                className={`aircraft-search-input ${
                  searchActive ? "active" : ""
                }`}
                value={searchQuery}
                placeholder="Search"
                onIonChange={(e) => setSearchQuery(e.detail.value!)}
                clearInput
                debounce={250}
              />
            )}
            <IonButton
              fill="clear"
              onClick={() => setSearchActive(!searchActive)}
              className="icon-button"
            >
              <IonIcon icon={searchOutline} />
            </IonButton>
            <IonButton
              fill="clear"
              onClick={() => setShowForm(!showForm)}
              className="icon-button"
            >
              <IonIcon icon={addOutline} />
            </IonButton>
          </div>
        </div>

        <div className="page-subheading">Manage and customize your fleet.</div>

        {showForm && (
          <>
            <h2 className="form-header">Add New Aircraft</h2>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="aircraft-form"
            >
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="Name"
                  value={name}
                  required
                  onIonChange={(e) => setName(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="Tail Number"
                  value={tailNum}
                  required
                  onIonChange={(e) => setTailNum(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="BEW"
                  type="number"
                  value={bew}
                  required
                  onIonChange={(e) => setBEW(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="Arm"
                  type="number"
                  value={arm}
                  required
                  onIonChange={(e) => setArm(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="Moment"
                  type="number"
                  value={moment}
                  required
                  onIonChange={(e) => setMoment(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="CG Min"
                  type="number"
                  value={cgMin}
                  required
                  onIonChange={(e) => setCgMin(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="CG Max"
                  type="number"
                  value={cgMax}
                  required
                  onIonChange={(e) => setCgMax(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="Weight Min"
                  type="number"
                  value={weightMin}
                  required
                  onIonChange={(e) => setWeightMin(e.detail.value!)}
                />
              </IonItem>
              <IonItem className="aircraft-input">
                <IonInput
                  placeholder="Weight Max"
                  type="number"
                  value={weightMax}
                  required
                  onIonChange={(e) => setWeightMax(e.detail.value!)}
                />
              </IonItem>
              <IonItem lines="none" className="aircraft-submit">
                <IonButton expand="block" type="submit">
                  Add Aircraft
                </IonButton>
              </IonItem>
            </form>
          </>
        )}

        <IonList className="aircraft-list">
          {filteredAircraft.map((ac) => (
            <IonItem key={ac.id} className="aircraft-list-item">
              {editingId === ac.id ? (
                <div className="aircraft-edit-row">
                  <IonInput
                    value={editName}
                    placeholder="Name"
                    onIonChange={(e) => setEditName(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editTailNum}
                    placeholder="Tail Number"
                    onIonChange={(e) => setEditTailNum(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editBEW}
                    placeholder="BEW"
                    type="number"
                    onIonChange={(e) => setEditBEW(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editArm}
                    placeholder="Arm"
                    type="number"
                    onIonChange={(e) => setEditArm(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editMoment}
                    placeholder="Moment"
                    type="number"
                    onIonChange={(e) => setEditMoment(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editCgMin}
                    placeholder="CG Min"
                    type="number"
                    onIonChange={(e) => setEditCgMin(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editCgMax}
                    placeholder="CG Max"
                    type="number"
                    onIonChange={(e) => setEditCgMax(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editWeightMin}
                    placeholder="Weight Min"
                    type="number"
                    onIonChange={(e) => setEditWeightMin(e.detail.value!)}
                    className="edit-input"
                  />
                  <IonInput
                    value={editWeightMax}
                    placeholder="Weight Max"
                    type="number"
                    onIonChange={(e) => setEditWeightMax(e.detail.value!)}
                    className="edit-input"
                  />
                  <div className="edit-buttons">
                    <IonButton size="small" onClick={saveEdit} color="success">
                      <IonIcon icon={checkmarkOutline} />
                    </IonButton>
                    <IonButton size="small" onClick={cancelEdit} color="medium">
                      <IonIcon icon={closeOutline} />
                    </IonButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="aircraft-list-info">
                    <strong>{ac.name}</strong> – {ac.tail_num}
                    <div className="aircraft-list-details">
                      BEW: {ac.bew} | Arm: {ac.arm} | Moment: {ac.moment} | CG:{" "}
                      {ac.cg_min}–{ac.cg_max} | W: {ac.weight_min}–
                      {ac.weight_max}
                    </div>
                  </div>
                  <div className="aircraft-list-actions">
                    <IonButton
                      fill="clear"
                      onClick={() => startEdit(ac)}
                      aria-label="Edit Aircraft"
                    >
                      <IonIcon icon={pencilOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      onClick={() => handleDelete(ac.id)}
                      aria-label="Delete Aircraft"
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      onClick={() => setSelectedAircraftForEnvelope(ac)}
                    >
                      ✏️ Envelope
                    </IonButton>
                  </div>
                </>
              )}
            </IonItem>
          ))}
        </IonList>

        {selectedAircraftForEnvelope && (
          <div style={{ padding: "20px" }}>
            <EnvelopeEditor aircraft={selectedAircraftForEnvelope} />
            <IonButton
              color="medium"
              onClick={() => setSelectedAircraftForEnvelope(null)}
            >
              Close Envelope Editor
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Aircraft;
