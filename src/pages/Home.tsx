// src/pages/Home.tsx
import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";

const Home: React.FC = () => {
  return (
    <IonPage className="content-wrapper">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome to Your Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <h2>Hello Pilot 👋</h2>
        <p>
          Welcome back! Use the tabs below to manage your aircraft, flights,
          weight & balance, and more.
        </p>

        {/* You can add cool cards, stats, or graphics here */}
      </IonContent>
    </IonPage>
  );
};

export default Home;
