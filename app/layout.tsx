import type { Metadata } from "next";
import { Inter } from "next/font/google";
// THIS LINE IS THE MOST IMPORTANT LINE! It loads the Tailwind CSS.
import "./globals.css"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Calenflow | Stay Organized",
  description: "A premium interactive wall calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}