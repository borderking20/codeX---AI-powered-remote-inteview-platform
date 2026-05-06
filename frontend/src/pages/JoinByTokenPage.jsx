import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useJoinByToken } from "../hooks/useSessions";
import { LockIcon, Loader2Icon, XCircleIcon, ShieldCheckIcon, LogInIcon } from "lucide-react";

/**
 * JoinByTokenPage — handles the magic invite link flow.
 *
 * Flow:
 * 1. User is NOT logged in  → show a friendly page asking them to log in / sign up
 *    via the homepage (Clerk handles auth there). Token is saved in URL.
 * 2. User IS logged in      → call joinByToken API
 *    a. Success             → navigate to /session/:id
 *    b. Error (wrong email, expired, full) → show a friendly error message
 */
function JoinByTokenPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const joinByTokenMutation = useJoinByToken();
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Only attempt join once Clerk has resolved the auth state
    if (!isLoaded) return;
    // Not signed in — the JSX below will show login prompt
    if (!isSignedIn) return;
    // Avoid re-triggering if already in progress or done
    if (joining || joinByTokenMutation.isSuccess || error) return;

    setJoining(true);
    joinByTokenMutation.mutate(token, {
      onSuccess: (data) => {
        navigate(`/session/${data.sessionId}`, { replace: true });
      },
      onError: (err) => {
        setError(err.response?.data?.message || "Invalid or expired invite link.");
        setJoining(false);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, token]);

  // ── Loading clerk ────────────────────────────────────────────────────────────
  if (!isLoaded) {
    return <LoadingScreen message="Loading..." />;
  }

  // ── Not signed in → show a friendly prompt to go to homepage for login/signup ─
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center px-4">
        <div className="card bg-base-100 shadow-2xl max-w-lg w-full">
          <div className="card-body items-center text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
              <LockIcon className="w-10 h-10 text-white" />
            </div>

            <h1 className="card-title text-2xl mb-2">
              Private Interview Invitation
            </h1>

            <p className="text-base-content/60 mb-6 leading-relaxed">
              You've been invited to a <strong className="text-base-content">private coding interview</strong> on CodeX. 
              To join, you need to <strong className="text-base-content">log in or create an account</strong> with the 
              email address that received this invitation.
            </p>

            {/* Info box */}
            <div className="alert text-sm text-left mb-6">
              <div>
                <p className="font-semibold mb-1">📌 Important:</p>
                <ul className="list-disc list-inside space-y-1 text-base-content/70">
                  <li>You must sign in with the <strong>same email</strong> that received the invite</li>
                  <li>If you're new to CodeX, you can create a free account</li>
                  <li>After signing in, you'll be redirected back here automatically</li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full">
              <button
                className="btn btn-primary gap-2 w-full text-base"
                onClick={() => {
                  // Save the invite token in sessionStorage so we can redirect back
                  localStorage.setItem("pendingInviteToken", token);
                  navigate("/");
                }}
              >
                <LogInIcon className="w-5 h-5" />
                Go to Login / Sign Up
              </button>

              <p className="text-xs text-base-content/40 text-center">
                You'll be redirected back to this invite after signing in
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center px-4">
        <div className="card bg-base-100 shadow-2xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-4">
              <XCircleIcon className="w-10 h-10 text-error" />
            </div>
            <h2 className="card-title text-2xl mb-2">Cannot Join Session</h2>
            <p className="text-base-content/70 mb-2">{error}</p>
            {user?.primaryEmailAddress?.emailAddress && (
              <p className="text-xs text-base-content/40 mb-4">
                You are currently logged in as: <strong>{user.primaryEmailAddress.emailAddress}</strong>
              </p>
            )}
            <button
              className="btn btn-primary w-full"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Joining in progress ──────────────────────────────────────────────────────
  return <LoadingScreen message="Verifying your invitation and joining the session..." />;
}

function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
        <ShieldCheckIcon className="w-10 h-10 text-white" />
      </div>
      <div className="text-center">
        <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-base-content/70 text-lg font-medium">{message}</p>
        <p className="text-base-content/40 text-sm mt-1">CodeX Private Interview</p>
      </div>
    </div>
  );
}

export default JoinByTokenPage;
