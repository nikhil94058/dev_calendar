"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval,
  isBefore, startOfWeek, endOfWeek, subDays
} from "date-fns";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Flame, Activity, Book, Sun, Moon, Calendar as CalendarIcon, Trophy, Code2, Sparkles, Coffee, Target, Swords, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// --- CONSTANTS & DATA ---
const MONTH_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505909182942-e2f09aee3e89?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509023464722-18d996393ca8?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2000&auto=format&fit=crop",
];

const MONTHLY_QUOTES = [
  "First, solve the problem. Then, write the code.",
  "Make it work, make it right, make it fast.",
  "Simplicity is the soul of efficiency.",
  "Code is like humor. When you have to explain it, it’s bad.",
  "Fix the cause, not the symptom.",
  "Optimism is an occupational hazard of programming.",
  "The only way to learn a new programming language is by writing programs in it.",
  "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.",
  "Truth can only be found in one place: the code.",
  "It’s not a bug. It’s an undocumented feature.",
  "Before software can be reusable it first has to be usable.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."
];

const SPECIAL_DAYS: Record<string, { label: string, icon: React.ReactNode }> = {
  "03-14": { label: "Pi Day", icon: <span className="text-amber-500 font-serif font-bold italic">π</span> },
  "09-13": { label: "Programmer's Day", icon: <Code2 size={10} className="text-sky-500" /> },
  "10-31": { label: "Dark Mode Day", icon: <Moon size={10} className="text-indigo-400" /> },
  "12-31": { label: "Commit Year", icon: <Coffee size={10} className="text-rose-400" /> }
};

const flipVariants : Variants = {
  enter: (direction: number) => ({ rotateX: direction > 0 ? -90 : 90, y: direction > 0 ? 50 : -50, opacity: 0, filter: "blur(8px)", zIndex: 10 }),
  center: { rotateX: 0, y: 0, opacity: 1, filter: "blur(0px)", zIndex: 10, transition: { duration: 0.7, type: "spring", bounce: 0.3 } },
  exit: (direction: number) => ({ rotateX: direction < 0 ? -90 : 90, y: direction < 0 ? 50 : -50, opacity: 0, filter: "blur(8px)", zIndex: 0, transition: { duration: 0.4 } }),
};

const MOODS = ["🤩", "😊", "😐", "😔", "😫"];

// Type for Contests
interface ContestEvent {
  date: string;
  name: string;
  time: string;
  color: string;
  bg: string;
}

export default function WallCalendar() {
  const [[currentDate, direction], setDateTuple] = useState([new Date(), 0]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  // Data States
  const [notes, setNotes] = useState<string>("");
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [habits, setHabits] = useState<Record<string, { exercise: boolean; read: boolean; meditate: boolean }>>({});
  const [newEvent, setNewEvent] = useState("");
  const [emojiPopupOpen, setEmojiPopupOpen] = useState<string | null>(null);
  
  // API State
  const [cfData, setCfData] = useState<{ rating: number, rank: string } | null>(null);
  const [liveCfContests, setLiveCfContests] = useState<any[]>([]);
  const [cfHandle] = useState("tourist");

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const monthIndex = currentDate.getMonth();

  // 1. Fetch Global Live Contests on mount
  useEffect(() => {
    const fetchCFContests = async () => {
      try {
        const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
        const data = await res.json();
        if (data.status === "OK") {
          // Filter for upcoming contests only
          const upcoming = data.result.filter((c: any) => c.phase === "BEFORE");
          setLiveCfContests(upcoming);
        }
      } catch (err) {
        console.error("Failed to fetch CF contests");
      }
    };
    fetchCFContests();
  }, []);

  // 2. Generate Real + Predictable Contests for the current viewing month
  const currentMonthContests = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const contests: ContestEvent[] = [];

    // --- A. Codeforces API Contests ---
    liveCfContests.forEach(c => {
      const date = new Date(c.startTimeSeconds * 1000);
      if (isSameMonth(date, currentDate)) {
        contests.push({
          date: format(date, "yyyy-MM-dd"),
          name: c.name,
          time: format(date, "HH:mm"),
          color: "text-rose-500",
          bg: "bg-rose-500"
        });
      }
    });

    // --- B. Mathematically Predictable Contests ---
    // Reference date for Biweekly parity: March 2, 2024 (Biweekly 125)
    const knownBiweekly = new Date(2024, 2, 2); 
    const knownUTCTimestamp = Date.UTC(knownBiweekly.getFullYear(), knownBiweekly.getMonth(), knownBiweekly.getDate());

    daysInMonth.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayUTCTimestamp = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
      const diffDays = Math.round((dayUTCTimestamp - knownUTCTimestamp) / (1000 * 60 * 60 * 24));

      // Sunday: LeetCode Weekly
      if (day.getDay() === 0) {
        contests.push({
          date: dateStr,
          name: "LeetCode Weekly",
          time: "02:30",
          color: "text-amber-500",
          bg: "bg-amber-500"
        });
      }

      // Saturday: AtCoder Beginner & LeetCode Biweekly
      if (day.getDay() === 6) {
        contests.push({
          date: dateStr,
          name: "AtCoder Beginner",
          time: "12:00",
          color: "text-cyan-500",
          bg: "bg-cyan-500"
        });

        if (diffDays % 14 === 0) {
          contests.push({
            date: dateStr,
            name: "LeetCode Biweekly",
            time: "14:30",
            color: "text-amber-400",
            bg: "bg-amber-400"
          });
        }
      }
    });

    // Sort chronologically
    return contests.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`);
      const dateB = new Date(`${b.date}T${b.time}:00`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [currentDate, liveCfContests]);

  useEffect(() => {
    const monthKey = format(currentDate, "yyyy-MM");
    setNotes(localStorage.getItem(`calendar-notes-${monthKey}`) || "");
    setEvents(JSON.parse(localStorage.getItem("calendar-events") || "{}"));
    setMoods(JSON.parse(localStorage.getItem("calendar-moods") || "{}"));
    setHabits(JSON.parse(localStorage.getItem("calendar-habits") || "{}"));

    const fetchCF = async () => {
      try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`);
        const data = await res.json();
        if (data.status === "OK") {
          setCfData({ rating: data.result[0].rating, rank: data.result[0].rank });
        }
      } catch (err) {
        console.error("Failed to fetch CF user data");
      }
    };
    fetchCF();
  }, [currentDate, cfHandle]);

  useGSAP(() => {
    if (!calendarContainerRef.current) return;
    gsap.killTweensOf(".calendar-day");
    gsap.fromTo(".calendar-day", 
      { opacity: 0, scale: 0.2, rotation: -10 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.5, stagger: { amount: 0.6, grid: "auto", from: "center" }, ease: "back.out(1.7)" }
    );
  }, { dependencies: [currentDate], scope: calendarContainerRef });

  const saveNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    localStorage.setItem(`calendar-notes-${format(currentDate, "yyyy-MM")}`, e.target.value);
  };

  const addEvent = (dateKey: string) => {
    if (!newEvent.trim()) return;
    const updated = { ...events, [dateKey]: [...(events[dateKey] || []), newEvent] };
    setEvents(updated);
    localStorage.setItem("calendar-events", JSON.stringify(updated));
    setNewEvent("");
  };

  const setMood = (dateKey: string, mood: string) => {
    const updated = { ...moods, [dateKey]: mood };
    setMoods(updated);
    localStorage.setItem("calendar-moods", JSON.stringify(updated));
    setEmojiPopupOpen(null); 
  };

  const toggleHabit = (dateKey: string, habit: "exercise" | "read" | "meditate") => {
    const dayHabits = habits[dateKey] || { exercise: false, read: false, meditate: false };
    const updated = { ...habits, [dateKey]: { ...dayHabits, [habit]: !dayHabits[habit] } };
    setHabits(updated);
    localStorage.setItem("calendar-habits", JSON.stringify(updated));
  };

  const calculateStreak = () => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if (habits[dateKey] && (habits[dateKey].exercise || habits[dateKey].read || habits[dateKey].meditate)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        if (streak === 0 && isSameDay(checkDate, new Date())) {
          checkDate = subDays(checkDate, 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  const getHabitProgress = (dateKey: string) => {
    const dayHabits = habits[dateKey];
    if (!dayHabits) return 0;
    const total = (dayHabits.exercise ? 1 : 0) + (dayHabits.read ? 1 : 0) + (dayHabits.meditate ? 1 : 0);
    return (total / 3) * 100;
  };

  const nextMonth = () => setDateTuple([addMonths(currentDate, 1), 1]);
  const prevMonth = () => setDateTuple([subMonths(currentDate, 1), -1]);
  const jumpToToday = () => {
    setDateTuple([new Date(), currentDate > new Date() ? -1 : 1]);
    setStartDate(new Date());
    setEndDate(null);
  };

  const handleDateClick = (day: Date) => {
    if (emojiPopupOpen) setEmojiPopupOpen(null);

    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (isBefore(day, startDate)) {
      setStartDate(day);
    } else {
      setEndDate(day);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDateGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDateGrid = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDateGrid, end: endDateGrid });
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const activeDateKey = startDate && !endDate ? format(startDate, "yyyy-MM-dd") : null;
  const currentStreak = calculateStreak();

  return (
    <div className={theme} onClick={() => setEmojiPopupOpen(null)}>
      <div ref={calendarContainerRef} className="w-full max-w-[1050px] mx-auto relative mt-8 mb-16 text-slate-900 dark:text-white" style={{ perspective: "2500px" }}>
        
        {/* Binding Header */}
        <div className="absolute -top-10 sm:-top-14 left-0 w-full flex flex-col items-center z-50 pointer-events-none">
          <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-6rem)] h-4 sm:h-5 bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-t-lg shadow-xl border-b border-gray-700 relative z-30">
            <div className="absolute top-1 sm:top-2 left-0 w-full flex justify-evenly px-4">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-2 sm:w-3 h-6 sm:h-12 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.8)] border border-gray-500 z-40"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: CONTEST SHOWCASE (Visible on xl screens and up) */}
        <div className="hidden xl:flex absolute top-20 -right-72 w-64 bg-white/60 dark:bg-[#020617]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-5 flex-col shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-40 max-h-[600px] overflow-hidden">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-white/10 pb-3 shrink-0">
            <Swords size={16} className="text-indigo-500"/> Upcoming Contests
          </h3>
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-2">
            {currentMonthContests.map((contest, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                key={i} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-3 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-colors shrink-0"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${contest.bg}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${contest.color}`}>
                  {format(new Date(contest.date), "MMM dd")}
                </span>
                <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-tight">
                  {contest.name}
                </span>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                  <Clock size={10} /> {contest.time} UTC
                </div>
              </motion.div>
            ))}
            {currentMonthContests.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No contests planned this month.</p>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentDate.toISOString()}
            custom={direction}
            variants={flipVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ transformOrigin: "top center", backfaceVisibility: "hidden" }}
            className="bg-white dark:bg-[#020617] rounded-b-2xl rounded-t-sm overflow-hidden flex flex-col relative w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-colors duration-500 ring-1 ring-black/5 dark:ring-white/10 min-h-[800px]"
          >
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* HERO SECTION */}
            <div className="relative w-full h-[220px] sm:h-[350px] bg-slate-900 overflow-hidden group">
              <motion.img 
                initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.6 }} transition={{ duration: 1.5, ease: "easeOut" }}
                src={MONTH_IMAGES[monthIndex]} alt={`${format(currentDate, "MMMM")} theme`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />

              {/* Controls */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 sm:gap-3 z-20">
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 sm:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg active:scale-95">
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button onClick={jumpToToday} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all shadow-lg active:scale-95">
                  <CalendarIcon size={14} /> <span className="hidden sm:inline">Today</span>
                </button>
              </div>

              {/* Codeforces API Component */}
              {cfData && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white"><Trophy size={14} /></div>
                  <div className="hidden sm:block text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 leading-none mb-1">{cfData.rank}</p>
                    <p className="text-sm font-black leading-none">{cfHandle} <span className="text-amber-400">{cfData.rating}</span></p>
                  </div>
                </motion.div>
              )}

              {/* Typography */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 flex flex-col z-10">
                <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-sky-400 text-sm sm:text-xl font-medium tracking-[0.3em] drop-shadow-md">
                  {format(currentDate, "yyyy")}
                </motion.span>
                <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-white text-4xl sm:text-[5rem] leading-none font-black tracking-tighter mt-1 drop-shadow-2xl">
                  {format(currentDate, "MMMM")}
                </motion.span>
              </div>

              {/* Pagination */}
              <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 z-20 flex bg-black/40 backdrop-blur-2xl rounded-full p-1 border border-white/20 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
                <button onClick={(e) => { e.stopPropagation(); prevMonth(); }} className="text-white hover:bg-white/20 hover:text-sky-400 rounded-full p-2 transition-all active:scale-90"><ChevronLeft size={20} /></button>
                <div className="w-px bg-white/20 my-2 mx-1"></div>
                <button onClick={(e) => { e.stopPropagation(); nextMonth(); }} className="text-white hover:bg-white/20 hover:text-sky-400 rounded-full p-2 transition-all active:scale-90"><ChevronRight size={20} /></button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col lg:flex-row w-full p-4 sm:p-8 gap-8 sm:gap-12 pb-8 relative z-10 flex-1">
              
              {/* --- SIDEBAR --- */}
              <div className="w-full lg:w-[30%] flex flex-col order-2 lg:order-1 space-y-6">
                
                <AnimatePresence mode="popLayout">
                  {activeDateKey ? (
                    <motion.div 
                      key="daily-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="bg-sky-50 dark:bg-sky-950/20 p-5 rounded-2xl border border-sky-100 dark:border-sky-900/30 space-y-5"
                    >
                      <div className="flex justify-between items-center border-b border-sky-200 dark:border-sky-800/50 pb-3">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                          <Target size={16} className="text-sky-500"/>
                          {format(startDate!, "MMM d, yyyy")}
                        </h4>
                      </div>

                      {/* Sidebar Habits */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] block mb-2">Daily Regimen</span>
                        <div className="flex gap-2">
                          <button onClick={() => toggleHabit(activeDateKey, "exercise")} className={cn("p-2 rounded-xl transition-all border flex-1 flex justify-center", habits[activeDateKey]?.exercise ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-white dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10")}>
                            <Activity size={18} />
                          </button>
                          <button onClick={() => toggleHabit(activeDateKey, "read")} className={cn("p-2 rounded-xl transition-all border flex-1 flex justify-center", habits[activeDateKey]?.read ? "bg-sky-500/10 border-sky-500/30 text-sky-500" : "bg-white dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10")}>
                            <Code2 size={18} />
                          </button>
                          <button onClick={() => toggleHabit(activeDateKey, "meditate")} className={cn("p-2 rounded-xl transition-all border flex-1 flex justify-center", habits[activeDateKey]?.meditate ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-white dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10")}>
                            <Book size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Sidebar Tasks */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] block mb-2">Schedule</span>
                        <div className="flex flex-col gap-2 mb-3 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                          {events[activeDateKey]?.map((ev, idx) => (
                            <div key={idx} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                              <span className="text-gray-700 dark:text-slate-200 truncate">{ev}</span>
                            </div>
                          ))}
                          {(!events[activeDateKey] || events[activeDateKey].length === 0) && (
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 italic">No tasks scheduled.</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text" value={newEvent} onChange={(e) => setNewEvent(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addEvent(activeDateKey)}
                            placeholder="Add task..."
                            className="flex-1 text-xs bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 text-gray-900 dark:text-white"
                          />
                          <button onClick={() => addEvent(activeDateKey)} className="bg-sky-500 text-white px-3 rounded-lg hover:bg-sky-400 transition-colors">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="quote-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-sky-50 dark:bg-sky-950/20 p-5 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                      <Sparkles className="text-sky-400 mb-3" size={18} />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        "{MONTHLY_QUOTES[monthIndex]}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Persistent Monthly Notes */}
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <h3 className="font-bold text-gray-900 dark:text-slate-300 text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Code2 size={16} className="text-sky-500" /> Monthly Notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={saveNotes}
                    placeholder="General memos, goals..."
                    className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-gray-700 dark:text-slate-400 placeholder:text-gray-400 dark:placeholder:text-slate-700 transition-all custom-scrollbar"
                    style={{
                      lineHeight: "2.5rem",
                      backgroundImage: theme === 'dark' 
                        ? "linear-gradient(transparent, transparent calc(2.5rem - 1px), rgba(255,255,255,0.05) calc(2.5rem - 1px), rgba(255,255,255,0.05) 2.5rem)"
                        : "linear-gradient(transparent, transparent calc(2.5rem - 1px), #e5e7eb calc(2.5rem - 1px), #e5e7eb 2.5rem)",
                      backgroundSize: "100% 2.5rem",
                    }}
                  />
                </div>
              </div>

              {/* --- CALENDAR GRID --- */}
              <div className="w-full lg:w-[70%] flex flex-col order-1 lg:order-2">
                <div className="grid grid-cols-7 mb-4 sm:mb-6">
                  {weekDays.map((day, i) => (
                    <div key={day} className={cn("text-center text-[10px] sm:text-xs font-bold tracking-[0.2em]", i >= 5 ? "text-sky-500" : "text-gray-500 dark:text-slate-500")}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 sm:gap-y-4 relative">
                  {days.map((day) => {
                    const dKey = format(day, "yyyy-MM-dd");
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isToday = isSameDay(day, new Date());
                    const isSelectedStart = startDate && isSameDay(day, startDate);
                    const isSelectedEnd = endDate && isSameDay(day, endDate);
                    const isWithinSelection = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
                    const hasEvents = events[dKey]?.length > 0;
                    const mood = moods[dKey];
                    const specialDay = SPECIAL_DAYS[format(day, "MM-dd")];
                    const progress = getHabitProgress(dKey);
                    const isPopupOpen = emojiPopupOpen === dKey;
                    
                    // Allow multiple dots per day
                    const contestsOnDay = currentMonthContests.filter(c => c.date === dKey);
                    
                    const isHoverRange = startDate && !endDate && hoverDate && isWithinInterval(day, {
                        start: isBefore(hoverDate, startDate) ? hoverDate : startDate,
                        end: isBefore(hoverDate, startDate) ? startDate : hoverDate,
                      });

                    return (
                      <div key={dKey} className="calendar-day relative flex flex-col justify-start items-center h-12 sm:h-16 group" onMouseEnter={() => setHoverDate(day)}>
                        
                        {/* Selection Highlight */}
                        {(isWithinSelection || isHoverRange) && (
                          <div className={cn("absolute top-0 bottom-2 sm:bottom-4 left-0 right-0 bg-sky-500/10 dark:bg-sky-500/20", (isSelectedStart || (isHoverRange && isSameDay(day, startDate!))) && "rounded-l-full", (isSelectedEnd || (isHoverRange && isSameDay(day, hoverDate!))) && "rounded-r-full" )} />
                        )}

                        {/* Interactive Day Button */}
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDateClick(day)}
                          className={cn(
                            "relative z-10 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors",
                            !isCurrentMonth && "text-gray-300 dark:text-slate-700/50",
                            isCurrentMonth && !isWeekend && !isSelectedStart && !isSelectedEnd && "text-gray-700 dark:text-slate-200 group-hover:bg-gray-100 dark:group-hover:bg-white/5",
                            isCurrentMonth && isWeekend && !isSelectedStart && !isSelectedEnd && "text-sky-500 group-hover:bg-sky-500/10",
                            isToday && !isSelectedStart && !isSelectedEnd && "ring-2 ring-sky-500 text-sky-500 font-bold bg-sky-50 dark:bg-sky-950/30",
                            (isSelectedStart || isSelectedEnd) && "bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)]"
                          )}
                        >
                          {/* Visual Habit Progress Ring */}
                          {progress > 0 && !(isSelectedStart || isSelectedEnd) && (
                             <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                               <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="301" strokeDashoffset={301 - (301 * progress) / 100} className="text-emerald-400/50 dark:text-emerald-400/30" strokeLinecap="round" />
                             </svg>
                          )}
                          
                          {format(day, "d")}
                        </motion.button>

                        {/* Event Badges, Contest Dots & Emoji Trigger Area */}
                        <div className="flex gap-1 mt-1 z-20 items-center justify-center h-3 sm:h-4 relative w-full">
                          
                          {/* Dynamic Contest Dots (Maps up to 3 dots horizontally) */}
                          {contestsOnDay.length > 0 && (
                             <div className="flex gap-[3px] pointer-events-auto">
                               {contestsOnDay.slice(0, 3).map((contest, idx) => (
                                 <div key={idx} title={contest.name} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${contest.bg} shadow-md`}></div>
                               ))}
                             </div>
                          )}

                          {specialDay && (
                            <div title={specialDay.label} className="absolute -top-10 right-1 sm:right-2 bg-white dark:bg-[#020617] rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-800 pointer-events-none">
                              {specialDay.icon}
                            </div>
                          )}
                          
                          {/* Tiny Emoji Trigger Button - 3D Styled */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEmojiPopupOpen(isPopupOpen ? null : dKey); }} 
                            className="text-[10px] sm:text-[14px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] hover:scale-125 transition-transform"
                            style={mood ? { filter: "contrast(1.2) saturate(1.2)" } : {}}
                          >
                            {mood || <span className="opacity-0 group-hover:opacity-40 text-gray-400 dark:text-slate-500 text-[10px]">☻</span>}
                          </button>

                          {/* Fallback event dot if no contest dots are taking up space */}
                          {hasEvents && !mood && contestsOnDay.length === 0 && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] pointer-events-none"></div>}

                          {/* INLINE EMOJI POP-UP - 3D Styled emojis */}
                          <AnimatePresence>
                            {isPopupOpen && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className="absolute bottom-full mb-2 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border border-gray-100 dark:border-white/10 rounded-full shadow-xl flex gap-2 p-2 z-[100]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {MOODS.map(m => (
                                  <button 
                                    key={m} 
                                    onClick={() => setMood(dKey, m)} 
                                    className="text-xl sm:text-2xl hover:scale-125 transition-transform"
                                    style={{ filter: "drop-shadow(0px 3px 3px rgba(0,0,0,0.3)) contrast(1.1) saturate(1.2)" }}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Ribbon */}
            <div className="bg-gray-50/80 dark:bg-[#020617]/80 backdrop-blur-md border-t border-gray-200 dark:border-white/[0.05] px-6 py-4 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-full shadow-sm">
                <Flame size={16} className={currentStreak > 0 ? "text-amber-500 animate-pulse" : "text-gray-400"} />
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 tracking-wider">
                  {currentStreak} DAY STREAK
                </span>
              </div>
              
              {(startDate || endDate) && (
                 <button onClick={() => { setStartDate(null); setEndDate(null); setEmojiPopupOpen(null); }} className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-rose-500 transition-colors">
                   Clear Selection
                 </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}