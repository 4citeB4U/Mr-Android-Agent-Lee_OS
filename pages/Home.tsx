/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.HOME
TAG: UI.PAGE.HOME.MAIN

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=home

5WH:
WHAT = Home page — main voxel rendering screen with Agent Lee avatar and chat interface
WHY = Primary canvas where Agent Lee's voxel form is displayed and the user interacts with the system
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Home.tsx
WHEN = 2026
HOW = React component rendering AgentLee avatar component full-screen with motion entrance animation

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.HOME
TAG: UI.PAGE.HOME.MAIN

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=home

5WH:
WHAT = Home page — main voxel rendering screen with Agent Lee avatar and chat interface
WHY = Primary canvas where Agent Lee's voxel form is displayed and the user interacts with the system
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Home.tsx
WHEN = 2026
HOW = React component rendering AgentLee avatar component full-screen with motion entrance animation

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import React, { useEffect, useState } from 'react';
import { AgentLee } from '../components/AgentLee';
import { ChatInterface } from '../components/ChatInterface';
import { motion } from 'framer-motion';
import { pushDiagnosticsReport } from '../core/diagnostics_bridge';

const SHAPE_STORAGE_KEY = 'agent_lee_enabled_shapes';
const ALL_SHAPES = [
  'Eagle', 'Cat', 'Rabbit', 'Twins',
  'Block Eagle', 'Jetpack Cat', 'Pagoda', 'Cyberpunk City', 'Sakura Island'
];

interface HomeProps {
  voxelCode: string | null;
  savedVoxels: any[];
  isSpeaking: boolean;
  isChangingForm: boolean;
  onSendMessage: (msg: string) => void;
  onFileUpload: (file: File) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  backgroundImage?: string | null;
}


export const Home: React.FC<HomeProps> = ({
  voxelCode,
  savedVoxels,
  isSpeaking,
  isChangingForm,
  onSendMessage,
  onFileUpload,
  onGenerate,
  isGenerating,
  backgroundImage = null
}) => {
  // Load enabled shapes from localStorage (default: all enabled)
  const [enabledShapes, setEnabledShapes] = useState<string[]>(() => {
    const stored = localStorage.getItem(SHAPE_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return [...ALL_SHAPES]; }
    }
    return [...ALL_SHAPES];
  });

  // Listen for settings changes (eventBus or window event)
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.type === 'agent-lee:shapes') {
        setEnabledShapes(e.detail.shapes);
      }
    };
    window.addEventListener('agent-lee:shapes', handler);
    return () => window.removeEventListener('agent-lee:shapes', handler);
  }, []);

  // For progress bar and shape name
  const [currentShape, setCurrentShape] = useState(enabledShapes[0] || '');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setCurrentShape(enabledShapes[0] || '');
  }, [enabledShapes]);

  // Animate progress bar (auto-morph every 2s)
  useEffect(() => {
    setProgress(0);
    if (enabledShapes.length < 2) return;
    let pct = 0;
    const interval = setInterval(() => {
      pct += 5;
      setProgress(Math.min(100, pct));
    }, 100);
    return () => clearInterval(interval);
  }, [currentShape, enabledShapes]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-black">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full h-full flex flex-col items-center justify-center z-10"
      >
        <div className="w-full h-full relative flex items-center justify-center">
          <AgentLee
            voxelCode={voxelCode}
            savedVoxels={savedVoxels}
            isSpeaking={isSpeaking}
            isChangingForm={isChangingForm}
            size="large"
            className="w-full h-full max-w-none"
            backgroundImage={backgroundImage}
            enabledShapes={enabledShapes}
            onShapeChange={setCurrentShape}
          />
        </div>
        {/* Shape name and progress bar - REMOVED */}
        <div className="absolute bottom-0 left-0 w-full flex flex-col items-center pb-8 pointer-events-none hidden">
          <div className="text-xs md:text-base font-bold uppercase tracking-[0.2em] text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.7)] mb-2">
            {currentShape}
          </div>
          <div className="w-64 max-w-[80vw] h-2 bg-[#08101e] rounded-full overflow-hidden">
            <div className="h-full bg-[#00f2ff] transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
