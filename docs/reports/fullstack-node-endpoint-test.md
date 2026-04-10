# Full-Stack Node and Endpoint Test Report

Generated: 2026-04-01T21:55:18.494Z

- Passed: 6
- Failed: 0
- Warnings: 1
- Live Mode: enabled

## [PASS] Surface graph is aligned across awareness, layout, and app routing

```json
{
  "surfaces": [
    "home",
    "diagnostics",
    "settings",
    "deployment",
    "memory",
    "code",
    "database",
    "creators"
  ]
}
```

## [PASS] Every page emits diagnostics reports

```json
[
  {
    "file": "pages/CodeStudio.tsx",
    "emitsDiagnostics": true
  },
  {
    "file": "pages/CreatorsStudio.tsx",
    "emitsDiagnostics": true
  },
  {
    "file": "pages/DatabaseHub.tsx",
    "emitsDiagnostics": true
  },
  {
    "file": "pages/Deployment.tsx",
    "emitsDiagnostics": true
  },
  {
    "file": "pages/Diagnostics.tsx",
    "emitsDiagnostics": true
  },
  {
    "file": "pages/Home.tsx",
    "emitsDiagnostics": true
  },
  {
    "file": "pages/Settings.tsx",
    "emitsDiagnostics": true
  }
]
```

## [PASS] All emitted EventBus events have listeners

```json
{
  "emitted": [
    "agent:active",
    "agent:done",
    "agent:error",
    "dream:end",
    "dream:start",
    "emotion:detected",
    "heal:complete",
    "heal:start",
    "memory:saved",
    "vm:open",
    "vm:output",
    "vm:result"
  ]
}
```

## [PASS] All MCP agent nodes expose required endpoint/tool contracts

```json
[
  {
    "agent": "MCP agents/agent-registry-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      4100,
      4103,
      3002
    ]
  },
  {
    "agent": "MCP agents/desktop-commander-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      4011
    ]
  },
  {
    "agent": "MCP agents/docs-rag-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      4102
    ]
  },
  {
    "agent": "MCP agents/health-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3001
    ]
  },
  {
    "agent": "MCP agents/insforge-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3015
    ]
  },
  {
    "agent": "MCP agents/memory-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3003
    ]
  },
  {
    "agent": "MCP agents/planner-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      4106,
      41016,
      3004
    ]
  },
  {
    "agent": "MCP agents/playwright-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3008
    ]
  },
  {
    "agent": "MCP agents/scheduling-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3005
    ]
  },
  {
    "agent": "MCP agents/spline-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3014
    ]
  },
  {
    "agent": "MCP agents/stitch-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": []
  },
  {
    "agent": "MCP agents/testsprite-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": []
  },
  {
    "agent": "MCP agents/validation-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3006
    ]
  },
  {
    "agent": "MCP agents/vision-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3009
    ]
  },
  {
    "agent": "MCP agents/voice-agent-mcp",
    "ok": true,
    "hasRoot": true,
    "hasSse": true,
    "hasMessage": true,
    "hasListTool": true,
    "hasCallTool": true,
    "portCandidates": [
      3010
    ]
  }
]
```

## [WARN] Some MCP endpoints are not currently reachable in live mode

```json
{
  "unreachable": [
    {
      "agent": "MCP agents/agent-registry-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 4100,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 134,
            "url": "http://127.0.0.1:4100/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 7,
            "url": "http://127.0.0.1:4100/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 9,
            "url": "http://127.0.0.1:4100/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 4103,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 6,
            "url": "http://127.0.0.1:4103/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:4103/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:4103/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 3002,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 6,
            "url": "http://127.0.0.1:3002/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3002/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:3002/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/desktop-commander-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 4011,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:4011/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 7,
            "url": "http://127.0.0.1:4011/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:4011/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/insforge-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3015,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3015/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3015/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3015/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/memory-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3003,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:3003/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3003/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3003/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/planner-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 4106,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:4106/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:4106/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 7,
            "url": "http://127.0.0.1:4106/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 41016,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 8,
            "url": "http://127.0.0.1:41016/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:41016/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:41016/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 3004,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3004/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3004/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3004/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/playwright-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3008,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 1,
            "url": "http://127.0.0.1:3008/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3008/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3008/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/scheduling-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3005,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3005/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3005/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3005/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/spline-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3014,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3014/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3014/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3014/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/stitch-agent-mcp",
      "reachable": false,
      "reason": "no-port-candidate"
    },
    {
      "agent": "MCP agents/testsprite-agent-mcp",
      "reachable": false,
      "reason": "no-port-candidate"
    },
    {
      "agent": "MCP agents/validation-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3006,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3006/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3006/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3006/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/vision-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3009,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3009/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3009/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3009/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/voice-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3010,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3010/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:3010/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3010/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    }
  ],
  "liveChecks": [
    {
      "agent": "MCP agents/agent-registry-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 4100,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 134,
            "url": "http://127.0.0.1:4100/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 7,
            "url": "http://127.0.0.1:4100/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 9,
            "url": "http://127.0.0.1:4100/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 4103,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 6,
            "url": "http://127.0.0.1:4103/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:4103/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:4103/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 3002,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 6,
            "url": "http://127.0.0.1:3002/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3002/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:3002/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/desktop-commander-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 4011,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:4011/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 7,
            "url": "http://127.0.0.1:4011/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:4011/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/docs-rag-agent-mcp",
      "reachable": true,
      "attempts": [
        {
          "port": 4102,
          "rootProbe": {
            "ok": true,
            "status": 200,
            "latencyMs": 83,
            "url": "http://127.0.0.1:4102/",
            "method": "GET"
          },
          "sseProbe": {
            "ok": true,
            "status": 200,
            "latencyMs": 10,
            "url": "http://127.0.0.1:4102/sse",
            "method": "GET"
          },
          "messageProbe": {
            "ok": false,
            "status": 400,
            "latencyMs": 23,
            "url": "http://127.0.0.1:4102/message",
            "method": "POST"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/health-agent-mcp",
      "reachable": true,
      "attempts": [
        {
          "port": 3001,
          "rootProbe": {
            "ok": true,
            "status": 200,
            "latencyMs": 40,
            "url": "http://127.0.0.1:3001/",
            "method": "GET"
          },
          "sseProbe": {
            "ok": true,
            "status": 200,
            "latencyMs": 8,
            "url": "http://127.0.0.1:3001/sse",
            "method": "GET"
          },
          "messageProbe": {
            "ok": false,
            "status": 400,
            "latencyMs": 12,
            "url": "http://127.0.0.1:3001/message",
            "method": "POST"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/insforge-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3015,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3015/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3015/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3015/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/memory-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3003,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:3003/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3003/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3003/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/planner-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 4106,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:4106/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:4106/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 7,
            "url": "http://127.0.0.1:4106/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 41016,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 8,
            "url": "http://127.0.0.1:41016/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:41016/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:41016/message",
            "method": "POST",
            "error": "fetch failed"
          }
        },
        {
          "port": 3004,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3004/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3004/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3004/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/playwright-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3008,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 1,
            "url": "http://127.0.0.1:3008/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3008/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3008/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/scheduling-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3005,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3005/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3005/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3005/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/spline-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3014,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3014/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3014/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3014/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/stitch-agent-mcp",
      "reachable": false,
      "reason": "no-port-candidate"
    },
    {
      "agent": "MCP agents/testsprite-agent-mcp",
      "reachable": false,
      "reason": "no-port-candidate"
    },
    {
      "agent": "MCP agents/validation-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3006,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3006/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 4,
            "url": "http://127.0.0.1:3006/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3006/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/vision-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3009,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 3,
            "url": "http://127.0.0.1:3009/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3009/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3009/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    },
    {
      "agent": "MCP agents/voice-agent-mcp",
      "reachable": false,
      "attempts": [
        {
          "port": 3010,
          "rootProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3010/",
            "method": "GET",
            "error": "fetch failed"
          },
          "sseProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 5,
            "url": "http://127.0.0.1:3010/sse",
            "method": "GET",
            "error": "fetch failed"
          },
          "messageProbe": {
            "ok": false,
            "status": null,
            "latencyMs": 2,
            "url": "http://127.0.0.1:3010/message",
            "method": "POST",
            "error": "fetch failed"
          }
        }
      ]
    }
  ]
}
```

## [PASS] Firebase function endpoints are defined and exported

```json
{
  "hasProxy": true,
  "hasStream": true,
  "exportsFromIndex": true
}
```

## [PASS] No paid-tier leeway model IDs found in runtime code scan

```json
{}
```

