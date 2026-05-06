import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import { 
  SendIcon, 
  UserIcon, 
  BotIcon, 
  Loader2Icon, 
  CheckCircle2Icon,
  AlertCircleIcon,
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  VolumeXIcon,
  VideoIcon,
  VideoOffIcon,
  MonitorUpIcon,
  PlayIcon
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getInterviewById, getNextQuestion, submitAnswer, endInterview } from "../api/mockInterview";
import toast from "react-hot-toast";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function InterviewSessionPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // WebRTC
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Code Editor
  const [code, setCode] = useState("// Write your code here...\n");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isAiVoiceMuted, setIsAiVoiceMuted] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    fetchInterviewData();

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentInput(prev => (prev + " " + finalTranscript).trim());
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
      
      // Cleanup streams
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [id]);

  const speakText = (text) => {
    if (isAiVoiceMuted) return;
    
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        toast.error("Could not access camera");
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenShared) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (screenRef.current) screenRef.current.srcObject = null;
      setIsScreenShared(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenRef.current) screenRef.current.srcObject = stream;
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenShared(false);
          screenStreamRef.current = null;
          if (screenRef.current) screenRef.current.srcObject = null;
        };
        setIsScreenShared(true);
      } catch (err) {
        toast.error("Could not access screen share");
      }
    }
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setOutput("Executing...");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      if (data.success) {
        setOutput(data.output);
      } else {
        setOutput(data.error || "Execution failed");
      }
    } catch (err) {
      setOutput(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const fetchInterviewData = async () => {
    try {
      const token = await getToken();
      const res = await getInterviewById(id, token);
      setInterview(res.data);
      setMessages(res.data.conversation || []);

      if (res.data.conversation.length === 0 && res.data.status !== "completed") {
        fetchNextQuestion();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to load interview session");
      navigate("/mock-interview");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextQuestion = async () => {
    setIsTyping(true);
    try {
      const token = await getToken();
      const res = await getNextQuestion(id, token);
      const aiMessage = res.data.message;
      setMessages(prev => [...prev, { role: "interviewer", content: aiMessage }]);
      speakText(aiMessage);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to get next question");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() && !code.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const answerText = currentInput.trim() || "I have updated my code.";
    setCurrentInput("");
    setMessages(prev => [...prev, { role: "candidate", content: answerText }]);

    setIsTyping(true);
    try {
      const token = await getToken();
      const codeToSend = interview?.interviewType === "Technical" ? code : undefined;
      await submitAnswer(id, answerText, codeToSend, token);
      
      const res = await getNextQuestion(id, token);
      const aiMessage = res.data.message;
      setMessages(prev => [...prev, { role: "interviewer", content: aiMessage }]);
      speakText(aiMessage);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to submit answer");
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndInterview = async () => {
    if (!window.confirm("Are you sure you want to end this interview and receive feedback?")) return;

    setIsEnding(true);
    window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const token = await getToken();
      await endInterview(id, token);
      toast.success("Interview completed! Generating report...");
      navigate(`/mock-interview/report/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to end interview");
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <Loader2Icon className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  if (interview?.status === "completed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 gap-6">
        <CheckCircle2Icon className="size-16 text-success" />
        <h2 className="text-3xl font-bold">Interview Completed</h2>
        <button className="btn btn-primary" onClick={() => navigate(`/mock-interview/report/${id}`)}>
          View Performance Report
        </button>
      </div>
    );
  }

  const isTechnical = interview?.interviewType === "Technical";

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <Navbar />

      <div className={`flex-1 w-full mx-auto p-4 flex gap-4 h-[calc(100vh-80px)] ${isTechnical ? "max-w-[1800px]" : "max-w-5xl"}`}>
        
        {/* LEFT COMPARTMENT - CHAT & VIDEO */}
        <div className={`flex flex-col gap-4 ${isTechnical ? "w-[400px]" : "flex-1"}`}>
          
          {/* WEBRTC VIDEOS */}
          <div className={`grid gap-2 ${isTechnical ? "grid-cols-2 h-36" : "grid-cols-2 h-64"}`}>
            {/* CAMERA FEED */}
            <div className="bg-black rounded-xl overflow-hidden relative shadow-lg group">
              {isCameraOn ? (
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-base-300 text-base-content/50">
                  <VideoOffIcon className="size-8 mb-2" />
                  <span className="text-xs">Camera Off</span>
                </div>
              )}
              <button 
                onClick={toggleCamera} 
                className={`absolute bottom-2 left-2 btn btn-circle btn-sm ${isCameraOn ? "btn-error" : "btn-primary"} opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                {isCameraOn ? <VideoOffIcon className="size-4" /> : <VideoIcon className="size-4" />}
              </button>
              <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                You
              </div>
            </div>

            {/* SCREEN SHARE FEED */}
            <div className="bg-black rounded-xl overflow-hidden relative shadow-lg group">
              {isScreenShared ? (
                <video ref={screenRef} autoPlay muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-base-300 text-base-content/50">
                  <MonitorUpIcon className="size-8 mb-2 opacity-50" />
                  <span className="text-xs">Screen Not Shared</span>
                </div>
              )}
              <button 
                onClick={toggleScreenShare} 
                className={`absolute bottom-2 right-2 btn btn-circle btn-sm ${isScreenShared ? "btn-error" : "btn-secondary"} opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <MonitorUpIcon className="size-4" />
              </button>
              <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                Screen
              </div>
            </div>
          </div>

          {/* CHAT INTERFACE */}
          <div className="flex-1 flex flex-col bg-base-100 rounded-2xl shadow-xl border border-base-300 overflow-hidden">
            {/* CHAT HEADER */}
            <div className="p-3 border-b border-base-300 flex justify-between items-center bg-base-200/50">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8">
                    <BotIcon className="size-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{interview?.interviewerName || "Interviewer"}</h3>
                  <p className="text-[10px] text-success flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-success inline-block"></span> AI Active
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsAiVoiceMuted(!isAiVoiceMuted);
                    if (!isAiVoiceMuted) window.speechSynthesis.cancel();
                  }}
                  className={`btn btn-circle btn-xs ${isAiVoiceMuted ? "btn-outline text-base-content/50" : "btn-ghost text-primary"}`}
                  title={isAiVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                >
                  {isAiVoiceMuted ? <VolumeXIcon className="size-3" /> : <Volume2Icon className="size-3" />}
                </button>
                <button 
                  onClick={handleEndInterview} 
                  disabled={isEnding || isTyping}
                  className="btn btn-error btn-xs"
                >
                  {isEnding ? <Loader2Icon className="size-3 animate-spin" /> : "End"}
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-100/50">
              {messages.length === 0 && !isTyping && (
                <div className="text-center text-base-content/50 my-10">
                  <AlertCircleIcon className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Connecting to {interview?.interviewerName || "Interviewer"}...</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat ${msg.role === "candidate" ? "chat-end" : "chat-start"}`}
                >
                  <div className="chat-image avatar">
                    <div className={`w-8 rounded-full flex items-center justify-center ${msg.role === "candidate" ? "bg-secondary text-white" : "bg-primary text-white"}`}>
                      {msg.role === "candidate" ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
                    </div>
                  </div>
                  <div className={`chat-bubble text-sm ${msg.role === "candidate" ? "chat-bubble-secondary" : "chat-bubble-primary"} bg-opacity-90 shadow-sm`}>
                    <div className="prose prose-sm prose-invert max-w-none">
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat chat-start">
                  <div className="chat-image avatar">
                    <div className="w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <BotIcon className="size-4" />
                    </div>
                  </div>
                  <div className="chat-bubble chat-bubble-primary bg-opacity-50 min-h-[40px] flex items-center">
                    <span className="loading loading-dots loading-xs"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT */}
            <div className="p-3 bg-base-200/50 border-t border-base-300">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn btn-square btn-sm ${isListening ? "btn-error animate-pulse" : "btn-outline"}`}
                  disabled={isTyping || isEnding}
                  title="Use Microphone"
                >
                  {isListening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
                </button>

                <input
                  type="text"
                  placeholder={isListening ? "Listening..." : "Type your answer..."}
                  className={`input input-bordered input-sm flex-1 ${isListening ? "border-error focus:outline-error" : ""}`}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  disabled={isTyping || isEnding}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  disabled={(!currentInput.trim() && !code.trim()) || isTyping || isEnding}
                >
                  <SendIcon className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COMPARTMENT - EDITOR (ONLY IF TECHNICAL) */}
        {isTechnical && (
          <div className="flex-1 flex flex-col bg-base-100 rounded-2xl shadow-xl border border-base-300 overflow-hidden">
            {/* Editor Header */}
            <div className="p-2 border-b border-base-300 bg-base-200/50 flex justify-between items-center">
              <div className="flex gap-2">
                <select 
                  className="select select-bordered select-sm w-36"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <button 
                onClick={runCode} 
                className="btn btn-success btn-sm text-white"
                disabled={isRunning || !code.trim()}
              >
                {isRunning ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <>
                    <PlayIcon className="size-4" /> Run Code
                  </>
                )}
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                }}
              />
            </div>

            {/* Output Panel */}
            <div className="h-48 bg-base-300 border-t border-base-300 flex flex-col">
              <div className="px-3 py-1 bg-base-200 text-xs font-semibold uppercase text-base-content/60 border-b border-base-300">
                Execution Output
              </div>
              <div className="flex-1 p-3 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                {output || <span className="opacity-50 italic">Run your code to see output...</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewSessionPage;
