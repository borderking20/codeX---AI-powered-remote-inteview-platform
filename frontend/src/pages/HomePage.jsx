import { Link } from "react-router";
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  CheckIcon,
  Code2Icon,
  HeartIcon,
  LayersIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";

function HomePage() {
  return (
    <div className="bg-gradient-to-br from-base-100 via-base-200 to-base-300">
      {/* NAVBAR */}
      <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          {/* LOGO */}
          <Link
            to={"/"}
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <SparklesIcon className="size-6 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
                CodeX
              </span>
              <span className="text-xs text-base-content/60 font-medium -mt-1">Where Coding Meets Symbiosis</span>
            </div>
          </Link>

          {/* AUTH BTN */}
          <SignInButton mode="modal">
            <button className="group px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2">
              <span>Get Started</span>
              <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-8">
            <div className="badge badge-primary badge-lg">
              <ZapIcon className="size-4" />
              Real-time Collaboration
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Code Together,
              </span>
              <br />
              <span className="text-base-content">Where Coding Meets Symbiosis</span>
            </h1>

            <p className="text-xl text-base-content/70 leading-relaxed max-w-xl">
              The ultimate platform for collaborative coding interviews and pair programming.
              Connect face-to-face, code in real-time, and ace your technical interviews.
            </p>

            {/* FEATURE PILLS */}
            <div className="flex flex-wrap gap-3">
              <div className="badge badge-lg badge-outline">
                <CheckIcon className="size-4 text-success" />
                Live Video Chat
              </div>
              <div className="badge badge-lg badge-outline">
                <CheckIcon className="size-4 text-success" />
                Code Editor
              </div>
              <div className="badge badge-lg badge-outline">
                <CheckIcon className="size-4 text-success" />
                Multi-Language
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <SignInButton mode="modal">
                <button className="btn btn-primary btn-lg">
                  Start Coding Now
                  <ArrowRightIcon className="size-5" />
                </button>
              </SignInButton>

              <button className="btn btn-outline btn-lg">
                <VideoIcon className="size-5" />
                Watch Demo
              </button>
            </div>

            {/* STATS */}
            <div className="stats stats-vertical lg:stats-horizontal bg-base-100 shadow-lg">
              <div className="stat">
                <div className="stat-value text-primary">10K+</div>
                <div className="stat-title">Active Users</div>
              </div>
              <div className="stat">
                <div className="stat-value text-secondary">50K+</div>
                <div className="stat-title">Sessions</div>
              </div>
              <div className="stat">
                <div className="stat-value text-accent">99.9%</div>
                <div className="stat-title">Uptime</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Image + Practice Cards */}
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
            {/* HERO IMAGE - stays in same position */}
            <img
              src="/hero.png"
              alt="CodeCollab Platform"
              className="w-full h-auto rounded-3xl shadow-2xl border-4 border-base-100 hover:scale-105 transition-transform duration-500"
            />

            {/* PRACTICE CARDS - right side */}
            <div className="hidden lg:flex flex-col gap-4 min-w-[200px] max-w-[220px] self-center">
              {/* Practice with AI Card */}
              <SignInButton mode="modal">
                <div className="group cursor-pointer card bg-base-100 shadow-xl border border-primary/20 hover:border-primary/60 hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="card-body p-5">
                    <div className="size-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <BrainCircuitIcon className="size-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm text-base-content">Practice with AI</h3>
                    <p className="text-xs text-base-content/60 mt-1 leading-relaxed">AI-powered mock interviews & instant feedback</p>
                    <div className="mt-3 flex items-center gap-1 text-primary text-xs font-semibold">
                      <span>Try Now</span>
                      <ArrowRightIcon className="size-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </SignInButton>

              {/* Practice DSA Card */}
              <SignInButton mode="modal">
                <div className="group cursor-pointer card bg-base-100 shadow-xl border border-secondary/20 hover:border-secondary/60 hover:shadow-secondary/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="card-body p-5">
                    <div className="size-12 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <LayersIcon className="size-6 text-secondary" />
                    </div>
                    <h3 className="font-bold text-sm text-base-content">Practice DSA</h3>
                    <p className="text-xs text-base-content/60 mt-1 leading-relaxed">Solve curated problems with real-time execution</p>
                    <div className="mt-3 flex items-center gap-1 text-secondary text-xs font-semibold">
                      <span>Solve Now</span>
                      <ArrowRightIcon className="size-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need to <span className="text-primary font-mono">Succeed</span>
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Powerful features designed to make your coding interviews seamless and productive
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <VideoIcon className="size-8 text-primary" />
              </div>
              <h3 className="card-title">HD Video Call</h3>
              <p className="text-base-content/70">
                Crystal clear video and audio for seamless communication during interviews
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Code2Icon className="size-8 text-primary" />
              </div>
              <h3 className="card-title">Live Code Editor</h3>
              <p className="text-base-content/70">
                Collaborate in real-time with syntax highlighting and multiple language support
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <UsersIcon className="size-8 text-primary" />
              </div>
              <h3 className="card-title">Easy Collaboration</h3>
              <p className="text-base-content/70">
                Share your screen, discuss solutions, and learn from each other in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-base-100 border-t border-base-300 mt-4">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-md">
                <SparklesIcon className="size-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">CodeX</span>
                <span className="text-xs text-base-content/50 -mt-0.5">Where Coding Meets Symbiosis</span>
              </div>
            </Link>

            {/* Center links */}
            <div className="flex items-center gap-6 text-sm text-base-content/60">
              <SignInButton mode="modal"><button className="hover:text-primary transition-colors">Get Started</button></SignInButton>
              <SignInButton mode="modal"><button className="hover:text-primary transition-colors">Practice DSA</button></SignInButton>
              <SignInButton mode="modal"><button className="hover:text-primary transition-colors">AI Interview</button></SignInButton>
            </div>

            {/* Right — credits */}
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-sm text-base-content/50 flex items-center gap-1.5">
                Built with <HeartIcon className="size-4 text-red-500 fill-red-500" /> by Students of UCER
              </p>
              <p className="text-xs text-base-content/40">
                © {new Date().getFullYear()} CodeX. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default HomePage;
