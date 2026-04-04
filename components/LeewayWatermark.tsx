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
GEMINI

LICENSE:
MIT
*/

import React from "react";

export const LeewayWatermark = () => {
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
