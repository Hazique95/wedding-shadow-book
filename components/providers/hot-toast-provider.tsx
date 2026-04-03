"use client";

import { Toaster } from "react-hot-toast";

export function HotToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "18px",
          border: "1px solid rgba(244, 188, 197, 0.45)",
          background: "rgba(255,255,255,0.96)",
          color: "#261a23",
          boxShadow: "0 18px 50px -26px rgba(113, 40, 62, 0.45)",
        },
      }}
    />
  );
}
