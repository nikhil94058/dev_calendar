"use client";

import React, { useState, useEffect, useRef } from "react";
import WallCalendar from "@/components/WallCalendar";
import {
  CalendarDays, MapPin, Sun, Activity, Sparkles, Command, ChevronRight,
  Code, ExternalLink, Briefcase, GraduationCap, Star
} from "lucide-react";
import { FiGithub, FiTwitter } from "react-icons/fi";
import { format } from "date-fns";
import { motion } from "framer-motion";

// --- GSAP IMPORTS ---
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// --- FRAMER MOTION VARIANTS ---
const navVariants = {
  hidden: { y: -30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const bentoItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 250, damping: 25 } },
};

// ==========================================
// MAIN COMPONENT
// Responsible only for global state, layout, and global backgrounds
// ==========================================
export default function Home() {
  const [userName, setUserName] = useState("User");
  const [currentTime, setCurrentTime] = useState(new Date());
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserName("Nikhil");
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Global Parallax Animations
  useGSAP(() => {
    gsap.to(".parallax-orb-1", {
      yPercent: 60,
      ease: "none",
      scrollTrigger: {
        trigger: mainContainerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".parallax-orb-2", {
      yPercent: -40,
      ease: "none",
      scrollTrigger: {
        trigger: mainContainerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, { scope: mainContainerRef });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={mainContainerRef} className="relative min-h-screen overflow-hidden selection:bg-sky-500/30 bg-[#020617] text-slate-200 font-sans">
      <BackgroundElements />
      <NavBar userName={userName} scrollToSection={scrollToSection} />

      <main className="relative z-10 w-full flex flex-col items-center">
        <DashboardHero userName={userName} currentTime={currentTime} scrollToSection={scrollToSection} />
        <DailyChallenge />
        <UseCases />
        <CalendarSection />
      </main>

      <Footer />
    </div>
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
          <div className="bg-gradient-to-tr from-sky-500 to-sky-300 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.3)] text-slate-950 group-hover:scale-105 transition-all">
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

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:bg-white/[0.05] transition-colors cursor-text">
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Search...</span>
            <div className="flex items-center gap-0.5 bg-white/[0.1] px-1.5 py-0.5 rounded text-[10px] ml-2">
              <Command size={10} /> K
            </div>
          </div>
          <div className="w-px h-6 bg-white/[0.1] hidden sm:block"></div>
          <div className="flex items-center gap-3 group cursor-pointer">
            <span className="text-sm font-medium text-slate-300 hidden sm:block group-hover:text-white transition-colors">{userName}</span>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 p-[2px] shadow-lg group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">{userName.charAt(0)}</div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#020617] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

function DashboardHero({ userName, currentTime, scrollToSection }: { userName: string, currentTime: Date, scrollToSection: (id: string) => void }) {
  return (
    <section id="dashboard-section" className="w-full min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-4 sm:px-8 relative">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-[1200px]">
        <motion.div variants={bentoItem} className="flex items-center gap-2.5 mb-8 ml-2">
          <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20"><Sparkles size={16} className="text-sky-400" /></div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dashboard Overview</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div variants={bentoItem} className="col-span-1 md:col-span-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl overflow-hidden group hover:bg-white/[0.04] transition-all duration-700 relative">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-sky-400/20 via-indigo-500/10 to-transparent rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-2">
                <span className="text-white">Hi {userName},</span><br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-100 to-white">Let's build something great.</span>
              </h1>
              <p className="text-slate-400 font-medium mt-4 text-lg max-w-md">Your environment is synced. You have 2 pending reviews and your daily challenge is ready.</p>
            </div>
            <div className="mt-12 flex gap-4 relative z-10">
              <div className="flex items-center gap-3 bg-white/[0.05] text-white px-6 py-3 rounded-2xl text-sm font-semibold border border-white/[0.1] backdrop-blur-md">
                <CalendarDays size={18} className="text-sky-400" />
                <span>{format(currentTime, 'EEEE, MMMM do • h:mm a')}</span>
              </div>
            </div>
          </motion.div>

          <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
            <motion.div variants={bentoItem} className="flex-1 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-8 rounded-[2.5rem] hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] group-hover:scale-150 transition-transform"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="bg-white/[0.05] p-3.5 rounded-2xl text-amber-400 border border-white/[0.1]"><Star size={22} fill="currentColor" /></div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">Top 5%</span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-white leading-none">kumarnikhil94058</p>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mt-2">LeetCode Profile</p>
              </div>
            </motion.div>

            <motion.div variants={bentoItem} onClick={() => scrollToSection('calendar-section')} className="bg-gradient-to-br from-sky-500 to-indigo-600 p-8 rounded-[2.5rem] border border-sky-400/30 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-500">
              <div className="absolute -right-6 -bottom-6 opacity-20 text-white group-hover:scale-125 group-hover:rotate-[15deg] transition-transform duration-700"><MapPin size={140} /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100">Up Next</p>
                </div>
                <p className="text-2xl font-bold text-white leading-tight mb-1">System Design Prep</p>
                <p className="text-sm font-medium text-sky-200">Today at 3:00 PM</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DailyChallenge() {
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

  return (
    <section id="daily-challenge" className="w-full py-24 px-4 sm:px-8 relative z-10 border-t border-white/[0.05] bg-gradient-to-b from-transparent to-[#020617]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 flex items-center justify-center gap-3">
            <Code className="text-sky-400" size={40} /> Daily Challenge
          </h2>
          <p className="text-slate-400 font-medium max-w-xl mx-auto">Sharpen your algorithms. Solve today's featured problem curated for High-Rating competitors.</p>
        </div>

        <div className="bg-[#0b1121] border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="ml-4 text-xs font-mono text-slate-500">problem_of_the_day.cpp</span>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex gap-2 mb-3">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-md border border-purple-500/20">Dynamic Programming</span>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider rounded-md border border-sky-500/20">Graphs</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">E. Maximum Subtree Paths</h3>
              <p className="text-slate-400">Codeforces Round 900 (Div. 1) • Time Limit: 2.0s</p>
            </div>

            <a 
              ref={solveButtonRef}
              href="#" 
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-xl font-bold hover:bg-sky-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] will-change-transform"
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

  // Encapsulated GSAP logic specifically for this component
  useGSAP(() => {
    gsap.from(".use-case-card", {
      y: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
      }
    });
  }, { scope: sectionRef });

  return (
    <section id="use-cases" ref={sectionRef} className="w-full py-24 px-4 sm:px-8 relative z-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Built for Performers.</h2>
          <p className="text-slate-400 font-medium">Whether you're writing code or managing teams, Calenflow adapts.</p>
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
  return (
    <section id="calendar-section" className="w-full min-h-screen flex items-center justify-center py-24 px-4 sm:px-8 relative z-10 border-t border-white/[0.05]">
      <div className="w-full max-w-[1200px] flex flex-col items-center">
        <div className="w-full flex items-end justify-between mb-10 px-2 sm:px-6">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">My Calendar</h2>
            <p className="text-slate-400 font-medium text-base">Manage your schedule, upcoming events, and daily notes.</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400"><div className="w-2 h-2 rounded-full bg-sky-400"></div> Events</div>
            <div className="flex items-center gap-2 text-sm text-slate-400"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Contests</div>
          </div>
        </div>
        <div className="w-full relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] p-2 sm:p-8 rounded-[2.5rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
          <WallCalendar />
        </div>
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
            <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"><FiGithub size={18} /></a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white hover:bg-sky-500/20 hover:border-sky-500/30 transition-all"><FiTwitter size={18} /></a>
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

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}