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

import React, { useEffect } from 'react';
import { AgentLee } from '../components/AgentLee';
import { ChatInterface } from '../components/ChatInterface';
import { motion } from 'framer-motion';
import { pushDiagnosticsReport } from '../core/diagnostics_bridge';

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
  useEffect(() => {
    pushDiagnosticsReport({
      surface: 'home',
      status: 'ok',
      message: 'Home surface heartbeat synchronized.',
      agents: ['Agent Lee', 'Echo'],
      mcps: ['memory-agent-mcp', 'vision-agent-mcp'],
      tags: ['department:home', 'subsurface:main-canvas', 'contract:strict']
    });
  }, [backgroundImage, voxelCode, isSpeaking, isChangingForm]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
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
          />
        </div>
      </motion.div>
    </div>
  );
};
