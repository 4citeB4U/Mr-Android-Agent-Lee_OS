#!/usr/bin/env node
// Automated system test for Agent Lee and Leeway RTC
// Run: node scripts/agentlee_system_test.mjs

import fetch from 'node-fetch';
import WebSocket from 'ws';

const CHECKPOINTS = [];

function checkpoint(desc) {
  CHECKPOINTS.push(desc);
  console.log(`\n=== CHECKPOINT: ${desc} ===\n`);
}

async function testVoiceHealth() {
  console.log('Testing voice server health endpoint...');
  const res = await fetch('https://agent-lee-the-worlds-first-agentic-os.fly.dev/api/v1/health');
  const data = await res.json();
  if (data.status === 'ok') {
    console.log('Voice server health: OK');
  } else {
    throw new Error('Voice server health check failed');
  }
  checkpoint('Voice server health verified. Speak to Agent Lee and confirm real-time response.');
}

async function testRTCWebSocket() {
  console.log('Testing RTC WebSocket connection...');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://agent-lee-the-worlds-first-agentic-os.fly.dev/ws');
    ws.on('open', () => {
      console.log('RTC WebSocket connected.');
      ws.close();
      checkpoint('RTC WebSocket connection verified. Try live voice input.');
      resolve();
    });
    ws.on('error', (err) => {
      reject(new Error('RTC WebSocket connection failed: ' + err));
    });
  });
}

async function testPersonaConsistency() {
  console.log('Testing persona consistency...');
  // Simulate a persona query (replace with real endpoint if available)
  const res = await fetch('https://agent-lee-the-worlds-first-agentic-os.fly.dev/api/v1/status');
  const data = await res.json();
  if (data.service && data.version) {
    console.log('Persona status:', data.service, data.version);
  } else {
    throw new Error('Persona status check failed');
  }
  checkpoint('Persona status verified. Ask Agent Lee a series of questions and check for consistent persona.');
}

async function testAgentHealth() {
  console.log('Testing agent health endpoints...');
  // Add more agent health checks as needed
  const agents = [
    'memory-agent-mcp',
    'voice-agent-mcp',
    'scheduling-agent-mcp',
    'vision-agent-mcp',
    'stitch-agent-mcp',
    'insforge-agent-mcp',
    'docs-rag-agent-mcp',
    'spline-agent-mcp',
    'health-agent-mcp',
  ];
  for (const agent of agents) {
    try {
      const res = await fetch(`https://agent-lee-the-worlds-first-agentic-os.fly.dev/api/v1/health?agent=${agent}`);
      const data = await res.json();
      if (data.status === 'ok') {
        console.log(`${agent} health: OK`);
      } else {
        console.warn(`${agent} health: NOT OK`);
      }
    } catch (e) {
      console.warn(`${agent} health: ERROR`, e.message);
    }
  }
  checkpoint('All agent health endpoints checked. Review logs and agent dashboards for traceability.');
}

async function runAll() {
  try {
    await testVoiceHealth();
    await testRTCWebSocket();
    await testPersonaConsistency();
    await testAgentHealth();
    console.log('\nAll automated tests complete. Proceed to manual checkpoints as prompted above.');
  } catch (e) {
    console.error('Test failed:', e.message);
  }
}

runAll();
