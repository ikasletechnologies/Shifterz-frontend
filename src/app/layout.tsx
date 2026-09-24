import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Rye } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const rye = Rye({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rye",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shifterz",
  description: "Shifterz Workshop & Franchise Management Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased font-sans ${inter.variable} ${plusJakarta.variable} ${rye.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased text-slate-900 bg-white font-sans selection:bg-amber-100 selection:text-amber-900" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

