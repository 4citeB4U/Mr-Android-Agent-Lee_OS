/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.BUILD.CONFIG
TAG: CORE.BUILD.VITE.CONFIG

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=settings

5WH:
WHAT = Vite build configuration for Agent Lee Voxel OS
WHY = Configures the dev server, plugin pipeline, env injection, and module aliases
WHO = Agent Lee OS
WHERE = vite.config.ts
WHEN = 2026
HOW = Vite defineConfig with React + TailwindCSS plugins, env var injection, and path aliasing

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: mode === 'production' ? '/Mr-Android-Agent-Lee_OS/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              monaco: ['@monaco-editor/react'],
              gemini: ['@google/genai'],
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
