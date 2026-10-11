"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, BookOpen, Settings, PlusCircle, Cpu, WifiOff, Sun, Moon } from "lucide-react";
import { AIModelStatus } from "@/lib/types/investigation";

export function Navbar() {
  const pathname = usePathname();
  const [modelStatus, setModelStatus] = useState<AIModelStatus | null>(null);
  const [outdoorMode, setOutdoorMode] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/ai/health")
      .then((r) => r.json())
      .then((data) => setModelStatus(data))
      .catch((e) => {
        setModelStatus({
          available: false,
          runtime: "Ollama",
          model: "gemma4:12b",
          visionModel: "gemma4:12b",
          hasVisionSupport: false,
          inferenceMode: "local",
          endpoint: "http://127.0.0.1:11434",
          error: "Connection check failed: " + e.message,
        });
      });
  }, []);

  const toggleOutdoorMode = () => {
    const next = !outdoorMode;
    setOutdoorMode(next);
    if (next) {
      document.body.classList.add("outdoor-mode");
    } else {
      document.body.classList.remove("outdoor-mode");
    }
  };

  const navItems = [
    { href: "/", label: "Field Desk", icon: Compass },
    { href: "/investigate/new", label: "New Investigation", icon: PlusCircle },
    { href: "/journal", label: "Field Journal", icon: BookOpen },
    { href: "/settings", label: "Model & Prompts", icon: Settings },
  ];

  return (
    <header className="border-b border-paper-300 bg-paper-100/90 backdrop-blur-sm sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-paper-100 font-serif font-bold text-lg shadow-sm">
              M
            </div>
            <div>
              <span className="font-serif font-bold text-xl text-forest tracking-tight group-hover:text-forest-600 transition-colors">
                Mundane
              </span>
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-stone-500 ml-2 font-mono">
                Field Investigator
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-forest-100 text-forest-700 font-semibold"
                    : "text-charcoal-600 hover:text-forest hover:bg-paper-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status Pills & Controls */}
        <div className="flex items-center space-x-2">
          {/* Outdoor Mode Button */}
          <button
            onClick={toggleOutdoorMode}
            title={outdoorMode ? "Standard theme" : "High-contrast outdoor sunlight mode"}
            aria-label="Toggle outdoor mode"
            className={`p-2 rounded-md text-xs font-mono flex items-center space-x-1 border transition-colors ${
              outdoorMode
                ? "bg-stone-800 text-yellow-300 border-stone-600"
                : "bg-paper-200 text-charcoal-700 border-paper-300 hover:bg-paper-300"
            }`}
          >
            {outdoorMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-stone-600" />}
            <span className="hidden lg:inline text-xs">{outdoorMode ? "Sunlight Mode" : "Standard"}</span>
          </button>

          {/* AI Runtime Status Badge */}
          <Link
            href="/settings"
            title={modelStatus?.available ? `Ready: ${modelStatus.model} via ${modelStatus.runtime}` : modelStatus?.error || "Checking AI runtime..."}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
              modelStatus?.available
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${modelStatus?.available ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {modelStatus ? (modelStatus.available ? modelStatus.model : "AI Offline") : "Checking..."}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper-100 border-t border-paper-300 z-50 flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-md ${
                isActive ? "text-forest-700 font-bold" : "text-stone-500 hover:text-forest"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
