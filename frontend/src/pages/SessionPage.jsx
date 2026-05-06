import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Loader2Icon, LogOutIcon, PhoneOffIcon } from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import FeedbackModal from "../components/FeedbackModal";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  // Feedback modal state (shown after ending a private session)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = session?.participant?.clerkId === user?.id;

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  // find the problem data based on session problem title
  const problemData = session?.problem
    ? Object.values(PROBLEMS).find((p) => p.title === session.problem)
    : null;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || "");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL.replace("/api", "");
    socketRef.current = io(socketUrl);

    socketRef.current.on("connect", () => {
      if (id) {
        socketRef.current.emit("join-session", id);
      }
    });

    socketRef.current.on("code-change", (newCode) => {
      setCode(newCode);
    });

    socketRef.current.on("language-change", (newLang) => {
      setSelectedLanguage(newLang);
    });

    socketRef.current.on("code-run-result", (result) => {
      setOutput(result);
      setIsRunning(false);
    });

    socketRef.current.on("participant-exited-fullscreen", () => {
      if (isHost) {
        toast.error("Warning: The interviewee has exited fullscreen mode!", { duration: 5000 });
      }
    });

    socketRef.current.on("participant-rejected-fullscreen", () => {
      if (isHost) {
        toast.error("Warning: The interviewee rejected to enter full screen mode!", { duration: 5000 });
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id, isHost]);

  // Handle Fullscreen events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (isParticipant) {
          socketRef.current?.emit("participant-exited-fullscreen", { sessionId: id });
          toast.error("You must remain in fullscreen mode during the interview.");
        }
      } else {
        setIsFullscreen(true);
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isParticipant, id]);

  // auto-join session if user is not already a participant and not the host
  // For private sessions, joinByToken already added the user as participant,
  // so isParticipant will be true and this will skip correctly.
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;

    // Don't auto-join private sessions — only the invite token flow can join them
    if (session.sessionType === "private") return;

    joinSessionMutation.mutate(id, { onSuccess: refetch });

    // remove the joinSessionMutation, refetch from dependencies to avoid infinite loop
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  // redirect the "participant" when session ends (NOT the host — host handles their own navigation)
  // Also don't redirect if the feedback modal is open (host filling out ratings)
  useEffect(() => {
    if (!session || loadingSession) return;
    if (showFeedbackModal) return; // host is filling out the feedback form

    if (session.status === "completed" && !isHost) navigate("/dashboard");
  }, [session, loadingSession, navigate, isHost, showFeedbackModal]);

  // update code when problem loads or changes
  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
    }
  }, [problemData, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    // use problem-specific starter code
    const starterCode = problemData?.starterCode?.[newLang] || "";
    setCode(starterCode);
    setOutput(null);

    // Emit changes via socket
    socketRef.current?.emit("language-change", { sessionId: id, language: newLang });
    socketRef.current?.emit("code-change", { sessionId: id, code: starterCode });
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current?.emit("code-change", { sessionId: id, code: value });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);

    // Emit run result via socket
    socketRef.current?.emit("code-run-result", { sessionId: id, output: result });
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      endSessionMutation.mutate(id, {
        onSuccess: () => {
          // For private sessions: show the mandatory feedback modal
          // For public sessions: go straight to dashboard
          if (session?.sessionType === "private" && session?.participant) {
            setShowFeedbackModal(true);
          } else {
            navigate("/dashboard");
          }
        },
      });
    }
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch((err) => {
      toast.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  };

  const rejectFullscreen = () => {
    socketRef.current?.emit("participant-rejected-fullscreen", { sessionId: id });
    toast.error("You declined fullscreen. The interviewer has been notified.");
  };

  // If the user is the participant and not in fullscreen, block the UI
  if (isParticipant && !isFullscreen) {
    return (
      <div className="h-screen bg-base-100 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Blurred background preview of the app behind the overlay */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none filter blur-sm">
          <Navbar />
          <div className="p-10"><div className="skeleton w-full h-96"></div></div>
        </div>
        
        <div className="z-10 bg-base-200 p-10 rounded-2xl shadow-2xl border border-base-300 max-w-lg text-center">
          <h2 className="text-3xl font-bold mb-4 text-base-content">Action Required</h2>
          <p className="text-base-content/70 mb-8">
            This interview session requires you to be in full screen mode to ensure a fair environment.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={rejectFullscreen} className="btn btn-outline btn-error">
              Decline
            </button>
            <button onClick={enterFullscreen} className="btn btn-primary">
              Enter Full Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              {/* PROBLEM DSC PANEL */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  {/* HEADER SECTION */}
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-3xl font-bold text-base-content">
                          {session?.problem || "Loading..."}
                        </h1>
                        {problemData?.category && (
                          <p className="text-base-content/60 mt-1">{problemData.category}</p>
                        )}
                        <p className="text-base-content/60 mt-2">
                          Host: {session?.host?.name || "Loading..."} •{" "}
                          {session?.participant ? 2 : 1}/2 participants
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`badge badge-lg ${getDifficultyBadgeClass(
                            session?.difficulty
                          )}`}
                        >
                          {session?.difficulty.slice(0, 1).toUpperCase() +
                            session?.difficulty.slice(1) || "Easy"}
                        </span>
                        {isHost && session?.status === "active" && (
                          <button
                            onClick={handleEndSession}
                            disabled={endSessionMutation.isPending}
                            className="btn btn-error btn-sm gap-2"
                          >
                            {endSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            End Session
                          </button>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-6 space-y-6 select-none"
                    onCopy={(e) => {
                      e.preventDefault();
                      toast.error("Copying is disabled during the interview!");
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v")) {
                        e.preventDefault();
                        toast.error("Keyboard shortcuts are disabled!");
                      }
                    }}
                    tabIndex={0}
                  >
                    {/* problem desc */}
                    {problemData?.description && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                        <div className="space-y-3 text-base leading-relaxed">
                          <p className="text-base-content/90">{problemData.description.text}</p>
                          {problemData.description.notes?.map((note, idx) => (
                            <p key={idx} className="text-base-content/90">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* examples section */}
                    {problemData?.examples && problemData.examples.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                        <div className="space-y-4">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-sm">{idx + 1}</span>
                                <p className="font-semibold text-base-content">Example {idx + 1}</p>
                              </div>
                              <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                <div className="flex gap-2">
                                  <span className="text-primary font-bold min-w-[70px]">
                                    Input:
                                  </span>
                                  <span>{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-secondary font-bold min-w-[70px]">
                                    Output:
                                  </span>
                                  <span>{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-2 border-t border-base-300 mt-2">
                                    <span className="text-base-content/60 font-sans text-xs">
                                      <span className="font-semibold">Explanation:</span>{" "}
                                      {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problemData?.constraints && problemData.constraints.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                        <ul className="space-y-2 text-base-content/90">
                          {problemData.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <code className="text-sm">{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    <CodeEditorPanel
                      selectedLanguage={selectedLanguage}
                      code={code}
                      isRunning={isRunning}
                      onLanguageChange={handleLanguageChange}
                      onCodeChange={handleCodeChange}
                      onRunCode={handleRunCode}
                    />
                  </Panel>

                  <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                  <Panel defaultSize={30} minSize={15}>
                    <OutputPanel output={output} />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">Unable to connect to the video call</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <StreamVideo client={streamClient}>
                    <StreamCall call={call}>
                      <VideoCallUI chatClient={chatClient} channel={channel} />
                    </StreamCall>
                  </StreamVideo>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>

      {/* Mandatory feedback modal for private sessions — shown after host ends session */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        sessionId={id}
        candidateName={session?.participant?.name}
        onFeedbackSubmitted={() => {
          setShowFeedbackModal(false);
          navigate("/dashboard");
        }}
      />
    </>
  );
}

export default SessionPage;
