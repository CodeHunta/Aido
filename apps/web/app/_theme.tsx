"use client";
import { useEffect, useState } from "react";

export default function DarkToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const on = !dark;
    setDark(on);
    document.documentElement.classList.toggle("dark", on);
    try {
      localStorage.setItem("aido-theme", on ? "dark" : "light");
    } catch {
      // private mode — theme just won't persist
    }
  }
  return (
    <button className="btn" onClick={toggle} aria-label="Toggle dark mode" style={{ marginLeft: "auto" }}>
      {dark ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
