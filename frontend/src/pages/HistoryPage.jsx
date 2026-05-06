import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import { HistoryIcon, Loader2Icon, ArrowRightIcon, BriefcaseIcon, PlayCircleIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { getInterviewHistory } from "../api/mockInterview";
import toast from "react-hot-toast";
import { format } from "date-fns";

function HistoryPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await getToken();
      const res = await getInterviewHistory(token);
      setHistory(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 mt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <HistoryIcon className="size-8 text-primary" />
              Interview History
            </h1>
            <p className="text-base-content/60 mt-2">
              Review your past mock interviews and track your progress.
            </p>
          </div>
          <Link to="/mock-interview" className="btn btn-primary">
            New Interview
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-20">
            <Loader2Icon className="size-12 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-base-100 rounded-2xl shadow-sm border border-base-300">
            <BriefcaseIcon className="size-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Interviews Yet</h3>
            <p className="text-base-content/60 mb-6">You haven't taken any mock interviews. Start one today!</p>
            <Link to="/mock-interview" className="btn btn-primary">Start Now</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((interview) => {
              const isCompleted = interview.status === "completed";
              const destination = isCompleted
                ? `/mock-interview/report/${interview._id}`
                : `/mock-interview/session/${interview._id}`;

              return (
                <div
                  key={interview._id}
                  className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(destination)}
                >
                  <div className="card-body flex-row items-center p-6 gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{interview.role}</h3>
                        <div className={`badge ${isCompleted ? "badge-success" : "badge-warning"} badge-sm`}>
                          {interview.status}
                        </div>
                      </div>
                      <p className="text-sm text-base-content/60">
                        {interview.experience} Years Exp • {interview.interviewType}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-base-content/50 mb-1">
                        {format(new Date(interview.createdAt), "MMM d, yyyy")}
                      </p>
                      {isCompleted && interview.feedback?.score !== undefined ? (
                        <div className="font-bold text-lg text-primary">
                          Score: {interview.feedback.score}/10
                        </div>
                      ) : !isCompleted ? (
                        <div className="text-sm text-warning font-medium flex items-center gap-1 justify-end">
                          <PlayCircleIcon className="size-4" /> Continue Session
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-center p-2 rounded-full bg-base-200">
                      <ArrowRightIcon className="size-5 text-base-content/70" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
