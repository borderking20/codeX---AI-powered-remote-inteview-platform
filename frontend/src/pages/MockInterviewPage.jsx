import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import { BriefcaseIcon, UploadIcon, PlayIcon, HistoryIcon, Loader2Icon } from "lucide-react";
import Navbar from "../components/Navbar";
import { startMockInterview } from "../api/mockInterview";
import toast from "react-hot-toast";

function MockInterviewPage() {
  const [role, setRole] = useState("Backend Developer");
  const [experience, setExperience] = useState(1);
  const [interviewType, setInterviewType] = useState("Technical");
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getToken } = useAuth();
  const navigate = useNavigate();

  const handleStart = async (e) => {
    e.preventDefault();
    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("role", role);
      formData.append("experience", experience);
      formData.append("interviewType", interviewType);
      formData.append("resume", resume);

      const res = await startMockInterview(formData, token);
      
      toast.success("Interview started!");
      navigate(`/mock-interview/session/${res.data._id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to start mock interview. Ensure your backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <BriefcaseIcon className="size-8 text-primary" />
              Mock Interview Practice
            </h1>
            <p className="text-base-content/60 mt-2">
              Practice real-world interviews with our advanced AI. Upload your resume and get started.
            </p>
          </div>
          <Link to="/mock-interview/history" className="btn btn-outline">
            <HistoryIcon className="size-4" />
            View History
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <form onSubmit={handleStart} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Target Role</span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="e.g. Full Stack Developer"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Years of Experience</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                      <option key={y} value={y}>{y} {y === 1 ? 'Year' : 'Years'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Interview Type</span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      className="radio radio-primary" 
                      checked={interviewType === "Technical"}
                      onChange={() => setInterviewType("Technical")}
                    />
                    <span>Technical</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      className="radio radio-primary" 
                      checked={interviewType === "HR"}
                      onChange={() => setInterviewType("HR")}
                    />
                    <span>HR / Behavioral</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Upload Resume (PDF/DOC)</span>
                </label>
                <div className="border-2 border-dashed border-base-300 rounded-xl p-8 text-center hover:bg-base-200/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setResume(e.target.files[0])}
                    required
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UploadIcon className="size-6 text-primary" />
                    </div>
                    {resume ? (
                      <div className="text-primary font-medium">{resume.name}</div>
                    ) : (
                      <>
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-base-content/60">PDF, DOC, DOCX up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg px-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="size-5 animate-spin" />
                      Preparing Interview...
                    </>
                  ) : (
                    <>
                      Start Mock Interview
                      <PlayIcon className="size-5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockInterviewPage;
