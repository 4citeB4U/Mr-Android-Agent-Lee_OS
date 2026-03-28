import express from "express";

const app = express();
app.use(express.json());

const PORT = 8003;

app.post("/mcp/:agent", (req, res) => {
  const { agent } = req.params;
  const { intent, prompt } = req.body;
  const handshake = req.headers["x-neural-handshake"];

  console.log(`[MOCK-REMOTE] Received request for agent: ${agent}`);
  console.log(`[MOCK-REMOTE] Intent: ${intent}, Prompt: ${prompt}`);
  console.log(`[MOCK-REMOTE] Handshake: ${handshake ? "PRESENT" : "MISSING"}`);

  res.json({
    success: true,
    message: `Hello from Hybrid Cloud! Processed ${agent} remotely.`,
    receivedIntent: intent,
    handshakePresent: !!handshake
  });
});

app.listen(PORT, () => {
  console.log(`[MOCK-REMOTE] Hybrid Cloud Mock Server running on port ${PORT}`);
});
