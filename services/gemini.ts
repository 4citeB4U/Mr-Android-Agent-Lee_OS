/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.SERVICES.GEMINI
TAG: AI.ORCHESTRATION.SERVICES.GEMINI.CLIENT

COLOR_ONION_HEX:
NEON=#4285F4
FLUO=#5A9AF5
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=sparkles

5WH:
WHAT = Gemini service wrapper — image generation and voxel scene generation via Google GenAI SDK
WHY = Provides the actual Gemini API calls for image and voxel creative content generation
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = services/gemini.ts
WHEN = 2026
HOW = Direct GoogleGenAI SDK calls for image generation and streaming voxel scene HTML creation

AGENTS:
ASSESS
AUDIT
GEMINI
PIXEL

LICENSE:
Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI } from "@google/genai";
import { extractHtmlFromText } from "../utils/html";
import {
  firstDefinedModel,
  GEMINI_FREE_TIER_PRIMARY,
  GEMINI_FREE_TIER_THINKING,
  GEMINI_IMAGE_MODEL_CANDIDATES,
} from "../core/model_lane_policy";

// Initialize Gemini Client
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is required for Gemini service.');
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const IMAGE_MODELS = [
  firstDefinedModel((import.meta as any).env.VITE_GEMINI_IMAGE_MODEL, GEMINI_IMAGE_MODEL_CANDIDATES[0]),
  ...GEMINI_IMAGE_MODEL_CANDIDATES,
].filter((v, i, arr) => arr.indexOf(v) === i);

const VOXEL_MODEL = firstDefinedModel(
  (import.meta as any).env.VITE_GEMINI_VOXEL_MODEL,
  GEMINI_FREE_TIER_THINKING,
  GEMINI_FREE_TIER_PRIMARY
);

export const IMAGE_SYSTEM_PROMPT = "Generate a beautiful voxel art style object or character on a simple background. The style should be blocky, Minecraft-like, or isometric voxel art.";
export const VOXEL_PROMPT = `I have provided an image. Your task is to create a 3D voxel art representation of the main subject in this image using Three.js.

ENVIRONMENT & STYLE (CRITICAL):
- The subject MUST be placed on a floating voxel island (inverted cone shape with noise).
- Use a warm, cloudy background color: 0xffeedd.
- Add a subtle fog: new THREE.FogExp2(0xffeedd, 0.015).
- Use THREE.InstancedMesh for all voxels (subject and island).
- Include THREE.OrbitControls with autoRotate = true and autoRotateSpeed = 0.5.
- Lighting: AmbientLight(0xffcccc, 0.6) and a DirectionalLight(0xfffaed, 1.5) at (50, 80, 30) with shadows.

ANIMATION & PHYSICS REQUIREMENTS (MANDATORY):
- Every voxel must have physics properties: x, y, z (target), vx, vy, vz, rx, ry, rz, rvx, rvy, rvz.
- On load, voxels must start in a "SCATTERED" state: spread out on a virtual floor at y = -30 with random positions and rotations.
- Immediately after load, voxels must transition to a "REBUILDING" state.
- The rebuild animation should move voxels from their scattered positions to their target positions with height-based delays (building from bottom to top).
- Implement a "dismantle" function triggered via window.addEventListener('message', (e) => { if (e.data.type === 'DISMANTLE') { ... } }).
- In the "DISMANTLING" state, voxels must fall with gravity (vy -= 0.025) and bounce when hitting y = -30.
- Use smooth interpolation (lerp) for the rebuilding movement.

CODE STRUCTURE REFERENCE:
1. Setup Scene, Camera, Renderer, Controls, Lighting.
2. Define a 'voxels' array and an 'addVoxel(x, y, z, color)' function.
3. Procedurally generate the floating island (inverted cone) and the subject from the image.
4. Create a single THREE.InstancedMesh for all voxels.
5. In the animate loop, handle states:
   - 'SCATTERED': Voxels at y = -30.
   - 'REBUILDING': Lerp to target positions with height-based delay.
   - 'DISMANTLING': Apply gravity and bounce.
6. Add window message listener for 'DISMANTLE'.

STRICT OUTPUT RULES:
- Output ONLY the HTML code.
- DO NOT include any conversational text.
- DO NOT use markdown code blocks.
- Just the raw HTML starting with <!DOCTYPE html>.`;

export const generateImage = async (prompt: string, aspectRatio: string = '1:1', optimize: boolean = true): Promise<string> => {
  try {
    let finalPrompt = prompt;

    // Apply the shortened optimization prompt if enabled
    if (optimize) {
      finalPrompt = `${IMAGE_SYSTEM_PROMPT}\n\nSubject: ${prompt}`;
    }

    for (const model of IMAGE_MODELS) {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              text: finalPrompt,
            },
          ],
        },
        config: {
          responseModalities: [
              'IMAGE',
          ],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("No image generated from configured Gemini image lanes.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVoxelScene = async (
  imageBase64: string, 
  onThoughtUpdate?: (thought: string) => void
): Promise<string> => {
  // Extract the base64 data part if it includes the prefix
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  
  // Extract MIME type from the data URL if present, otherwise default to jpeg
  const mimeMatch = imageBase64.match(/^data:(.*?);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  let fullHtml = "";

  try {
    const response = await ai.models.generateContentStream({
      model: VOXEL_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: VOXEL_PROMPT
          }
        ]
      },
    });

    for await (const chunk of response) {
      const candidates = chunk.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          // Cast to any to access 'thought' property if not in current type definition
          const p = part as any;
          
          if (p.thought) {
            if (onThoughtUpdate && p.text) {
              onThoughtUpdate(p.text);
            }
          } else {
            if (p.text) {
              fullHtml += p.text;
            }
          }
        }
      }
    }

    return extractHtmlFromText(fullHtml);

  } catch (error) {
    console.error("Voxel scene generation failed:", error);
    throw error;
  }
};
