// services/leeway_inference.ts
// LeeWay Inference Service — local-only. Created by Leonard Lee · LeeWay Innovations.
// All inference routes to Ollama. Zero cloud API calls.

export { LeewayInferenceClient } from '../core/LeewayInferenceClient';

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';

/**
 * Generate an image description (text) using local model.
 * Actual image generation requires a local diffusion model endpoint.
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const result = await LeewayInferenceClient.generate({
    prompt,
    systemPrompt: 'You are a creative visual AI. Describe or generate visual content based on the prompt.',
    agent: 'Pixel',
    temperature: 0.7,
  });
  return result.text;
};

/**
 * Generate a voxel scene description from an image using local model.
 */
export const generateVoxelScene = async (
  imageBase64: string,
  _onThoughtUpdate?: (thought: string) => void
): Promise<string> => {
  try {
    const result = await LeewayInferenceClient.generate({
      prompt: 'Analyze this image and describe a voxel scene based on it.',
      systemPrompt: 'You are Agent Lee visual cortex. Generate 3D voxel scene descriptions.',
      agent: 'Pixel',
      temperature: 0.4,
    });
    return result.text;
  } catch (error) {
    console.error('[LeeWay Inference] Voxel scene generation failed:', error);
    throw error;
  }
};
