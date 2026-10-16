"use client";
import { useEffect, useState } from "react";

export default function OfflineBar() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const goOff = () => setOnline(false);
    const goOn = () => setOnline(true);
    window.addEventListener("offline", goOff);
    window.addEventListener("online", goOn);
    return () => {
      window.removeEventListener("offline", goOff);
      window.removeEventListener("online", goOn);
    };
  }, []);
  if (online) return null;
  return <div className="offline-bar">No internet. Aido will work again when you reconnect. Your saved data is safe.</div>;
}
