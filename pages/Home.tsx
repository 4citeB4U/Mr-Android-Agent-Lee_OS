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
import { audioOrchestrator } from '../utils/audioOrchestrator';

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

  // Cinematic Reveal: Trigger app:loaded after a short delay to ensure welcome screen fade is done
  useEffect(() => {
    const timer = setTimeout(() => {
      audioOrchestrator.handleEvent('app:loaded');
    }, 1200); // Wait for most of the 1.5s exit animation
    return () => clearTimeout(timer);
  }, []);

  // Animate progress bar (Removed - handled internally in AgentLeeForm 20s cycle)

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
          />
        </div>
        {/* Progress indicators removed for clean UI parity */}
      </motion.div>
    </div>
  );
};
