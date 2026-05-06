import { Code2Icon, LoaderIcon, LockIcon, MailIcon, SendIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { PROBLEMS } from "../data/problems";

function InviteSessionModal({
  isOpen,
  onClose,
  onSendInvite,
  isSending,
}) {
  const problems = Object.values(PROBLEMS);
  const [config, setConfig] = useState({ problem: "", difficulty: "", inviteeEmail: "" });
  const [inviteSent, setInviteSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");

  if (!isOpen) return null;

  const handleProblemChange = (e) => {
    const selectedProblem = problems.find((p) => p.title === e.target.value);
    setConfig({ ...config, problem: e.target.value, difficulty: selectedProblem?.difficulty || "" });
  };

  const handleSubmit = () => {
    if (!config.problem || !config.inviteeEmail) return;
    onSendInvite(config, {
      onSuccess: () => {
        setSentToEmail(config.inviteeEmail);
        setInviteSent(true);
      },
    });
  };

  const handleClose = () => {
    setConfig({ problem: "", difficulty: "", inviteeEmail: "" });
    setInviteSent(false);
    setSentToEmail("");
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <LockIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">Private Interview Session</h3>
            <p className="text-sm text-base-content/60">
              Invite a specific candidate — only they can join via the link
            </p>
          </div>
        </div>

        {inviteSent ? (
          /* ── SUCCESS STATE ── */
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
              <MailIcon className="w-10 h-10 text-success" />
            </div>
            <h4 className="text-xl font-bold text-base-content mb-2">Invitation Sent! ✓</h4>
            <p className="text-base-content/60 mb-1">
              A private session link has been sent to:
            </p>
            <p className="font-semibold text-primary text-lg mb-4">{sentToEmail}</p>
            <div className="alert alert-info text-sm text-left">
              <div>
                <p className="font-semibold mb-1">📌 Important</p>
                <ul className="list-disc list-inside space-y-1 text-base-content/80">
                  <li>The candidate must click the link in their email inbox</li>
                  <li>They must be logged in to CodeX with that exact email</li>
                  <li>The link expires once the session ends</li>
                  <li>The problem is <strong>not shown</strong> in the email — only you know it</li>
                </ul>
              </div>
            </div>
            <div className="modal-action justify-center mt-6">
              <button className="btn btn-primary px-8" onClick={handleClose}>
                Go to Session
              </button>
            </div>
          </div>
        ) : (
          /* ── FORM STATE ── */
          <div className="space-y-6">
            {/* PROBLEM SELECTION */}
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold">Select Problem</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <select
                className="select w-full"
                value={config.problem}
                onChange={handleProblemChange}
              >
                <option value="" disabled>Choose a coding problem...</option>
                {problems.map((problem) => (
                  <option key={problem.id} value={problem.title}>
                    {problem.title} ({problem.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* CANDIDATE EMAIL */}
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold">Candidate's Email</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="candidate@example.com"
                  value={config.inviteeEmail}
                  onChange={(e) => setConfig({ ...config, inviteeEmail: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <p className="text-xs text-base-content/50 flex items-center gap-1.5">
                <LockIcon className="w-3 h-3" />
                A unique join link will be emailed to this address. The problem will NOT be shown.
              </p>
            </div>

            {/* SESSION SUMMARY */}
            {config.problem && (
              <div className="alert bg-violet-500/10 border border-violet-500/30 text-sm">
                <Code2Icon className="w-4 h-4 text-violet-400 shrink-0" />
                <div>
                  <p className="font-semibold text-base-content">Session Preview</p>
                  <p className="text-base-content/70">
                    Problem: <span className="font-medium text-base-content">{config.problem}</span>
                    {" · "}
                    <span className={`badge badge-sm ${
                      config.difficulty === "easy" ? "badge-success" :
                      config.difficulty === "medium" ? "badge-warning" : "badge-error"
                    }`}>
                      {config.difficulty}
                    </span>
                  </p>
                  <p className="text-base-content/70 mt-0.5">
                    Only the invited candidate can join this session.
                  </p>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary gap-2"
                onClick={handleSubmit}
                disabled={isSending || !config.problem || !config.inviteeEmail}
              >
                {isSending ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                {isSending ? "Sending Invite..." : "Send Invite & Create Session"}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Backdrop only closes when not sending */}
      {!isSending && !inviteSent && (
        <div className="modal-backdrop" onClick={handleClose} />
      )}
    </div>
  );
}

export default InviteSessionModal;
