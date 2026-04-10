/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.APP.SURFACE
TAG: UI.COMPONENT.BRANDING.WATERMARK

COLOR_ONION_HEX:
NEON=#94A3B8
FLUO=#CBD5E1
PASTEL=#F1F5F9

ICON_ASCII:
family=lucide
glyph=copyright

5WH:
WHAT = Persistent global watermark for the Agent Lee System
WHY = To enforce brand presence across the entire OS environment unconditionally
WHO = LeeWay Industries · LeeWay Innovations · Leonard Lee
WHERE = components/LeewayWatermark.tsx
WHEN = 2026-04-04
HOW = React component with fixed absolute positioning and CSS overrides

AGENTS:
AZR
leeway

LICENSE:
MIT
*/

import React, { useEffect } from "react";

export const LeewayWatermark = () => {
  useEffect(() => {
    try {
      const existingLogs = JSON.parse(localStorage.getItem("agent_lee_logs") || "[]");
      const newLog = {
        id: Date.now().toString(),
        type: "branding_event",
        message: "Watermark 'Powered by Leeway Innovations' loaded.",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("agent_lee_logs", JSON.stringify([newLog, ...existingLogs]));
    } catch (e) {
      console.error("Failed to log watermark event", e);
    }
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "6px",
          left: "10px",
          fontSize: "10px",
          opacity: 0.35,
          color: "#94a3b8",
          pointerEvents: "none",
          zIndex: 99999, // Super high to ensure it sits above all UI elements
          letterSpacing: "0.5px"
        }}
      >
        Designed &amp; Developed by LeeWay Innovations · © Leonard Lee
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "6px",
          right: "10px",
          opacity: 0.7,
          pointerEvents: "none",
          zIndex: 99999,
          fontSize: "10px",
          color: "#94a3b8",
          letterSpacing: "0.5px"
        }}
      >
        LeeWay Industries
      </div>
    </>
  );
};

