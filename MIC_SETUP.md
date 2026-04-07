## Agent Lee Microphone Setup Guide

The 3D voxel microphone in the footer requires the Gemini Live API to function.

### Quick Start - Get the Mic Working

1. **Get Your Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikeys
   - Click "Create API Key"
   - Copy your API key

2. **Update `.env.local`**
   - Open `.env.local` in the project root
   - Replace `your-gemini-api-key-here` with your actual API key:
   ```
   VITE_GEMINI_API_KEY=your-actual-api-key
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

4. **Test the Mic**
   - Click the glowing 3D mic in the bottom center of the screen
   - You should see the status change to "LISTENING"
   - Speak into your microphone
   - Agent Lee should respond

### Troubleshooting

**Error: "VITE_GEMINI_API_KEY not found"**
- Check `.env.local` exists in project root
- Verify the API key value is set (not empty)
- Restart the dev server after editing `.env.local`
- Check browser console (F12) for detailed error messages

**Mic shows ERROR state**
- Press F12 to open browser DevTools
- Check the Console tab for error messages
- Common issues:
  - Missing or invalid API key → Add valid key to `.env.local`
  - Browser permissions → Grant microphone access when prompted
  - Network issue → Check your internet connection

**No response from Agent Lee**
- Verify microphone input is working (check system audio settings)
- Check browser DevTools Console for connection errors
- Ensure Gemini API is accessible (check https status)
- Try refreshing the page

### Architecture

The microphone system integrates:
- **Frontend**: Three.js 3D voxel rendering + WebAudio API
- **Backend**: Gemini 3.1 Flash Live API for real-time bidirectional audio
- **State Management**: EventBus for pub/sub events
- **Persistence**: Firebase for session logging

All audio processing happens locally in the browser - no sensitive data sent to backend except through official Gemini API.
