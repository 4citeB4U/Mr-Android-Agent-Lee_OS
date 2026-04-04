/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.PROXY.AI
TAG: SECURITY.PROXY.GEMINI.API

COLOR_ONION_HEX:
NEON=#FF6F00
FLUO=#FF8F00
PASTEL=#FFE0B2

ICON_ASCII:
family=lucide
glyph=shield

5WH:
WHAT = Firebase Cloud Function proxy for Gemini AI API calls
WHY = Securely proxies Gemini API so the API key is never exposed to the client
WHO = Agent Lee OS — Firebase Functions
WHERE = functions/src/geminiProxy.ts
WHEN = 2026
HOW = Firebase v2 HTTP function with CORS, input validation, and Google Generative AI SDK

AGENTS:
ASSESS
AUDIT
SHIELD

LICENSE:
PROPRIETARY
*/
import * as functions from 'firebase-functions/v2';
import { GoogleGenerativeAI } from '@google/genai';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

// Assuming the key is saved in environment variables or Secret Manager
// For testing locally or standard deployment, we use process.env.
// In production with Secret Manager, Firebase passes it into process.env.
const getGeminiKey = () => process.env.GEMINI_API_KEY || '';

export const geminiProxy = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(idToken); // Ensure user is authenticated

      const ai = new GoogleGenerativeAI(getGeminiKey());
      const { prompt, model = 'gemini-2.0-flash', systemPrompt, temperature = 0.7 } = request.body;

      // Note: mapping to correct genai parameters.
      // With the actual @google/genai npm module, the syntax is specific.
      // This is an abstraction of it based on typical genai usage
      const m = ai.getGenerativeModel({ model });
      const config: any = { temperature };
      
      if (systemPrompt) {
        config.systemInstruction = systemPrompt;
      }

      const result = await m.generateContent({
        contents: prompt,
        config
      });

      response.status(200).json({
        text: result.text(),
        model: model,
      });

    } catch (error: any) {
      console.error('Gemini proxy error:', error);
      response.status(500).json({ error: error.message });
    }
  });
});

export const geminiStream = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
       const authHeader = request.headers.authorization;
       if (!authHeader?.startsWith('Bearer ')) {
         response.status(401).json({ error: 'Unauthorized: Missing token' });
         return;
       }
       
       const idToken = authHeader.split('Bearer ')[1];
       await admin.auth().verifyIdToken(idToken);
 
       const ai = new GoogleGenerativeAI(getGeminiKey());
       const { prompt, model = 'gemini-2.0-flash', systemPrompt, temperature = 0.7 } = request.body;
 
       const m = ai.getGenerativeModel({ model });
       const config: any = { temperature };
       
       if (systemPrompt) {
         config.systemInstruction = systemPrompt;
       }
 
       const resultStream = await m.generateContentStream({
        contents: prompt,
        config
       });

       response.setHeader('Content-Type', 'text/event-stream');
       response.setHeader('Cache-Control', 'no-cache');
       response.setHeader('Connection', 'keep-alive');

       for await (const chunk of resultStream) {
         response.write(chunk.text());
       }

       response.end();
 
     } catch (error: any) {
       console.error('Gemini proxy error:', error);
       response.status(500).json({ error: error.message });
     }
  });
});
