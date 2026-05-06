import { useState } from "react";
import { useSubmitFeedback } from "../hooks/useSessions";
import { Loader2Icon, SendIcon, StarIcon, ClipboardCheckIcon } from "lucide-react";
import toast from "react-hot-toast";

const FEEDBACK_PARAMS = [
  {
    key: "problemSolving",
    label: "Problem Solving",
    icon: "🧠",
    description: "How well did the candidate approach and solve the problem?",
  },
  {
    key: "communication",
    label: "Communication",
    icon: "🗣️",
    description: "Clarity of thought, explanation of approach, and verbal skills.",
  },
  {
    key: "codeQuality",
    label: "Code Quality",
    icon: "💻",
    description: "Cleanliness, readability, correctness, and efficiency of code.",
  },
  {
    key: "timeManagement",
    label: "Time Management",
    icon: "⏱️",
    description: "Did they pace themselves well and use the time effectively?",
  },
  {
    key: "overallImpression",
    label: "Overall Impression",
    icon: "⭐",
    description: "Your overall assessment of the candidate's interview performance.",
  },
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            className={`transition-all duration-100 ${active ? "scale-110" : "scale-100"}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <StarIcon
              className={`w-8 h-8 transition-colors duration-100 ${
                active ? "fill-amber-400 text-amber-400" : "text-base-content/20"
              }`}
            />
          </button>
        );
      })}
      <span className={`ml-2 text-sm font-medium min-w-[70px] ${
        value ? "text-amber-400" : "text-base-content/40"
      }`}>
        {value ? `${RATING_LABELS[value]} (${value}/5)` : "Not rated"}
      </span>
    </div>
  );
}

/**
 * FeedbackModal — BLOCKING modal shown to the HOST after ending a private session.
 * Cannot be dismissed without submitting all 5 ratings.
 */
function FeedbackModal({ isOpen, sessionId, candidateName, onFeedbackSubmitted }) {
  const submitFeedbackMutation = useSubmitFeedback();
  const [ratings, setRatings] = useState({
    problemSolving: 0,
    communication: 0,
    codeQuality: 0,
    timeManagement: 0,
    overallImpression: 0,
  });

  if (!isOpen) return null;

  const allRated = Object.values(ratings).every((v) => v > 0);
  const avgRating = allRated
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1)
    : null;

  const handleSubmit = () => {
    if (!allRated) {
      toast.error("Please rate all 5 categories before submitting.");
      return;
    }

    submitFeedbackMutation.mutate(
      { sessionId, ratings },
      {
        onSuccess: (data) => {
          toast.success("Feedback submitted! Performance report sent to candidate. 🎉");
          onFeedbackSubmitted();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to submit feedback. Please try again.");
        },
      }
    );
  };

  return (
    <div className="modal modal-open z-[100]">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <ClipboardCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl">Interview Feedback Required</h3>
            <p className="text-sm text-base-content/60">
              Please rate <strong className="text-base-content">{candidateName || "the candidate"}</strong>'s performance before leaving
            </p>
          </div>
        </div>

        {/* Mandatory notice */}
        <div className="alert alert-warning text-sm mb-6">
          <span>
            ⚠️ <strong>This form is mandatory.</strong> An AI-generated performance report will be emailed to the candidate after you submit. You cannot skip this step.
          </span>
        </div>

        {/* Rating rows */}
        <div className="space-y-5">
          {FEEDBACK_PARAMS.map((param) => (
            <div
              key={param.key}
              className={`p-4 rounded-xl border transition-colors ${
                ratings[param.key]
                  ? "bg-base-200/60 border-primary/30"
                  : "bg-base-200 border-base-300"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{param.icon}</span>
                <div>
                  <p className="font-semibold text-base-content">{param.label}</p>
                  <p className="text-xs text-base-content/50">{param.description}</p>
                </div>
              </div>
              <StarRating
                value={ratings[param.key]}
                onChange={(val) => setRatings((prev) => ({ ...prev, [param.key]: val }))}
              />
            </div>
          ))}
        </div>

        {/* Summary */}
        {allRated && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60 font-medium">Average Score</p>
                <p className="text-3xl font-black text-emerald-400">{avgRating}<span className="text-base font-medium text-base-content/40">/5</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-base-content/60">An AI report will be emailed to</p>
                <p className="text-sm font-semibold text-primary">{candidateName || "the candidate"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit button — no cancel */}
        <div className="mt-6">
          <button
            className={`btn w-full gap-2 text-base ${allRated ? "btn-primary" : "btn-disabled"}`}
            onClick={handleSubmit}
            disabled={!allRated || submitFeedbackMutation.isPending}
          >
            {submitFeedbackMutation.isPending ? (
              <>
                <Loader2Icon className="w-5 h-5 animate-spin" />
                Generating AI Report & Sending Email...
              </>
            ) : (
              <>
                <SendIcon className="w-5 h-5" />
                Submit Feedback & Send Report to Candidate
              </>
            )}
          </button>

          {!allRated && (
            <p className="text-center text-xs text-base-content/40 mt-2">
              Rate all 5 categories to enable submission
            </p>
          )}
        </div>
      </div>
      {/* NO backdrop click handler — modal is intentionally blocking */}
    </div>
  );
}

export default FeedbackModal;
