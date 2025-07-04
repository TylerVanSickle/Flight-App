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
        <h2>Hey There Aviator 👋</h2>
        <p>
          Welcome to your dashboard where you can manage your fleet, view
          analytics, and access all the features of your application.
        </p>

        {/* You can add cool cards, stats, or graphics here */}
      </IonContent>
    </IonPage>
  );
};

export default Home;
