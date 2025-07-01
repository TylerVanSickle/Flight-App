import React, { useEffect, useState } from "react";
import {
  Route,
  Switch,
  Redirect,
  useHistory,
  useLocation,
} from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonButton,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import {
  airplane,
  documentText,
  calculator,
  cloudy,
  moonOutline,
  sunnyOutline,
  home,
  logOutOutline,
  personCircleOutline,
  checkmark,
} from "ionicons/icons";

import Aircraft from "./pages/Aircraft";
import Flights from "./pages/Flights";
import WeightBalance from "./pages/WeightBalance";
import Crosswind from "./pages/Crosswind";
import SignIn from "./pages/SignIn";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PreFlightChecklist from "./pages/Checklist"; // Import your checklist page

import { supabase } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

import "./theme/variables.css";

setupIonicReact();

const DARK_MODE_KEY = "dark-mode";

const routeTitles: Record<string, string> = {
  "/home": "Home",
  "/aircraft": "Aircraft",
  "/flights": "Flights",
  "/weightbalance": "Weight & Balance",
  "/crosswind": "Crosswind",
  "/checklist": "Pre-Flight Checklist", // Add checklist title
};

const AppContent: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      return saved === "true";
    }
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem(DARK_MODE_KEY, isDarkMode ? "true" : "false");
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Set loading false once session is fetched
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        history.push("/"); // Redirect to sign-in if logged out
      }
    });

    return () => subscription.unsubscribe();
  }, [history]);

  const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    history.push("/"); // Redirect to login after logout
  };

  const unauthenticatedAllowedPaths = ["/", "/reset-password"];

  if (loading) {
    return <div>Loading...</div>; // You can customize this loading state.
  }

  if (!session && !unauthenticatedAllowedPaths.includes(location.pathname)) {
    return <Redirect to="/" />;
  }

  // Always allow access to reset-password page
  if (location.pathname === "/reset-password") {
    return <ResetPassword />;
  }

  if (!session) {
    return <SignIn onSignInSuccess={() => history.push("/home")} />;
  }

  // Get current page title or fallback
  const currentPath = location.pathname.toLowerCase();
  const pageTitle = routeTitles[currentPath] || "Pilot Toolbox";

  return (
    <>
      {/* Fixed header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: 0,
          height: "3.5rem",
          backgroundColor: isDarkMode ? "#222" : "#f8f8f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          zIndex: 1000,
          userSelect: "none",
        }}
      >
        {/* Left side: User icon and page title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <IonButton
            size="small"
            fill="clear"
            aria-label="Profile"
            onClick={() => history.push("/profile")}
            style={{ fontSize: "1.5rem", padding: 0 }}
          >
            <IonIcon icon={personCircleOutline} />
          </IonButton>
          <h1
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: isDarkMode ? "white" : "black",
            }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Right side: Dark mode toggle and logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <IonButton
            size="small"
            onClick={handleToggleDarkMode}
            fill="clear"
            aria-label="Toggle dark mode"
          >
            <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} />
          </IonButton>

          <IonButton
            size="small"
            color="danger"
            onClick={handleLogout}
            fill="clear"
            aria-label="Logout"
          >
            <IonIcon icon={logOutOutline} />
            <IonLabel>Logout</IonLabel>
          </IonButton>
        </div>
      </header>

      {/* Push content down so header doesn’t overlap */}
      <div style={{ paddingTop: "3.5rem" }}>
        <IonTabs>
          <IonRouterOutlet>
            <Switch>
              <Route exact path="/home" component={Home} />
              <Route exact path="/aircraft" component={Aircraft} />
              <Route exact path="/flights" component={Flights} />
              <Route exact path="/weightbalance" component={WeightBalance} />
              <Route exact path="/crosswind" component={Crosswind} />
              <Route exact path="/checklist" component={PreFlightChecklist} />
              <Route exact path="/profile" component={Profile} />{" "}
              {/* Put this here */}
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
              <Route path="*">
                <Redirect to="/home" />
              </Route>
            </Switch>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="Home" href="/home">
              <IonIcon icon={home} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="aircraft" href="/aircraft">
              <IonIcon icon={airplane} />
              <IonLabel>Aircraft</IonLabel>
            </IonTabButton>
            <IonTabButton tab="flights" href="/flights">
              <IonIcon icon={documentText} />
              <IonLabel>Flights</IonLabel>
            </IonTabButton>
            <IonTabButton tab="weightbalance" href="/weightbalance">
              <IonIcon icon={calculator} />
              <IonLabel>W&B</IonLabel>
            </IonTabButton>
            <IonTabButton tab="crosswind" href="/crosswind">
              <IonIcon icon={cloudy} />
              <IonLabel>Crosswind</IonLabel>
            </IonTabButton>
            <IonTabButton tab="checklist" href="/checklist">
              <IonIcon icon={checkmark} />
              <IonLabel>Checklists</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <AppContent />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
