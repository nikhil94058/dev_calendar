"use client";

import React, { useState, useEffect, useRef } from "react";
import WallCalendar from "@/components/WallCalendar"; // Verify this path!
import {
  CalendarDays, MapPin, Sparkles, Command,
  Code, ExternalLink, Briefcase, GraduationCap, Star, ChevronDown, Activity, CheckCircle2, Copy
} from "lucide-react";
import { FiGithub, FiLinkedin } from "react-icons/fi";
import { format, nextDay, isPast, addWeeks } from "date-fns";
import { motion, Variants, useMotionValue, useTransform, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// --- TYPES FOR API DATA ---
interface Contest {
  id: string | number;
  name: string;
  startTimeSeconds: number; // Unix timestamp
  platform: "Codeforces" | "LeetCode" | "AtCoder";
}

interface Problem {
  contestId: number;
  index: string;
  name: string;
  tags: string[];
  rating: number;
}

// --- FRAMER MOTION VARIANTS ---
const navVariants: Variants = {
  hidden: { y: -30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const bentoItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 250, damping: 25 } },
};

// --- HELPER: GET NEXT SPECIFIC DAY & TIME (UTC) ---
function getNextOccurrenceUTC(dayOfWeek: number, hourUTC: number, minuteUTC: number): number {
  const now = new Date();
let nextDate = nextDay(now, dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
  
  // Adjust to UTC
  nextDate.setUTCHours(hourUTC, minuteUTC, 0, 0);
  
  if (isPast(nextDate)) {
    nextDate = addWeeks(nextDate, 1);
  }
  
  return Math.floor(nextDate.getTime() / 1000);
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Future Coder");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // Real API State for Dashboard
  const [nextContest, setNextContest] = useState<Contest | null>(null);
  const [dailyProblem, setDailyProblem] = useState<Problem | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const fetchCompetitiveData = async () => {
      try {
        let allContests: Contest[] = [];

        // 1. Fetch live Codeforces upcoming contests
        const cfRes = await fetch("https://codeforces.com/api/contest.list?gym=false");
        const cfData = await cfRes.json();
        if (cfData.status === "OK") {
          const cfUpcoming = cfData.result
            .filter((c: any) => c.phase === "BEFORE")
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              startTimeSeconds: c.startTimeSeconds,
              platform: "Codeforces" as const
            }));
          allContests = [...allContests, ...cfUpcoming];
        }

        // 2. Mathematically Predict predictable LeetCode & AtCoder Contests
        // LeetCode Weekly (Sunday 02:30 UTC)
        allContests.push({
          id: "lc-weekly",
          name: "LeetCode Weekly Contest",
          startTimeSeconds: getNextOccurrenceUTC(0, 2, 30),
          platform: "LeetCode"
        });

        // LeetCode Biweekly (Saturday 14:30 UTC)
        allContests.push({
          id: "lc-biweekly",
          name: "LeetCode Biweekly Contest",
          startTimeSeconds: getNextOccurrenceUTC(6, 14, 30),
          platform: "LeetCode"
        });

        // AtCoder Beginner (Saturday 12:00 UTC)
        allContests.push({
          id: "ac-beginner",
          name: "AtCoder Beginner Contest",
          startTimeSeconds: getNextOccurrenceUTC(6, 12, 0),
          platform: "AtCoder"
        });

        // Sort all aggregated contests and pick the absolute soonest one
        allContests.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
        setNextContest(allContests[0]);

        // 3. Fetch Codeforces Daily Problem
        const problemRes = await fetch("https://codeforces.com/api/problemset.problems");
        const problemData = await problemRes.json();
        if (problemData.status === "OK") {
          const hardProblems = problemData.result.problems.filter((p: any) => p.rating >= 1800 && p.rating <= 2200);
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
          setDailyProblem(hardProblems[dayOfYear % hardProblems.length]);
        }
      } catch (error) {
        console.error("Failed to fetch competitive data", error);
      } finally {
        setIsLoadingApi(false);
      }
    };

    fetchCompetitiveData();
    return () => clearInterval(timer);
  }, []);

  useGSAP(() => {
    gsap.to(".parallax-orb-1", {
      yPercent: 60,
      ease: "none",
      scrollTrigger: { trigger: mainContainerRef.current, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".parallax-orb-2", {
      yPercent: -40,
      ease: "none",
      scrollTrigger: { trigger: mainContainerRef.current, start: "top top", end: "bottom top", scrub: true },
    });
  }, { scope: mainContainerRef });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="dark">
      <div ref={mainContainerRef} className="relative min-h-screen overflow-hidden selection:bg-sky-500/30 bg-[#020617] text-slate-200 font-sans">
        <BackgroundElements />
        <NavBar userName={userName} scrollToSection={scrollToSection} />

        <main className="relative z-10 w-full flex flex-col items-center">
          <DashboardHero userName={userName} currentTime={currentTime} scrollToSection={scrollToSection} nextContest={nextContest} isLoading={isLoadingApi} />
          
          <ProfileStatsLinker />

          <DailyChallenge dailyProblem={dailyProblem} isLoading={isLoadingApi} />
          <UseCases />
          <CalendarSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}

// ==========================================
// PROFILE STATS COMPONENT (CACHED & FIXED APIs)
// ==========================================
function ProfileStatsLinker() {
  const [handles, setHandles] = useState({ cf: "", lc: "", ac: "", gfg: "" });
  const [counts, setCounts] = useState({ cf: 0, lc: 0, ac: 0, gfg: 0 });
  const [isFetching, setIsFetching] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load cached handles and counts on mount
  useEffect(() => {
    const savedHandles = localStorage.getItem("calenflow-handles");
    const savedCounts = localStorage.getItem("calenflow-counts");
    if (savedHandles) setHandles(JSON.parse(savedHandles));
    if (savedCounts) setCounts(JSON.parse(savedCounts));
  }, []);

  const handleFetchStats = async () => {
    setIsFetching(true);
    let newCounts = { ...counts };

    // Save handles immediately
    localStorage.setItem("calenflow-handles", JSON.stringify(handles));

    const promises = [];

    // 1. Fetch Codeforces (Unique OK Submissions)
    if (handles.cf) {
      promises.push(
        fetch(`https://codeforces.com/api/user.status?handle=${handles.cf}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === "OK") {
              const solvedSet = new Set();
              data.result.forEach((sub: any) => {
                if (sub.verdict === "OK") solvedSet.add(sub.problem.name);
              });
              newCounts.cf = solvedSet.size;
            }
          })
          .catch(e => console.error("CF Error", e))
      );
    }

    // 2. Fetch LeetCode (alfa-leetcode-api)
    if (handles.lc) {
      promises.push(
        fetch(`https://alfa-leetcode-api.onrender.com/${handles.lc}/solved`)
          .then(res => res.json())
          .then(data => {
            if (data && data.solvedProblem !== undefined) {
              newCounts.lc = data.solvedProblem;
            }
          })
          .catch(e => console.error("LC Error", e))
      );
    }

    // 3. Fetch AtCoder (Kenkoooo API)
    if (handles.ac) {
      promises.push(
        fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=${handles.ac}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.count !== undefined) {
              newCounts.ac = data.count;
            }
          })
          .catch(e => console.error("AC Error", e))
      );
    }

    // 4. Fetch GFG (Unofficial APIs - wrapped safely)
    if (handles.gfg) {
      promises.push(
        fetch(`https://geeks-for-geeks-api-unofficial.vercel.app/${handles.gfg}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.totalProblemsSolved !== undefined) {
              newCounts.gfg = parseInt(data.totalProblemsSolved);
            } else if (data && data.info && data.info.totalProblemsSolved) {
              newCounts.gfg = parseInt(data.info.totalProblemsSolved);
            }
          })
          .catch(e => console.error("GFG Error", e))
      );
    }

    // Wait for all APIs to resolve or fail concurrently
    await Promise.allSettled(promises);

    setCounts(newCounts);
    
    // Cache the successful counts
    localStorage.setItem("calenflow-counts", JSON.stringify(newCounts));
    setIsFetching(false);
  };

  const copyText = `🔥 Total Problems Solved:
- Codeforces: ${counts.cf}
- LeetCode: ${counts.lc}
- AtCoder: ${counts.ac}
- GFG: ${counts.gfg}

🏆 Total: ${counts.cf + counts.lc + counts.ac + counts.gfg}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full py-12 px-4 sm:px-8 relative z-10">
      <div className="max-w-[1200px] mx-auto bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-full h-1/2 bg-sky-500/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="flex-1 w-full z-10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-sky-400" size={20} />
            <h3 className="text-xl font-bold text-white">Universal Problem Tracker</h3>
          </div>
          <p className="text-slate-400 text-sm mb-6">Link your competitive profiles to fetch real-time solved counts and generate a copy-paste summary.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input type="text" placeholder="Codeforces Handle" value={handles.cf} onChange={e => setHandles({...handles, cf: e.target.value})} className="bg-[#020617]/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
            <input type="text" placeholder="LeetCode Username" value={handles.lc} onChange={e => setHandles({...handles, lc: e.target.value})} className="bg-[#020617]/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
            <input type="text" placeholder="AtCoder Handle" value={handles.ac} onChange={e => setHandles({...handles, ac: e.target.value})} className="bg-[#020617]/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors" />
            <input type="text" placeholder="GFG Username" value={handles.gfg} onChange={e => setHandles({...handles, gfg: e.target.value})} className="bg-[#020617]/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <button onClick={handleFetchStats} disabled={isFetching} className="w-full sm:w-auto bg-white text-slate-900 font-bold rounded-lg px-6 py-3 text-sm hover:bg-sky-50 transition-colors shadow-lg flex justify-center items-center gap-2">
            {isFetching ? "Syncing APIs..." : "Fetch Solved Problems"}
          </button>
        </div>

        <div className="flex-1 w-full bg-[#020617]/80 rounded-2xl border border-slate-800 p-6 relative z-10 group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-mono text-slate-500">summary.txt</span>
            <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs bg-white/[0.05] hover:bg-white/[0.1] px-2 py-1 rounded">
              {copied ? <CheckCircle2 size={14} className="text-emerald-400"/> : <Copy size={14} />} {copied ? "Copied!" : "Copy Format"}
            </button>
          </div>
          <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {copyText}
          </pre>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// MODULAR SUB-COMPONENTS
// ==========================================

function BackgroundElements() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="parallax-orb-1 fixed top-[-15%] right-[-10%] w-[700px] h-[700px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen z-0" />
      <div className="parallax-orb-2 fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen z-0" />
    </>
  );
}

function NavBar({ userName, scrollToSection }: { userName: string, scrollToSection: (id: string) => void }) {
  return (
    <motion.nav variants={navVariants} initial="hidden" animate="show" className="fixed top-0 w-full z-50 border-b border-white/[0.05] bg-[#020617]/70 backdrop-blur-2xl">
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
          <div className="bg-gradient-to-tr from-sky-500 to-sky-400 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.3)] text-white group-hover:scale-105 transition-all">
            <CalendarDays size={22} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1">
            Calen<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-200">flow.</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button onClick={() => scrollToSection('dashboard-section')} className="hover:text-white transition-colors">Dashboard</button>
          <button onClick={() => scrollToSection('daily-challenge')} className="hover:text-white transition-colors">Challenges</button>
          <button onClick={() => scrollToSection('use-cases')} className="hover:text-white transition-colors">Use Cases</button>
          <button onClick={() => scrollToSection('calendar-section')} className="hover:text-white transition-colors">Calendar</button>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:bg-white/[0.05] transition-colors cursor-text">
            <Command className="w-3.5 h-3.5" />
            <span>Search...</span>
          </div>
          <div className="w-px h-6 bg-white/[0.1] hidden sm:block"></div>
          <div className="flex items-center gap-3 group cursor-pointer">
            <span className="text-sm font-medium text-slate-300 hidden sm:block group-hover:text-white transition-colors">{userName}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 p-[2px] shadow-lg group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center text-white font-bold text-sm">{userName.charAt(0)}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

function DashboardHero({ userName, currentTime, scrollToSection, nextContest, isLoading }: { userName: string, currentTime: Date | null, scrollToSection: (id: string) => void, nextContest: Contest | null, isLoading: boolean }) {
  
  const getPlatformColors = (platform?: string) => {
    switch(platform) {
      case 'LeetCode': return "from-amber-400 to-amber-600 border-amber-400/30 text-amber-100";
      case 'AtCoder': return "from-stone-600 to-slate-800 border-slate-500/30 text-slate-200";
      default: return "from-sky-500 to-indigo-600 border-sky-400/30 text-sky-100";
    }
  };

  return (
    <section id="dashboard-section" className="w-full min-h-screen flex flex-col items-center justify-center pt-28 pb-10 px-4 sm:px-8 relative">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-[1200px]">
        <motion.div variants={bentoItem} className="flex items-center gap-2.5 mb-8 ml-2">
          <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20"><Sparkles size={16} className="text-sky-400" /></div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dashboard </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div variants={bentoItem} className="col-span-1 md:col-span-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl overflow-hidden group hover:bg-white/[0.04] transition-all duration-700 relative">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-sky-400/20 via-indigo-500/10 to-transparent rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-2">
                <span className="text-white">Hi {userName},</span><br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-100 to-white">Let&apos;s build something great.</span>
              </h1>
              <p className="text-slate-400 font-medium mt-4 text-lg max-w-md">Your competitive sync is active. Check out your live upcoming events below.</p>
            </div>
            <div className="mt-12 flex gap-4 relative z-10">
              <div className="flex items-center gap-3 bg-white/[0.05] text-white px-6 py-3 rounded-2xl text-sm font-semibold border border-white/[0.1] backdrop-blur-md">
                <CalendarDays size={18} className="text-sky-400" />
                <span>{currentTime ? format(currentTime, 'EEEE, MMMM do • h:mm a') : "Loading time..."}</span>
              </div>
            </div>
          </motion.div>

          <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
            <motion.div variants={bentoItem} className="flex-1 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-8 rounded-[2.5rem] hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] group-hover:scale-150 transition-transform"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="bg-white/[0.05] p-3.5 rounded-2xl text-amber-400 border border-white/[0.1]"><Star size={22} fill="currentColor" /></div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md flex items-center gap-1">
                  <Activity size={12} /> Sync Active
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-white leading-none">Ready</p>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mt-2">Environment Status</p>
              </div>
            </motion.div>

            <motion.div variants={bentoItem} className={`bg-gradient-to-br ${getPlatformColors(nextContest?.platform)} p-8 rounded-[2.5rem] border flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-all duration-500`}>
              <div className="absolute -right-6 -bottom-6 opacity-20 text-white group-hover:scale-125 group-hover:rotate-[15deg] transition-transform duration-700"><MapPin size={140} /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                    {isLoading ? "Fetching Events..." : `Next: ${nextContest?.platform || "Event"}`}
                  </p>
                </div>
                {isLoading ? (
                  <div className="animate-pulse space-y-2 mt-2">
                    <div className="h-6 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-bold text-white leading-tight mb-1 line-clamp-2">
                      {nextContest?.name || "No Upcoming Contests"}
                    </p>
                    <p className="text-sm font-medium opacity-80">
                      {nextContest ? format(new Date(nextContest.startTimeSeconds * 1000), "MMM do • h:mm a") : "--"}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DailyChallenge({ dailyProblem, isLoading }: { dailyProblem: Problem | null, isLoading: boolean }) {
  const solveButtonRef = useRef<HTMLAnchorElement>(null);

  const handleMagneticMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!solveButtonRef.current) return;
    const { left, top, width, height } = solveButtonRef.current.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;
    gsap.to(solveButtonRef.current, { x: x * 0.3, y: y * 0.3, duration: 0.6, ease: "power3.out" });
  };

  const handleMagneticLeave = () => {
    if (!solveButtonRef.current) return;
    gsap.to(solveButtonRef.current, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
  };

  const tagColors = [
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ];

  return (
    <section id="daily-challenge" className="w-full py-24 px-4 sm:px-8 relative z-10 border-t border-white/[0.05] bg-gradient-to-b from-transparent to-[#020617]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 flex items-center justify-center gap-3">
            <Code className="text-sky-400" size={40} /> Daily Challenge
          </h2>
          <p className="text-slate-400 font-medium max-w-xl mx-auto">Sharpen your algorithms. Solve today&apos;s live featured problem.</p>
        </div>

        <div className="bg-[#0b1121] border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="ml-4 text-xs font-mono text-slate-500">problem_of_the_day.cpp</span>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="flex gap-2 mb-3">
                    <div className="w-20 h-6 bg-slate-800 rounded-md"></div>
                    <div className="w-24 h-6 bg-slate-800 rounded-md"></div>
                  </div>
                  <div className="w-3/4 h-8 bg-slate-800 rounded mb-3"></div>
                  <div className="w-1/2 h-5 bg-slate-800 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(dailyProblem?.tags.slice(0, 3) || ["dp", "graphs"]).map((tag, i) => (
                      <span key={i} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${tagColors[i % tagColors.length]}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {dailyProblem ? `${dailyProblem.index}. ${dailyProblem.name}` : "E. Maximum Subtree Paths"}
                  </h3>
                  <p className="text-slate-400">
                    {dailyProblem 
                      ? `Codeforces Problemset • Rating: ${dailyProblem.rating}` 
                      : "Codeforces Round • Time Limit: 2.0s"}
                  </p>
                </>
              )}
            </div>

            <a 
              ref={solveButtonRef}
              href={dailyProblem ? `https://codeforces.com/contest/${dailyProblem.contestId}/problem/${dailyProblem.index}` : "#"} 
              target="_blank"
              rel="noopener noreferrer"
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-xl font-bold hover:bg-sky-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] will-change-transform whitespace-nowrap"
            >
              Solve Now <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const sectionRef = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.from(".use-case-card", { y: 80, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }});
  }, { scope: sectionRef });

  return (
    <section id="use-cases" ref={sectionRef} className="w-full py-24 px-4 sm:px-8 relative z-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Built for Performers.</h2>
          <p className="text-slate-400 font-medium">Whether you&apos;re writing code or managing teams, Calenflow adapts.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="use-case-card bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6"><Code size={24} /></div>
            <h3 className="text-xl font-bold text-white mb-3">Developers</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Sync with Jira, GitHub, and LeetCode. Never miss a deployment window or a daily contest.</p>
          </div>
          <div className="use-case-card bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 mb-6"><Briefcase size={24} /></div>
            <h3 className="text-xl font-bold text-white mb-3">Project Teams</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Visualize sprint timelines, manage recurring standups, and allocate resources beautifully.</p>
          </div>
          <div className="use-case-card bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6"><GraduationCap size={24} /></div>
            <h3 className="text-xl font-bold text-white mb-3">Students</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Track assignment deadlines, exam schedules, and study sessions with distraction-free layouts.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarSection() {
  const x = useMotionValue(0);
  const rawRotation = useTransform(x, [-300, 300], [-15, 15]);
  const rotation = useSpring(rawRotation, { stiffness: 150, damping: 12 });

  return (
    <section id="calendar-section" className="w-full min-h-screen flex items-center justify-center pt-16 pb-24 px-4 sm:px-8 relative z-10 border-t border-white/[0.05]">
      <div className="w-full max-w-[1200px] flex flex-col items-center">
        <div className="w-full flex items-end justify-between mb-8 px-2 sm:px-6">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">My Calendar</h2>
            <p className="text-slate-400 font-medium text-base">Manage your schedule, upcoming events, and daily notes.</p>
          </div>
        </div>
        <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4} style={{ x, rotate: rotation, transformOrigin: "top center", perspective: "1000px" }} className="w-full relative flex flex-col items-center mt-12 cursor-grab active:cursor-grabbing touch-none">
          <div className="absolute -top-16 left-1/4 sm:left-[20%] w-0.5 h-20 bg-gradient-to-b from-white/30 to-white/10 z-0 origin-top rotate-[15deg] pointer-events-none">
            <div className="absolute -top-2 -left-[5px] w-3 h-3 rounded-full bg-slate-600 shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-slate-500"></div>
          </div>
          <div className="absolute -top-16 right-1/4 sm:right-[20%] w-0.5 h-20 bg-gradient-to-b from-white/30 to-white/10 z-0 origin-top -rotate-[15deg] pointer-events-none">
            <div className="absolute -top-2 -left-[5px] w-3 h-3 rounded-full bg-slate-600 shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-slate-500"></div>
          </div>
          <div className="w-full relative z-10 bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] p-2 sm:p-8 rounded-[2.5rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.5)]">
            <div onPointerDownCapture={(e) => e.stopPropagation()} className="cursor-auto">
              <WallCalendar />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.05] bg-[#020617] pt-16 pb-8 px-6 relative z-10">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="text-sky-400" size={24} />
            <span className="font-bold text-xl text-white">Calenflow.</span>
          </div>
          <p className="text-slate-500 text-sm max-w-sm text-center md:text-left">The premium scheduling and productivity dashboard built for high-performance individuals.</p>
        </div>
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className="flex gap-4 mb-4">
            <a href="https://github.com/nikhil94058" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"><FiGithub size={18} /></a>
            <a href="https://www.linkedin.com/in/nikhil94058/" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white hover:bg-sky-500/20 hover:border-sky-500/30 transition-all"><FiLinkedin size={18} /></a>
          </div>
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 px-4 py-2 rounded-lg inline-flex items-center gap-2">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            <p className="text-sm font-medium text-amber-100/80">Made by <span className="text-amber-400 font-bold">Nikhil</span> • 5-Star Coder</p>
          </div>
        </div>
      </div>
    </footer>
  );
}