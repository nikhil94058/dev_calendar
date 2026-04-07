import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 12 Months mapped to your local public folder images
export const monthData = [
  { theme: "blue", img: "/sunday.jpeg" },       // Jan
  { theme: "indigo", img: "/monday.jpeg" },     // Feb
  { theme: "emerald", img: "/tuesday.jpeg" },   // Mar
  { theme: "green", img: "/wednesday.png" },    // Apr
  { theme: "teal", img: "/thrusday.jpeg" },     // May (Spelled to match your folder)
  { theme: "yellow", img: "/friday.jpeg" },     // Jun
  { theme: "orange", img: "/saturday.png" },    // Jul
  { theme: "red", img: "/sunday.jpeg" },        // Aug (Looping back to Sunday)
  { theme: "amber", img: "/monday.jpeg" },      // Sep
  { theme: "orange", img: "/tuesday.jpeg" },    // Oct
  { theme: "stone", img: "/wednesday.png" },    // Nov
  { theme: "sky", img: "/thrusday.jpeg" }       // Dec
];