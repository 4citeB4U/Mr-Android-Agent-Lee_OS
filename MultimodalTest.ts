// MultimodalTest.ts
// Simulates a vision event (error box) and a voice event ("Fix") to test Sovereign Synthesis Layer
import { PerceptionBus } from './core/PerceptionBus';

export async function runMultimodalTest() {
  const bus = PerceptionBus.getInstance();

  // Simulate a vision event (error box)
  await bus.publish({
    id: 'test_vision_1',
    type: 'vision',
    source: 'TestSuite',
    timestamp: Date.now(),
    payload: {
      kind: 'vision',
      state: 'processing',
      frame: { width: 640, height: 480, rotation: 0, format: 'rgba' },
      detections: [{ type: 'object', label: 'error box', confidence: 0.99 }],
      sceneDescription: 'Red error box on screen',
      metadata: {}
    }
  });

  // Simulate a voice event ("Fix")
  await bus.publish({
    id: 'test_voice_1',
    type: 'voice',
    source: 'TestSuite',
    timestamp: Date.now(),
    payload: {
      kind: 'voice',
      state: 'processing',
      transcript: 'Fix',
      confidence: 0.98,
      isFinal: true,
      audio: { format: 'pcm16', sampleRate: 16000, duration: 1000 },
      originalLanguage: 'en',
      metadata: {}
    }
  });
}
