import { Router } from "express";
import { debugStore } from "../utils/debugStore.js";

export const debugRouter = Router();

debugRouter.get("/", (req, res) => {
  const data = debugStore.getDebugSnapshot();
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Agent Lee - Mobile Status</title>
        <meta http-equiv="refresh" content="2">
        <style>
          body { font-family: system-ui; background: #1e1e1e; color: #fff; padding: 20px; }
          .panel { background: #2d2d2d; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
          pre { background: #000; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 13px; }
          h2 { margin-top: 0; color: #4CAF50; font-size: 16px; border-bottom: 1px solid #444; padding-bottom: 8px;}
        </style>
      </head>
      <body>
        <h1>Agent Lee Live Status</h1>
        <div class="panel">
          <h2>Last Safety Policy Result</h2>
          <pre>${JSON.stringify(data.lastSafetyPolicyResult, null, 2) || "None"}</pre>
        </div>
        <div class="panel">
          <h2>Last Decision</h2>
          <pre>${JSON.stringify(data.lastDecision, null, 2) || "None"}</pre>
        </div>
        <div class="panel">
          <h2>Last Task Plan</h2>
          <pre>${JSON.stringify(data.lastTaskPlan, null, 2) || "None"}</pre>
        </div>
        <div class="panel">
          <h2>Last Mobile Context</h2>
          <pre>${JSON.stringify(data.lastMobileContext, null, 2) || "None"}</pre>
        </div>
        <div class="panel">
          <h2>Last MCP Invocation</h2>
          <pre>${JSON.stringify(data.lastMcpInvocation, null, 2) || "None"}</pre>
        </div>
      </body>
    </html>
  `);
});

debugRouter.get("/data", (req, res) => {
  res.json(debugStore.getDebugSnapshot());
});
