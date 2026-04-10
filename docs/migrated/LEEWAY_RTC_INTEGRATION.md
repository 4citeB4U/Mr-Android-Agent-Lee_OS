# LeeWay-RTC + Agent Lee Integration Guide

## Overview
Agent Lee now uses **LeeWay-Edge-RTC** as the primary voice and vision transport layer, with **local Qwen model** for intelligence, and **leeway as a fallback only** for complex tasks.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Agent Lee Agentic Operating System                          │
│                   (React Frontend)                            │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐      ┌─────▼─────┐
   │  STT    │        │   TTS   │      │   Vision  │
   │ (Web    │        │(Browser │      │  (RTC)    │
   │ Speech) │        │Engine)  │      │           │
   └────┬────┘        └────┬────┘      └─────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │    LeewayRTCClient (Local)           │
        │  - WebSocket to SFU                 │
        │  - Audio/Video Stream Management    │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │   Agent Lee Brain (Local)            │
        │  ┌─────────────────────────────────┐ │
        │  │  Qwen Local Model Inference     │ │
        │  │  (or Agent Lee Persona Rules)   │ │
        │  └─────────────────────────────────┘ │
        │  ┌─────────────────────────────────┐ │
        │  │  Firebase AI (enhanced)          │ │
        │  │  for memory + capabilities      │ │
        │  └─────────────────────────────────┘ │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │  leeway API (FALLBACK ONLY)          │
        │  - Heavy computation fallback       │
        │  - Complex reasoning (if needed)    │
        └──────────────────────────────────────┘
```

## Key Changes from Previous Architecture

### Before (leeway-First)
- ❌ leeway Live WebSocket as primary voice transport
- ❌ Dependent on external API for all responses
- ❌ Cloud-reliant, network latency

### Now (LeeWay-Edge-RTC Primary)
- ✅ LeeWay-Edge-RTC as primary voice/vision transport
- ✅ Local Qwen model for initial inference 
- ✅ Agent Lee Persona for rule-based responses
- ✅ Firebase AI for enhanced capabilities
- ✅ leeway only when local capacity insufficient

## Environment Setup

### 1. Update `.env.local`
```env
# LeeWay-Edge-RTC WebSocket URL (primary)
VITE_VOICE_WS_URL=ws://localhost:3000/ws
# or for production:
# VITE_VOICE_WS_URL=wss://leeway-edge-rtc.fly.dev/ws

# leeway API Key (FALLBACK ONLY - optional)
# Only needed if Qwen inference fails
VITE_leeway_API_KEY=your-api-key-here

# Local Qwen Model Endpoint (when running locally)
VITE_QWEN_API_URL=http://localhost:5000
# or cloud:
# VITE_QWEN_API_URL=https://qwen-api.example.com
```

### 2. Start LeeWay-Edge-RTC Services

#### Option A: Local Development
```bash
cd LeeWay-Edge-RTC-main
npm install
npm run dev
# Starts SFU at http://localhost:3000
```

#### Option B: Use Fly.io Production
```env
VITE_VOICE_WS_URL=wss://leeway-edge-rtc.fly.dev/ws
```

### 3. Start Local Model (Phi 2.5 - Recommended)
```bash
# Using Ollama (easiest and recommended)
ollama pull phi
ollama serve
# Runs at http://localhost:11434 (default)
```

**Why Phi 2.5 instead of Qwen 7B?**
- 3x faster inference (200-300ms vs 600-1000ms)
- 70% less memory (5-6GB vs 14-16GB)
- Better for CPU fallback (2-3s instead of 8-12s)
- SOTA reasoning for lightweight models

**Alternative: Qwen 1.5B (for consistency with existing setup)**
```bash
ollama pull qwen:1.5b
ollama serve
```

**Alternative: Qwen 1.5B (for consistency with existing setup)**
```bash
ollama pull qwen:1.5b
ollama serve
```

**Performance Targets (with Phi 2.5):**
- Persona rules: < 100ms (instant)
- Phi inference: 200-300ms (fast)
- Total response: < 500ms
- CPU fallback: 2-3 seconds (usable!)

**Using LM Studio (alternative)**
```

## Integration Code Overview

### LeewayRTCClient (`core/LeewayRTCClient.ts`)
Wraps LeeWay-Edge-RTC functionality:

```typescript
// Connect to RTC
const rtcClient = LeewayRTCClient.getInstance();
await rtcClient.connect((state) => {
  console.log('RTC state:', state);
});

// Start listening to user
await rtcClient.startListening();

// Stop and disconnect
rtcClient.disconnect();
```

### LeewayAgentService (`components/AgentleeMic.tsx`)
Orchestrates Agent Lee responses using local inference:

```typescript
// Create service
const agent = new LeewayAgentService((state) => {
  console.log('Agent state:', state);
});

// Start session
await agent.start();

// Execute background commands
const taskId = await agent.sendBackgroundCommand(
  'Set reminder for 3pm',
  'high'
);
```

## Response Generation Flow

### 1. User Speech Input
```
User speaks → Web Speech API (STT) → transcript
```

### 2. Local Processing (Fast Path)
```
Transcript → Agent Lee Persona Rules 
         → Simple Rule-Based Response
         → TTS Output (instant)
```

Example persona rules (`LeeWay-Edge-RTC/src/voice/persona.ts`):
```typescript
// Detect intent from user input
const response = respondToInput(transcript, conversationHistory, mode, rtcContext);
// Returns immediate response based on RTC state, conversation context, etc.
```

### 3. Complex Request (Fast Local Path - Phi 2.5)
```
Transcript → (Persona rules don't match)
         → Local Phi Model Inference (200-300ms)
         → Generate detailed response
         → TTS Output
```

**Why Phi 2.5?**
- SOTA reasoning for 2.7B parameters
- 3x faster than Qwen 7B
- 70% less memory (5-6GB vs 14-16GB)
- CPU fallback viable (2-3s vs 8-12s)

### 4. Heavy Lifting (leeway Fallback Only)
```
Transcript → (Phi unavailable/offline)
         → leeway API Call (FALLBACK)
         → Response
         → TTS Output
```

## Implementing Phi.2 Integration

### The Model Switch
We've replaced Qwen 7B with **Phi 2.5** as the primary local inference model:

**Parameters Updated:**
- `core/QwenBridge.ts`: `model: 'phi'` (changed from `'qwen:7b'`)
- `core/AgentLeeResponseRouter.ts`: `metadata.model: 'phi:2.5'` (updated for logging)

### Option 1: Direct REST API Call
Update `LeewayRTCClient.generateResponse()`:

```typescript
private async generateResponse(input: string): Promise<string> {
  // Try local Phi first
  try {
    const ollamaUrl = import.meta.env.VITE_QWEN_API_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi',  // or 'qwen:1.5b' for consistency
        messages: [
          { role: 'system', content: 'You are Agent Lee, a helpful assistant.' },
          { role: 'user', content: input }
        ],
        stream: false,
        temperature: 0.7,
      })
    });

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    // Fall back to leeway or persona rules
    return await this.fallbackResponse(input);
  }
}
```

### Option 2: Via Firebase Cloud Functions
Use Firebase as a bridge to local Qwen:

```typescript
// From LeewayRTCClient
const response = await firebase.callFunction('qwenInference', {
  input,
  model: 'qwen:7b',
  maxTokens: 256
});
```

### Option 3: WebWorker for Inference
For ONNX Runtime Qwen (in-browser):

```typescript
// Use transformers.js for local Qwen
import { pipeline } from '@xenova/transformers';

const generateResponse = async (input: string) => {
  const generator = await pipeline(
    'text-generation',
    'Xenova/Qwen1.5-0.5B'
  );
  const result = await generator(input, { max_new_tokens: 128 });
  return result[0].generated_text;
};
```

## leeway Fallback Implementation

Only invoke leeway when Qwen is unavailable:

```typescript
// In LeewayRTCClient.generateResponse()
private async generateResponse(input: string): Promise<string> {
  // 1. Try local persona rules first (instant)
  const personaResponse = await this.tryPersonaRules(input);
  if (personaResponse) return personaResponse;

  // 2. Try local Qwen (if available)
  if (this.isQwenAvailable()) {
    try {
      return await this.invokeQwen(input);
    } catch (err) {
      console.warn('Qwen failed, falling back to leeway:', err);
    }
  }

  // 3. FALLBACK: Use leeway only as last resort
  try {
    return await this.invokeleewayFallback(input);
  } catch (err) {
    console.error('All inference methods failed:', err);
    return "I'm having trouble processing that. Try again?";
  }
}

private async invokeleewayFallback(input: string): Promise<string> {
  const apiKey = import.meta.env.VITE_leeway_API_KEY;
  if (!apiKey) {
    throw new Error('leeway fallback not configured');
  }

  // Use lightweight leeway client (not Live API)
  // to avoid heavy dependencies
  const response = await fetch(
    'https://generativelanguage.leewayapis.com/v1beta/models/leeway-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

## Firebase AI Integration

Enhance Agent Lee with Firebase:

```typescript
// Enable Firebase AI for:
// 1. Conversation memory
// 2. Learned patterns
// 3. Capability expansion

const firebase = FirebaseService.getInstance();

// Log interaction
await firebase.logMemoryEntry(userId, {
  agentId: 'AgentLee',
  action: 'Voice Interaction',
  details: {
    input: userTranscript,
    response: agentResponse,
    model: 'qwen-7b', // Track which model generated response
    latency: responseTime,
  },
  impact: 'medium',
});

// Query learned patterns
const patterns = await firebase.queryMemory(userId, {
  agentId: 'AgentLee',
  limit: 10,
  orderBy: 'timestamp',
});
```

## Event Flow

```
User clicks mic
    ↓
[RTC State: CONNECTING]
    ↓
LeewayRTCClient.connect()
    ↓
[RTC State: CONNECTED]
    ↓
startListening() → STT active
    ↓
[RTC State: LISTENING]
    ↓
User speaks...
    ↓
STT final transcript received
    ↓
[RTC State: THINKING]
    ↓
handleUserSpeech()
    → tryPersonaRules() → instant response
    OR
    → invokeQwen() → local inference
    OR
    → invokeleewayFallback() → cloud API
    ↓
[RTC State: SPEAKING]
    ↓
speak() → Browser TTS
    ↓
[RTC State: LISTENING] → Loop continues
```

## Testing Checklist

- [ ] **Persona Rules**: "Hello Agent Lee" → instant response
- [ ] **Qwen Offline**: Response still works (uses rules/leeway)
- [ ] **RTC Disconnection**: Automatic reconnect after 30s
- [ ] **Mic Permissions**: Granted → "Agent Lee online"
- [ ] **Mic Denied**: Error state → red border
- [ ] **firebase**: Interactions logged to memory
- [ ] **Performance**: Response time < 2s (persona) or < 5s (Qwen)

## Debugging

### Check RTC Connection
```typescript
const client = LeewayRTCClient.getInstance();
console.log('RTC State:', client.getState());
console.log('Peers:', client.getPeers());
```

### Monitor Events
```typescript
eventBus.on('leeway-rtc:state-change', (data) => {
  console.log('[RTC]', data.state);
});

eventBus.on('leeway-rtc:user-said', (data) => {
  console.log('[User]', data.text);
});

eventBus.on('leeway-rtc:peer-said', (data) => {
  console.log('[Peer]', data.text);
});
```

### Logs
```
[LeewayRTCClient] WebSocket connected to ws://localhost:3000/ws
[LeewayRTCClient] Connected and ready
[LeewayAgentService] Connected to LeeWay-RTC and listening
[User Speech] "What's my connection quality?"
[Agent Lee] "Connection quality is 92%. Direct peer-to-peer, no TURN relay needed."
```

## Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| STT → Response | < 500ms | Persona rules |
| STT → Response | < 2s | Local Qwen |
| STT → Response | < 5s | leeway fallback |
| TTS latency | < 500ms | Browser native |
| RTC reconnect | < 5s | Auto-retry |
| Peer discovery | < 1s | SFU signaling |

## Troubleshooting

### "Microphone access denied"
- [ ] Check browser permissions for the domain
- [ ] Try in incognito/private mode
- [ ] Restart browser and app

### "Can't connect to RTC"
- [ ] Verify LeeWay-Edge-RTC is running: `http://localhost:3000`
- [ ] Check WebSocket URL in `.env.local`
- [ ] Look for browser console errors (F12 → Console)

### "No response from Agent Lee"
- [ ] Check if microphone input is working
- [ ] Verify Qwen is online (if using local)
- [ ] Check leeway API key is set (for fallback)
- [ ] Look at Firefox/Chrome DevTools → Network tab

### "RTC keeps disconnecting"
- [ ] Ensure SFU is running stably
- [ ] Check network connectivity
- [ ] Monitor CPU/memory load on SFU machine
- [ ] Look for 'leeway-rtc:reconnect-failed' events

## Next Steps

1. **Start LeeWay-Edge-RTC**: `npm run dev` in LeeWay-Edge-RTC-main
2. **Install Qwen**: `ollama pull qwen:7b` (optional for local inference)
3. **Configure `.env.local`**: Add `VITE_VOICE_WS_URL` and `VITE_QWEN_API_URL`
4. **Start Agent Lee Agentic Operating System**: `npm run dev` in agent-lee-voxel-os
5. **Test**: Click the 3D mic in footer and speak

The system will automatically:
- Use persona rules for known intents (instant)
- Use Qwen for complex requests (if available)
- Fall back to leeway only if needed
- Log all interactions to Firebase for learning

Enjoy Agent Lee on LeeWay-Edge-RTC! 🚀

