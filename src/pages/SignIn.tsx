// src/pages/SignIn.tsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useHistory } from "react-router-dom";
import "./SignIn.css";

interface SignInProps {
  onSignInSuccess?: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignInSuccess }) => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Email format validator
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Ensure user record exists in your 'users' table
  const ensureUserRecord = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not authenticated");
      return false;
    }

    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // PGRST116 = no rows found, which is okay here
    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking user existence:", selectError);
      return false;
    }

    if (!existingUser) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
        },
      ]);
      if (insertError) {
        console.error("Error creating user record:", insertError);
        return false;
      } else {
        console.log("User record created.");
      }
    } else {
      console.log("User record already exists.");
    }
    return true;
  };

  const handleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Ensure user record on sign in
        const success = await ensureUserRecord();
        if (!success)
          throw new Error("Failed to ensure user record on sign-in");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Insert a new profile for the user in 'profiles' table
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              username: email.split("@")[0], // example default username
              full_name: "",
              avatar_url: "",
            });
          if (profileError) {
            console.error("Error creating profile:", profileError);
          }

          // Explicitly sign in user after sign-up to create session
          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email,
              password,
            }
          );
          if (signInError) throw signInError;

          // Ensure user record after sign-in
          const success = await ensureUserRecord();
          if (!success)
            throw new Error("Failed to ensure user record on sign-up");
        }
      }
      if (onSignInSuccess) onSignInSuccess();
      history.push("/home"); // Redirect to Home after successful sign in/up
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <h2>{mode === "signin" ? "Sign In" : "Sign Up"}</h2>

      <label htmlFor="email" className="signin-label">
        Email
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="signin-input"
      />

      <label htmlFor="password" className="signin-label">
        Password
      </label>
      <input
        id="password"
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="signin-input"
      />

      {errorMsg && <div className="signin-error">{errorMsg}</div>}

      <button
        onClick={handleAuth}
        disabled={loading || !email || !password}
        className="signin-button"
      >
        {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
      </button>

      <div className="signin-switch-mode">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
              }}
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SignIn;
