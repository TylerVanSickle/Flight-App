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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signedUp, setSignedUp] = useState(false); // to track sign-up success message

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking user existence:", selectError);
      return false;
    }

    if (!existingUser) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
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

    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg("Please enter your full name.");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const success = await ensureUserRecord();
        if (!success)
          throw new Error("Failed to ensure user record on sign-in");

        if (onSignInSuccess) onSignInSuccess();
        history.push("/home"); // redirect after successful sign-in
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/reset-password`,
          },
        });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              username: email.split("@")[0],
              full_name: `${firstName} ${lastName}`,
              avatar_url: "",
            });
          if (profileError) {
            console.error("Error creating profile:", profileError);
          }

          // Show message and prevent auto sign-in or redirect
          setSignedUp(true);
        }
      }
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

  const handleForgotPassword = async () => {
    setErrorMsg(null); // clear previous messages

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter your email to reset password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg("Password reset email sent! Check your inbox.");
    }
  };

  return (
    <div className="signin-container">
      <h2>{mode === "signin" ? "Sign In" : "Sign Up"}</h2>

      {mode === "signup" && !signedUp && (
        <>
          <label htmlFor="firstName" className="signin-label">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="signin-input"
          />

          <label htmlFor="lastName" className="signin-label">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="signin-input"
          />
        </>
      )}

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
        disabled={signedUp} // disable inputs after signup success to prevent changes
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
        disabled={signedUp}
      />

      {mode === "signin" && (
        <div className="signin-forgot">
          <button
            type="button"
            className="forgot-password-button"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>
      )}

      {errorMsg && <div className="signin-error">{errorMsg}</div>}

      {signedUp && (
        <div className="signin-success">
          Sign-up successful! Please check your email to confirm your account.
        </div>
      )}

      {!signedUp && (
        <button
          onClick={handleAuth}
          disabled={
            loading ||
            !email ||
            !password ||
            (mode === "signup" && (!firstName.trim() || !lastName.trim()))
          }
          className="signin-button"
        >
          {loading
            ? "Please wait..."
            : mode === "signin"
            ? "Sign In"
            : "Sign Up"}
        </button>
      )}

      <div className="signin-switch-mode">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setSignedUp(false);
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
                setSignedUp(false);
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
