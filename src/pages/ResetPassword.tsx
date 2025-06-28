import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useHistory, useLocation } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [canReset, setCanReset] = useState(false);
  const [checking, setChecking] = useState(true);

  // Extract tokens from URL hash (Supabase puts tokens there after recovery)
  useEffect(() => {
    setChecking(true);
    const hashParams = new URLSearchParams(location.hash.replace("#", ""));
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ data, error }) => {
          if (error || !data.session) {
            setMessage(
              "Invalid or expired token. Please use the link from your email."
            );
            setCanReset(false);
          } else {
            setMessage(null);
            setCanReset(true);
          }
          setChecking(false);
        });
    } else {
      setMessage(
        "Invalid or missing token. Please use the link from your email."
      );
      setCanReset(false);
      setChecking(false);
    }
  }, [location]);

  const handlePasswordReset = async () => {
    setLoading(true);
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Update password for the current session
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated! Redirecting to sign in...");
      await supabase.auth.signOut();
      setTimeout(() => history.push("/"), 3000);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="signin-container">
        <p>Validating reset link...</p>
      </div>
    );
  }

  return (
    <div className="signin-container">
      <h2>Reset Password</h2>

      {message && <div className="signin-error">{message}</div>}

      {canReset && (
        <>
          <label htmlFor="new-password" className="signin-label">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="signin-input"
            placeholder="Enter your new password"
          />

          <label htmlFor="confirm-password" className="signin-label">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="signin-input"
            placeholder="Confirm your new password"
          />

          <button
            onClick={handlePasswordReset}
            className="signin-button"
            disabled={
              loading || newPassword.length < 6 || confirmPassword.length < 6
            }
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </>
      )}
    </div>
  );
};

export default ResetPassword;
