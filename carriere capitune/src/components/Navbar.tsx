import React, { useState, useEffect } from "react";
import { Menu, X, Globe, ChevronRight } from "lucide-react";
import { NAV_LINKS, APP_NAME } from "../constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"FR" | "EN">("FR");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md border-b border-white/5 py-3" : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black group-hover:scale-110 transition-transform">
            C
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase text-white">{APP_NAME}</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-white transition-colors"
          >
            <Globe className="w-3 h-3" />
            {lang}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-white/10 p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="text-lg font-bold text-left text-white"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
