import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import EED from "./views/EED";
import Jobs from "./views/Jobs";

// Simple Router
const usePath = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return path;
};

export default function App() {
  const path = usePath();

  const renderView = () => {
    switch (path) {
      case "/":
        return <Jobs />; // Default to Jobs for the matching system
      case "/eed":
        return <EED />;
      case "/emplois":
        return <Jobs />;
      default:
        return <Jobs />;
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main>
        {renderView()}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
