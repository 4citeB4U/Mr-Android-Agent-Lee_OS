/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.DIAGNOSTICS
TAG: UI.PAGE.DIAGNOSTICS.BRAIN.TELEMETRY

COLOR_ONION_HEX:
NEON=#00F2FF
FLUO=#1BF7CD
PASTEL=#A5F3FC

ICON_ASCII:
family=lucide
glyph=brain

5WH:
WHAT = Diagnostics page — 3D brain visualization, memory lake telemetry, agent center, database dashboard
WHY = Provides system-wide health monitoring and interactive 3D view of Agent Lee's cognitive network
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Diagnostics.tsx
WHEN = 2026
HOW = Three.js brain renderer + OrbitControls, Recharts telemetry, p5.js particles, agent carousel and DB health panel

AGENTS:
ASSESS
AUDIT
GEMINI
SHIELD
MARSHAL
CLERK
JANITOR
LIBRARIAN
LEEWAY_STANDARDS

LICENSE:
MIT
*/

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Brain, Stethoscope, Database, RefreshCw, ShieldCheck, Recycle, Eye, Cog, History, Activity, 
  Network, UserCog, ListTodo, X, LineChart, Terminal, Cpu, HardDrive, Zap, ChevronDown, 
  ChevronUp, Maximize2, Bot, Globe, Microchip, Info, ChartLine, HeartPulse, User, 
  CheckCircle2, Circle, Plus, Trash2, AlertCircle, LayoutGrid, ChevronLeft, ChevronRight, 
  Minus, Expand, Gauge, FileText, Server, Link, GitBranch, Monitor, Bug, Box, Palette, 
  Clock, Settings, Layers, Folder
} from 'lucide-react';
import { 
  LineChart as ReLineChart, Line as ReLine, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar as ReBar, Cell, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie 
} from 'recharts';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Chart, registerables } from 'chart.js';
import p5 from 'p5';
import { pushDiagnosticsReport, readDiagnosticsReports } from '../core/diagnostics_bridge';
import { WORLD_REGISTRY } from '../core/WorldRegistry';
import type { AgentFamily } from '../core/AgentWorldTypes';
import { eventBus } from '../core/EventBus';
import { MarshalVerify } from '../agents/MarshalVerify';
import type { GovernanceVerdict, ScenarioResult } from '../core/VerificationCorps';

Chart.register(...registerables);

// ...Rest of your code/components here...

// --- BRAIN VISUALIZATION ---
interface Region {
  name: string;
  label: string;
  position: { x: number; y: number; z: number };
  color: number;
  id: string;
}

interface RegionIntel {
  title: string;
  layer: string;
  category: 'core' | 'memory' | 'model' | 'workflow' | 'agent' | 'mcp';
  summary: string;
  workflows: string[];
  monitors: string[];
  agents: string[];
  mcps: string[];
  route: string;
  status: 'stable' | 'watch';
}

const regionConfig: Region[] = [
  { name: 'AgentDB', label: 'AGENT DB (MEMORY LAKE)', position: { x: 0, y: 0, z: 0 }, color: 0x00ff88, id: 'agent-db' },
  { name: 'GLM47Flash', label: 'GLM-4.7-FLASH', position: { x: 3.5, y: 1.5, z: 1.2 }, color: 0x00f2ff, id: 'glm-4-7-flash' },
  { name: 'GLM46VFlash', label: 'GLM-4.6V-FLASH', position: { x: -3.5, y: 1.5, z: 1.2 }, color: 0x9854ff, id: 'glm-4-6v-flash' },
  { name: 'NotebookLM', label: 'NOTEBOOK LM', position: { x: 0, y: 2.0, z: 3.5 }, color: 0x1bf7cd, id: 'notebook-lm' },
  { name: 'Llama3Local', label: 'LLAMA 3 (LOCAL)', position: { x: 0, y: -2.0, z: 3.5 }, color: 0xf7d31b, id: 'llama-3-local' },
  { name: 'QwenLocal', label: 'QWEN 2.5 (LOCAL)', position: { x: 0, y: 0, z: -4.5 }, color: 0xff2a6d, id: 'qwen-local' },
  { name: 'AgentOrchestration', label: 'CONSCIOUSNESS ENGINE', position: { x: -3.5, y: -1.5, z: 1.2 }, color: 0xff2a6d, id: 'agents' },
  { name: 'DataCore', label: 'EPISODIC MEMORY', position: { x: 3.5, y: -1.5, z: 1.2 }, color: 0x6C47FF, id: 'datacore' },
  { name: 'OperationsToDoNexus', label: 'INTENT CLASSIFIER', position: { x: 0, y: 3.5, z: 0 }, color: 0x00f2ff, id: 'todo' },
  { name: 'DashboardMCP', label: 'DASHBOARD MCP', position: { x: 2.0, y: 3.0, z: -2.0 }, color: 0x1bf7cd, id: 'workers-dashboard' },
  { name: 'BrowserMCP', label: 'BROWSER MCP', position: { x: -2.0, y: 3.0, z: -2.0 }, color: 0x00f2ff, id: 'workers-browser' },
  { name: 'BridgeMCP', label: 'BRIDGE MCP', position: { x: 2.0, y: -3.0, z: -2.0 }, color: 0x9854ff, id: 'workers-bridge' },
  { name: 'CreatorsMCP', label: 'CREATORS STUDIO', position: { x: -2.0, y: -3.0, z: -2.0 }, color: 0xff4499, id: 'workers-creators' },
  { name: 'PermissionsMCP', label: 'SYS PERMISSIONS', position: { x: 0, y: 4.5, z: 2.0 }, color: 0x00e3ff, id: 'workers-permissions' }
];

const regionIntel: Record<string, RegionIntel> = {
  'agent-db': {
    title: 'Memory Lake Core',
    layer: 'Persistent Memory',
    category: 'memory',
    summary: 'Central persistence plane for episodic memory, file lineage, cold storage, and retrieval telemetry.',
    workflows: ['Capture', 'Recall', 'Cold archive', 'Integrity review'],
    monitors: ['Latency', 'Throughput', 'Integrity', 'Connection count'],
    agents: ['Agent Lee', 'Sage', 'Echo', 'Clerk Archive', 'Janitor Sentinel'],
    mcps: ['memory-agent-mcp', 'health-agent-mcp'],
    route: 'Memory Lake -> Drives -> Slots -> Cells',
    status: 'stable'
  },
  'glm-4-7-flash': {
    title: 'Primary Reasoning Model',
    layer: 'Inference Tier',
    category: 'model',
    summary: 'Fast external inference lane used for core reasoning, orchestration boosts, and rapid response shaping.',
    workflows: ['Prompt routing', 'Response drafting', 'Tool decision'],
    monitors: ['Token burn', 'Latency', 'Fallback frequency'],
    agents: ['Agent Lee', 'Atlas'],
    mcps: ['planner-agent-mcp'],
    route: 'Chat -> Router -> Model -> Agent team',
    status: 'stable'
  },
  'glm-4-6v-flash': {
    title: 'Vision Reasoning Model',
    layer: 'Inference Tier',
    category: 'model',
    summary: 'Visual interpretation lane for diagrams, screenshots, and multimodal understanding.',
    workflows: ['Vision intake', 'Diagram analysis', 'Asset review'],
    monitors: ['Image queue', 'Vision latency', 'Multimodal confidence'],
    agents: ['Pixel', 'Aria'],
    mcps: ['vision-agent-mcp'],
    route: 'Visual input -> Vision model -> Surface output',
    status: 'stable'
  },
  'notebook-lm': {
    title: 'Research Synthesis Node',
    layer: 'Knowledge Layer',
    category: 'workflow',
    summary: 'Long-form note synthesis and canon shaping lane used for briefings, lore, and document intelligence.',
    workflows: ['Research synthesis', 'Bible updates', 'Document grounding'],
    monitors: ['Context size', 'Source freshness', 'Synthesis drift'],
    agents: ['Sage'],
    mcps: ['docs-rag-agent-mcp'],
    route: 'Source docs -> Synthesis -> Memory Lake',
    status: 'stable'
  },
  'llama-3-local': {
    title: 'Local Recovery Model',
    layer: 'Local Inference',
    category: 'model',
    summary: 'Local fallback and private execution lane for resilient generation without network dependence.',
    workflows: ['Offline generation', 'Fallback inference', 'Private compute'],
    monitors: ['GPU load', 'Fallback ratio', 'Context saturation'],
    agents: ['Shield'],
    mcps: ['validation-agent-mcp'],
    route: 'Router -> Local model -> Safe response',
    status: 'watch'
  },
  'qwen-local': {
    title: 'Local Specialization Model',
    layer: 'Local Inference',
    category: 'model',
    summary: 'Secondary local lane used for specialized tasks, testing, and sovereign execution paths.',
    workflows: ['Specialized prompts', 'Safe local compute', 'Bench testing'],
    monitors: ['Load spread', 'Token window', 'Model health'],
    agents: ['Nova'],
    mcps: ['testsprite-agent-mcp'],
    route: 'Task classifier -> Qwen -> Validation',
    status: 'stable'
  },
  'agents': {
    title: 'Consciousness Engine',
    layer: 'Agent Orchestration',
    category: 'agent',
    summary: 'The coordination hub where Agent Lee routes work across the specialist family and operational surfaces.',
    workflows: ['Intent routing', 'Multi-agent orchestration', 'Studio control'],
    monitors: ['Queue depth', 'Role balance', 'Escalation rate'],
    agents: ['Agent Lee', 'Atlas', 'Nova', 'Echo', 'Sage', 'Shield', 'Pixel', 'Nexus', 'Aria',
             'Clerk Archive', 'Janitor Sentinel', 'Librarian Aegis', 'Marshal Verify', 'Leeway Standards Agent'],
    mcps: ['planner-agent-mcp', 'health-agent-mcp'],
    route: 'Intent -> Router -> Specialist handoff',
    status: 'stable'
  },
  'datacore': {
    title: 'Episodic Memory Core',
    layer: 'Memory Layer',
    category: 'memory',
    summary: 'Session and narrative continuity lane that binds memory fragments into usable identity context.',
    workflows: ['Session continuity', 'Reflection', 'Narrative recall'],
    monitors: ['Recall hit rate', 'Fragment churn', 'Continuity score'],
    agents: ['Echo', 'Sage'],
    mcps: ['memory-agent-mcp'],
    route: 'Events -> Episodic memory -> Persona response',
    status: 'stable'
  },
  'todo': {
    title: 'Intent Classifier',
    layer: 'Workflow Surface',
    category: 'workflow',
    summary: 'Task parsing and execution staging surface for turning requests into structured operational flow.',
    workflows: ['Intent parsing', 'Task staging', 'Priority balancing'],
    monitors: ['Queue health', 'Completion rate', 'Priority conflicts'],
    agents: ['Nexus', 'Atlas'],
    mcps: ['planner-agent-mcp', 'scheduling-agent-mcp'],
    route: 'Input -> Classifier -> Todo/agent routing',
    status: 'stable'
  },
  'workers-dashboard': {
    title: 'Dashboard MCP',
    layer: 'MCP Surface',
    category: 'mcp',
    summary: 'Observation lane for health dashboards, executive views, and top-level reporting.',
    workflows: ['Ops dashboard', 'Health reporting', 'Executive readout'],
    monitors: ['Panel freshness', 'Metric drift', 'Alert volume'],
    agents: ['Atlas'],
    mcps: ['health-agent-mcp', 'agent-registry-mcp'],
    route: 'Telemetry -> Dashboard MCP -> Visual surfaces',
    status: 'stable'
  },
  'workers-browser': {
    title: 'Browser MCP',
    layer: 'MCP Surface',
    category: 'mcp',
    summary: 'Web execution lane for browsing, site interaction, and browser-grounded workflows.',
    workflows: ['Web research', 'Browser automation', 'Surface capture'],
    monitors: ['Session count', 'Automation errors', 'Page latency'],
    agents: ['Pixel', 'Aria'],
    mcps: ['playwright-agent-mcp', 'desktop-commander-agent-mcp'],
    route: 'Agent task -> Browser MCP -> Evidence back to memory',
    status: 'stable'
  },
  'workers-bridge': {
    title: 'Bridge MCP',
    layer: 'MCP Surface',
    category: 'mcp',
    summary: 'Interconnect for tools, external systems, and handoffs between internal and external execution domains.',
    workflows: ['Tool bridging', 'Registry sync', 'System handoff'],
    monitors: ['Bridge latency', 'Sync success', 'Contract failures'],
    agents: ['Nexus'],
    mcps: ['agent-registry-mcp', 'stitch-agent-mcp'],
    route: 'Router -> Bridge -> External system',
    status: 'watch'
  },
  'workers-creators': {
    title: 'Creators Studio Surface',
    layer: 'Studio Surface',
    category: 'workflow',
    summary: 'Creative build lane for assets, design surfaces, and creator-facing orchestration.',
    workflows: ['Studio generation', 'Asset builds', 'Creator collaboration'],
    monitors: ['Asset queue', 'Preview latency', 'Render health'],
    agents: ['Pixel', 'Nova'],
    mcps: ['spline-agent-mcp', 'vision-agent-mcp'],
    route: 'Creator prompt -> Studio pipeline -> Assets',
    status: 'stable'
  },
  'workers-permissions': {
    title: 'Permissions Control',
    layer: 'Safety Layer',
    category: 'core',
    summary: 'Governance lane that protects boundaries, tool permissions, and sovereignty rules.',
    workflows: ['Permission review', 'Boundary enforcement', 'Security audit'],
    monitors: ['Violations', 'Escalations', 'Rule exceptions'],
    agents: ['Shield', 'Marshal Verify', 'Leeway Standards Agent', 'Librarian Aegis'],
    mcps: ['validation-agent-mcp', 'health-agent-mcp'],
    route: 'Request -> Policy check -> Permit or block',
    status: 'stable'
  }
};

const regionGroups = [
  { id: 'core', label: 'Core', description: 'Identity, safety, and orchestration spine' },
  { id: 'memory', label: 'Memory', description: 'Persistence, recall, and continuity' },
  { id: 'model', label: 'Models', description: 'External and local inference lanes' },
  { id: 'workflow', label: 'Workflows', description: 'Task surfaces and creator flows' },
  { id: 'mcp', label: 'MCP Grid', description: 'Tool and protocol surfaces' }
] as const;

const colorNumberToHex = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

interface BrainVisualizationProps {
  onRegionClick: (regionId: string) => void;
  autoRotate?: boolean;
  selectedRegionId?: string | null;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
}

function BrainVisualization({ 
  onRegionClick, 
  autoRotate = true, 
  selectedRegionId,
  isLeftSidebarOpen = false,
  isRightSidebarOpen = false
}: BrainVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);
  const onRegionClickRef = useRef(onRegionClick);
  const selectedRegionIdRef = useRef(selectedRegionId);
  const labelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const lineRefs = useRef<{ [key: string]: SVGLineElement | null }>({});

  useEffect(() => { onRegionClickRef.current = onRegionClick; }, [onRegionClick]);
  useEffect(() => { selectedRegionIdRef.current = selectedRegionId; }, [selectedRegionId]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;
    const controls = new OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);
    const cortexGeometry = new THREE.SphereGeometry(3, 32, 32);
    const positions = cortexGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positions, i);
      const noise = (Math.sin(vertex.x * 6) * Math.cos(vertex.y * 6) * Math.sin(vertex.z * 6) * 0.08);
      vertex.multiplyScalar(1 + noise);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    cortexGeometry.computeVertexNormals();
    const cortexMaterial = new THREE.MeshPhongMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.7, shininess: 30 });
    const cortex = new THREE.Mesh(cortexGeometry, cortexMaterial);
    brainGroup.add(cortex);
    const brainRegions: THREE.Mesh[] = [];
    regionConfig.forEach(region => {
      const isAgentDB = region.id === 'agent-db';
      const regionGeometry = new THREE.SphereGeometry(isAgentDB ? 0.8 : 0.5, 16, 16);
      const regionMaterial = new THREE.MeshPhongMaterial({ color: region.color, emissive: region.color, emissiveIntensity: isAgentDB ? 0.8 : 0.4, transparent: true, opacity: 0.9 });
      const regionMesh = new THREE.Mesh(regionGeometry, regionMaterial);
      regionMesh.position.set(region.position.x, region.position.y, region.position.z);
      regionMesh.userData = { id: region.id, label: region.label };
      brainGroup.add(regionMesh);
      brainRegions.push(regionMesh);
    });
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => { pointerDownPos = { x: e.clientX, y: e.clientY }; };
    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.sqrt(Math.pow(e.clientX - pointerDownPos.x, 2) + Math.pow(e.clientY - pointerDownPos.y, 2));
      if (dist < 5 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(brainRegions);
        if (intersects.length > 0) onRegionClickRef.current((intersects[0].object as THREE.Mesh).userData.id);
      }
    };
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      controls.update();
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        regionConfig.forEach(region => {
          const el = labelRefs.current[region.id];
          const line = lineRefs.current[region.id];
          if (!el || !line) return;
          const tempV = new THREE.Vector3(region.position.x, region.position.y, region.position.z);
          const distanceToCamera = tempV.distanceTo(camera.position);
          const cortexDistance = new THREE.Vector3(0,0,0).distanceTo(camera.position);
          tempV.project(camera);
          const isBehind = distanceToCamera > cortexDistance + 0.5;
          const visible = tempV.z <= 1 && tempV.z >= -1 && !isBehind;
          const x = (tempV.x * 0.5 + 0.5) * rect.width;
          const y = (tempV.y * -0.5 + 0.5) * rect.height;
          const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2);
          const labelX = x + Math.cos(angle) * 40;
          const labelY = y + Math.sin(angle) * 40;
          el.style.transform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;
          const sidebarFade = (isLeftSidebarOpen || isRightSidebarOpen) ? 0 : 1;
          el.style.opacity = (visible && sidebarFade === 1) ? (selectedRegionIdRef.current === region.id ? '1' : '1') : '0';
          el.style.pointerEvents = (visible && sidebarFade === 1) ? 'auto' : 'none';
          if (visible && sidebarFade === 1) {
            line.setAttribute('x1', x.toString()); line.setAttribute('y1', y.toString());
            line.setAttribute('x2', labelX.toString()); line.setAttribute('y2', labelY.toString());
            line.style.opacity = '0.4';
          } else { line.style.opacity = '0'; }
        });
      }
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      controls.dispose(); renderer.dispose();
    };
  }, [isLeftSidebarOpen, isRightSidebarOpen]);

  useEffect(() => { if (controlsRef.current) controlsRef.current.autoRotate = autoRotate; }, [autoRotate]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px] md:min-h-[400px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[90]">
        {regionConfig.map((region, idx) => (
          <line key={`line-${region.id}-${idx}`} ref={el => { lineRefs.current[region.id] = el; }} stroke={selectedRegionId === region.id ? '#00f2ff' : colorNumberToHex(region.color)} strokeWidth={selectedRegionId === region.id ? '2' : '1'} style={{ opacity: 0, transition: 'opacity 0.3s' }} />
        ))}
      </svg>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
        {regionConfig.map((region, idx) => (
          <div key={`${region.id}-${idx}`} ref={el => { labelRefs.current[region.id] = el; }}
            className={`animated-border absolute bg-[#0a1525e6] text-[#e0f7fa] px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[7px] md:text-[8px] font-bold border ${selectedRegionId === region.id ? 'border-[#00f2ff] shadow-[0_0_20px_#00f2ff] scale-125 z-[120]' : 'border-[#00b4d84d] shadow-[0_0_10px_#00b4d844]'} transition-all duration-300 pointer-events-auto cursor-pointer hover:bg-[#00b4d844] hover:scale-110 max-w-[60px] md:max-w-[80px] min-w-[35px] md:min-w-[40px] flex items-center justify-center text-center leading-tight whitespace-normal break-words z-[110] opacity-0`}
            style={{ left: 0, top: 0 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRegionClick(region.id); }}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {region.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MEMORY LAKE ---
interface MemoryLakeProps {
  telemetry: any;
}

function MemoryLake({ telemetry }: MemoryLakeProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer'>('overview');
  const [ioData, setIoData] = useState<{ time: number; value: number }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIoData(prev => {
        const newData = [...prev, { time: Date.now(), value: Math.random() * 100 }];
        if (newData.length > 50) return newData.slice(1);
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Disk Latency', value: telemetry.agentDb.latency.toFixed(1), unit: 'ms', icon: <Gauge className="text-[#00f2ff]" size={16} />, color: '#00f2ff' },
    { label: 'File Churn', value: (Math.random() * 50).toFixed(0), unit: 'files/m', icon: <RefreshCw className="text-[#ff2a6d]" size={16} />, color: '#ff2a6d' },
    { label: 'Tool Success', value: '98.5', unit: '%', icon: <CheckCircle2 className="text-[#1bf7cd]" size={16} />, color: '#1bf7cd' },
    { label: 'Context Load', value: '12.4', unit: 'MB', icon: <Layers className="text-[#9854ff]" size={16} />, color: '#9854ff' },
  ];

  const storageData = [
    { name: 'System', value: 400, color: '#00f2ff' },
    { name: 'Apps', value: 300, color: '#9854ff' },
    { name: 'Media', value: 200, color: '#ff2a6d' },
    { name: 'Agent Cache', value: 100, color: '#1bf7cd' },
  ];

  const heatmapData = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    value: Math.random() * 100,
    label: ['Docs', 'Downloads', 'Images', 'System', 'Cache'][i % 5]
  }));

  return (
    <div className="flex flex-col h-full gap-6 p-2 md:p-4 font-['Inter'] overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0a1525] border border-[#00f2ff33] rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden group shadow-[0_0_15px_rgba(0,242,255,0.05)]">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">{stat.icon}</div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{stat.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-[10px] text-gray-500 font-bold">{stat.unit}</span>
            </div>
            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, (parseFloat(stat.value) / 100) * 100)}%`, backgroundColor: stat.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 shrink-0">
        <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-full font-['Orbitron'] text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-[#00f2ff] text-black shadow-[0_0_20px_#00f2ff]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
          <Database size={14} /> The Heart (Memory Lake)
        </button>
        <button onClick={() => setActiveTab('explorer')} className={`px-6 py-2 rounded-full font-['Orbitron'] text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'explorer' ? 'bg-[#ff2a6d] text-black shadow-[0_0_20px_#ff2a6d]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
          <Folder size={14} /> The Hands (File Explorer)
        </button>
      </div>
      {activeTab === 'overview' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto no-scrollbar">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-[#0a1525] rounded-2xl border border-[#00ff8833] p-6 flex flex-col min-h-0 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#00ff88] uppercase tracking-widest flex items-center gap-3"><Activity size={18} /> Real-time Memory Flux</h3>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Throughput</span>
                    <span className="text-xs font-mono text-white">{telemetry.agentDb.throughput.toFixed(0)} MB/s</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-[#00ff8833] flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.agentDb.history}>
                    <defs>
                      <linearGradient id="lakeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/><stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis hide /><YAxis stroke="#555" fontSize={10} />
                    <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="throughput" stroke="#00ff88" fillOpacity={1} fill="url(#lakeGradient)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">Read Rate</div>
                  <div className="text-lg font-black text-[#00f2ff]">{telemetry.agentDb.readRate} MB/s</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">Write Rate</div>
                  <div className="text-lg font-black text-[#ff2a6d]">{telemetry.agentDb.writeRate} MB/s</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">Sync Latency</div>
                  <div className="text-lg font-black text-[#9854ff]">{telemetry.agentDb.latency.toFixed(2)}ms</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#0a1525] rounded-2xl border border-white/10 p-6 flex-1 flex flex-col shadow-2xl min-h-[300px]">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldCheck size={16} className="text-[#1bf7cd]" /> Integrity & Health</h3>
              <div className="flex-1 flex flex-col justify-center items-center gap-8">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * telemetry.agentDb.health) / 100} className="text-[#1bf7cd] transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{telemetry.agentDb.health}%</span>
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Optimal</span>
                  </div>
                </div>
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Uptime</span>
                    <span className="text-xs font-mono text-white">{telemetry.agentDb.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Connections</span>
                    <span className="text-xs font-mono text-white">{telemetry.agentDb.connections} Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto no-scrollbar">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0a1525] rounded-2xl border border-[#00f2ff33] p-6 shadow-2xl">
              <h3 className="text-xs font-bold text-[#00f2ff] uppercase tracking-widest mb-6 flex items-center gap-2"><Cpu size={16} /> System Engine (I/O)</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Vertical Pulse Wave</span>
                    <span className="text-[10px] font-mono text-[#00f2ff]">ACTIVE</span>
                  </div>
                  <div className="h-32 w-full bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={ioData}><ReLine type="step" dataKey="value" stroke="#00f2ff" strokeWidth={1} dot={false} isAnimationActive={false} /></ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-[8px] text-gray-500 uppercase font-bold">Shell Extension Latency</div>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                      <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={314} strokeDashoffset={314 - (314 * 45) / 100} className="text-[#1bf7cd]" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-black text-white">45ms</span><span className="text-[7px] text-[#1bf7cd] uppercase font-bold">Green</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0a1525] rounded-2xl border border-[#ff2a6d33] p-6 shadow-2xl">
              <h3 className="text-xs font-bold text-[#ff2a6d] uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} /> Structural Activity</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-[8px] text-gray-500 uppercase font-bold mb-2">Access Heatmap</div>
                  <div className="grid grid-cols-5 gap-1">
                    {heatmapData.map((item) => (
                      <div key={item.id} className="aspect-square rounded-sm transition-all duration-500 hover:scale-110 cursor-help" style={{ backgroundColor: `rgba(255, 42, 109, ${item.value / 100})`, boxShadow: item.value > 80 ? '0 0 10px rgba(255, 42, 109, 0.5)' : 'none' }} title={`${item.label}: ${item.value.toFixed(0)}% access`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-gray-500 uppercase font-bold mb-2">Storage Sunburst</div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={storageData} innerRadius={30} outerRadius={60} paddingAngle={2} dataKey="value" isAnimationActive={false}>{storageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><ReTooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0a1525] rounded-2xl border border-[#9854ff33] p-6 shadow-2xl">
              <h3 className="text-xs font-bold text-[#9854ff] uppercase tracking-widest mb-6 flex items-center gap-2"><Brain size={16} /> Agentic Intelligence</h3>
              <div className="space-y-6">
                <div className="h-32 w-full bg-black/40 rounded-lg border border-white/5 p-4 flex items-center justify-between relative">
                  <div className="flex flex-col items-center gap-1"><Folder size={16} className="text-gray-500" /><span className="text-[7px] uppercase font-bold text-gray-600">Source</span></div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9854ff] to-transparent relative mx-4">
                    <div className="absolute top-1/2 left-0 w-2 h-2 bg-[#9854ff] rounded-full -translate-y-1/2 animate-ping" />
                  </div>
                  <div className="flex flex-col items-center gap-1"><Database size={16} className="text-[#9854ff]" /><span className="text-[7px] uppercase font-bold text-[#9854ff]">Agent Lee</span></div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#9854ff] via-[#1bf7cd] to-transparent relative mx-4">
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#1bf7cd] rounded-full -translate-y-1/2 animate-ping" />
                  </div>
                  <div className="flex flex-col items-center gap-1"><CheckCircle2 size={16} className="text-[#1bf7cd]" /><span className="text-[7px] uppercase font-bold text-[#1bf7cd]">Dest</span></div>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded-sm transition-all duration-300 ${i % 7 === 0 ? 'bg-[#ff2a6d] shadow-[0_0_5px_#ff2a6d]' : i % 5 === 0 ? 'bg-[#00f2ff] shadow-[0_0_5px_#00f2ff]' : 'bg-[#1bf7cd] shadow-[0_0_5px_#1bf7cd]'}`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- DATABASE DASHBOARD ---
function DatabaseDashboard() {
  const [health, setHealth] = useState(96);

  const logAction = (type: string, message: string) => {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('agent_lee_logs') || '[]');
      const newLog = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('agent_lee_logs', JSON.stringify([newLog, ...existingLogs]));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => {
        const newHealth = Math.max(90, Math.min(100, prev + (Math.random() * 4 - 2)));
        if (newHealth < 92) logAction('diagnostics', `Database health degraded slightly to ${newHealth.toFixed(1)}%`);
        return newHealth;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full bg-transparent text-[#e0e7ff] font-['Outfit'] p-4 space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#6C47FF] via-[#00E3FF] to-[#FF4499] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(108,71,255,0.3)]">Multi-Database Command Center</h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">Manage and monitor all your data sources in one place with Agent Lee's Database Management System</p>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)] hover:shadow-[0_0_40px_rgba(108,71,255,0.2)] transition-all">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]"><Network size={20} /></div><span className="text-lg font-semibold">Database Cluster</span></div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">5 Nodes</span>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                <div className="flex-1 flex justify-center w-full">
                  <svg width="240" height="240" viewBox="0 0 300 300" className="max-w-full h-auto">
                    <polygon points="150,30 270,120 220,260 80,260 30,120" fill="none" stroke="rgba(108, 71, 255, 0.3)" strokeWidth="2" />
                    <circle cx="150" cy="30" r="18" fill="rgba(255, 68, 153, 0.2)" stroke="rgba(255, 68, 153, 0.8)" strokeWidth="2" />
                    <circle cx="270" cy="120" r="18" fill="rgba(108, 71, 255, 0.2)" stroke="rgba(108, 71, 255, 0.8)" strokeWidth="2" />
                    <circle cx="220" cy="260" r="18" fill="rgba(255, 193, 7, 0.2)" stroke="rgba(255, 193, 7, 0.8)" strokeWidth="2" />
                    <circle cx="80" cy="260" r="18" fill="rgba(71, 255, 190, 0.2)" stroke="rgba(71, 255, 190, 0.8)" strokeWidth="2" />
                    <circle cx="30" cy="120" r="18" fill="rgba(0, 227, 255, 0.2)" stroke="rgba(0, 227, 255, 0.8)" strokeWidth="2" />
                    <text x="150" y="155" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">CORE</text>
                  </svg>
                </div>
                <div className="flex-1 w-full bg-[#0c0f234d] p-4 rounded-2xl border border-[#6c47ff26]">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-gray-400">Node Status</h3>
                  <div className="space-y-3">
                    {[{ label: 'LLM Memory', color: 'bg-[#FF4499]' }, { label: 'Agent Center', color: 'bg-[#6C47FF]' }, { label: 'Worker Processes', color: 'bg-[#FFC107]' }, { label: 'Task & Todo List', color: 'bg-[#47FFBE]' }, { label: 'Metadata Storage', color: 'bg-[#00E3FF]' }].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs"><div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></div><span>{item.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)]">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]"><HeartPulse size={20} /></div><span className="text-lg font-semibold">Database Health</span></div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">Real-time</span>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="relative w-56 h-28 overflow-hidden rounded-t-full bg-[#0c0f2366] border border-[#6c47ff33]">
                <div className="absolute bottom-0 left-0 w-full h-56 rounded-full transition-transform duration-1000 ease-out" style={{ background: 'conic-gradient(#FF4C6F 0%, #FFE14C 30%, #00FFB3 60%, #FFE14C 80%, #FF4C6F 100%)', transform: `rotate(${(health / 100) * 180 - 90}deg)`, transformOrigin: 'center bottom' }}></div>
                <div className="absolute bottom-[-90px] left-5 w-44 h-44 rounded-full bg-[#030410] shadow-inner"></div>
                <div className="absolute top-[75px] left-0 w-full text-center text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(0,255,179,0.5)]">{Math.round(health)}%</div>
              </div>
              <div className="mt-8 w-full p-4 rounded-2xl bg-[#00FFB30d] border border-[#00FFB333] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00FFB31a] text-[#00FFB3] flex items-center justify-center border border-[#00FFB34d]"><CheckCircle2 size={24} /></div>
                <div className="flex-1"><div className="text-sm font-bold text-[#00FFB3]">All Systems Operational</div><div className="text-[10px] text-gray-400">All database connections are active and responding normally.</div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)]">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]"><Server size={20} /></div><span className="text-lg font-semibold">Database Systems</span></div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">5 Systems</span>
            </div>
            <div className="p-6 space-y-6">
              {[{ name: 'IndexedDB', type: 'Browser Storage Engine', color: '#6C47FF', records: '48,291', size: '12.4 MB', perf: 95 }, { name: 'SQL.js', type: 'In-Memory SQL Database', color: '#00E3FF', records: '32,178', size: '8.7 MB', perf: 87 }, { name: 'Vector Database', type: 'Embeddings Storage', color: '#47FFBE', records: '15,621', size: '1,536 Dims', perf: 92 }].map((sys, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#0c0f234d] border border-[#6c47ff1a] relative overflow-hidden group hover:bg-[#0c0f2380] transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: sys.color }}></div>
                  <div className="flex justify-between items-start mb-6">
                    <div><h3 className="text-xl font-bold text-white mb-1">{sys.name}</h3><div className="text-xs text-gray-500">{sys.type}</div></div>
                    <div className="w-10 h-10 rounded-full bg-[#00FFB31a] border border-[#00FFB34d] flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-[#00FFB3] shadow-[0_0_10px_#00FFB3]"></div></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]"><div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Records</div><div className="text-sm font-bold">{sys.records}</div></div>
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]"><div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Storage</div><div className="text-sm font-bold">{sys.size}</div></div>
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]"><div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Tables</div><div className="text-sm font-bold">{i === 0 ? '8' : i === 1 ? '12' : '3'}</div></div>
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]"><div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Performance</div><div className="text-sm font-bold">{sys.perf}%</div></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase"><span>Performance</span><span>{sys.perf}%</span></div>
                    <div className="h-2 rounded-full bg-[#0c0f23] overflow-hidden"><div className="h-full transition-all duration-1000" style={{ width: `${sys.perf}%`, backgroundColor: sys.color }}></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AGENT CENTER ---
const initialAgents = WORLD_REGISTRY.map(agent => ({
  id: agent.id,
  name: `${agent.name} [family:${agent.family}] [role:${agent.role}]`,
  function: agent.purpose,
  category: agent.archetype,
  description: `${agent.personality.traits.join(', ')} | ${agent.personality.tone}`,
  tools: agent.permissions,
  performance: agent.drives.precision * 100,
  efficiency: agent.drives.responsibility * 100,
  avatar: agent.visual.icon === 'crown' ? '👑' : 
          agent.visual.icon === 'brain' ? '🧠' : 
          agent.visual.icon === 'hammer' ? '⚒' : 
          agent.visual.icon === 'shield' ? '🛡' : 
          agent.visual.icon === 'scroll' ? '📜' : 
          agent.visual.icon === 'map' ? '🗺' :
          agent.visual.icon === 'palette' ? '🎨' :
          agent.visual.icon === 'activity' ? '📊' :
          agent.visual.icon === 'archive' ? '🗂' :
          agent.visual.icon === 'book-open' ? '📖' :
          agent.visual.icon === 'shield-check' ? '✅' :
          agent.visual.icon === 'clipboard-check' ? '📋' :
          agent.visual.icon === 'trash-2' ? '🧹' :
          agent.visual.icon === 'languages' ? '🌐' :
          agent.visual.icon === 'mic-2' ? '🎤' :
          agent.visual.icon === 'search' ? '🔍' : '🤖',
  status: agent.state.wakeState.toLowerCase(),
  type: agent.family,
  path: `/core/${agent.id.split('-')[0]}`,
  agent: agent.title
}));

const webWorkerNames = ["Cipher", "Byte", "Pixel", "Vector", "Tensor", "Matrix", "Nexion", "Prism", "Neuron", "Cortex"];
const serviceWorkerNames = ["Guardian", "Sentinel", "Aegis", "Bastion", "Citadel"];

const allAgents = [...initialAgents];
for (let i = 5; i < 110; i++) {
  const isWeb = i < 80;
  const name = isWeb ? webWorkerNames[i % webWorkerNames.length] : serviceWorkerNames[i % serviceWorkerNames.length];
  allAgents.push({
    id: `NEXUS-AGENT-${(i+1).toString().padStart(3, '0')}`,
    name: `${name}-${i}`,
    function: isWeb ? 'async_processor()' : 'cache_manager()',
    category: isWeb ? 'Web & Network Operations' : 'Service & Background Operations',
    description: `Specialized ${isWeb ? 'Web' : 'Service'} worker for high-concurrency tasks.`,
    tools: isWeb ? ['WebWorkers', 'Fetch'] : ['Cache API', 'ServiceWorker'],
    performance: Math.floor(Math.random() * 15) + 80,
    efficiency: Math.floor(Math.random() * 15) + 80,
    avatar: isWeb ? '🌐' : '🛡️',
    status: Math.random() > 0.3 ? 'active' : 'idle',
    type: (isWeb ? 'Web Worker' : 'Service Worker') as AgentFamily,
    path: isWeb ? `/web/${name.toLowerCase()}` : `/service/${name.toLowerCase()}`,
    agent: isWeb ? 'WEB_WORKER' : 'SERVICE_WORKER'
  });
}

function AgentCenter() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [metrics, setMetrics] = useState({ active: 110, load: 73, efficiency: 94 });
  const listRef = useRef<HTMLDivElement>(null);

  const filteredAgents = currentCategory === 'all' 
    ? allAgents 
    : allAgents.filter(a => {
        if (currentCategory === 'web') return (a.type as string) === 'Web Worker';
        if (currentCategory === 'service') return (a.type as string) === 'Service Worker';
        if (currentCategory === 'supervisor') return (a.type as string) === 'Supervisor';
        return true;
      });

  const selectedAgent = filteredAgents[selectedIndex] || filteredAgents[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        load: Math.max(40, Math.min(95, prev.load + (Math.random() * 10 - 5))),
        efficiency: Math.max(85, Math.min(99, prev.efficiency + (Math.random() * 2 - 1)))
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (listRef.current) {
      const scrollAmount = dir === 'left' ? -200 : 200;
      listRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-full bg-transparent text-[#e0e7ff] font-['Inter'] p-4 space-y-6">
      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-[#0a0e29cc] to-[#1e0f46cc] backdrop-blur-xl border-b border-[#00f2ff26] p-6 rounded-t-3xl shadow-[0_5px_25px_rgba(0,242,255,0.15)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-[#00f2ff] rounded-full animate-pulse"></div>
              <div className="absolute inset-[20%] border border-[#9854ff] rounded-full animate-pulse delay-300"></div>
              <div className="absolute inset-[35%] bg-[#ff2a6d] rounded-full shadow-[0_0_10px_#ff2a6d]"></div>
            </div>
            <h1 className="font-['Orbitron'] text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.7)]">
              Agent Lee's <span className="text-[#ff2a6d] drop-shadow-[0_0_10px_rgba(255,42,109,0.5)]">Integrated MCPS & Workers Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-[#10142899] px-5 py-2 rounded-full border border-[#00f2ff26] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <div className="w-3 h-3 rounded-full bg-[#06d6a0] shadow-[0_0_10px_#06d6a0] animate-pulse"></div>
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-[#10142866] backdrop-blur-xl rounded-2xl border border-[#00f2ff26] p-4 flex flex-wrap justify-center gap-3 shadow-[0_0_20px_rgba(0,242,255,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f2ff1a] to-transparent -translate-x-full animate-[scanline_8s_linear_infinite] pointer-events-none"></div>
        {[
          { id: 'all', label: 'All Workers', icon: <Cpu size={16} /> },
          { id: 'web', label: 'Web Workers', icon: <Globe size={16} /> },
          { id: 'service', label: 'Service Workers', icon: <Zap size={16} /> },
          { id: 'supervisor', label: 'Supervisors', icon: <User size={16} /> }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => { setCurrentCategory(btn.id); setSelectedIndex(0); }}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_0_10px_rgba(0,242,255,0.3)] ${
              currentCategory === btn.id 
                ? 'bg-gradient-to-r from-[#00f2ff] to-[#9854ff] border-transparent text-white font-bold' 
                : 'bg-[#0e162db3] border-[#00f2ff26] text-gray-300'
            }`}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
        <button className="px-4 py-2 rounded-lg border border-[#9854ff] bg-[#0e162db3] text-gray-300 flex items-center gap-2 hover:-translate-y-1 transition-all">
          <Stethoscope size={16} /> Run Diagnostic
        </button>
        <button className="px-4 py-2 rounded-lg border border-[#ff2a6d] bg-gradient-to-br from-[#0e162db3] to-[#9854ff4d] text-gray-300 flex items-center gap-2 hover:-translate-y-1 transition-all">
          <HeartPulse size={16} className="text-[#ff2a6d] animate-pulse" /> Heartbeat Check
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-350px)] lg:min-h-[600px]">
        {/* Left: Worker Monitor */}
        <div className="lg:col-span-8 bg-[#10142866] backdrop-blur-xl rounded-2xl border border-[#00f2ff26] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)] min-h-[500px] lg:min-h-0">
          <div className="bg-[#181a2ccc] p-4 border-b border-[#00f2ff26] flex justify-between items-center">
            <h2 className="font-['Orbitron'] text-lg font-semibold flex items-center gap-3">
              <Microchip size={20} className="text-[#00f2ff]" /> Agent Lee's Worker Monitor
            </h2>
            <div className="bg-black/20 px-3 py-1 rounded-full border border-[#00f2ff26] text-[#00f2ff] font-['Orbitron'] text-sm">
              {filteredAgents.length} {currentCategory === 'all' ? 'Total' : currentCategory}
            </div>
          </div>

          {/* Holographic Display */}
          <div className="flex-1 relative bg-gradient-to-br from-black/20 to-[#00f2ff05] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute bottom-24 w-72 h-3 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent rounded-[50%] blur-[5px] opacity-70 shadow-[0_0_20px_rgba(0,242,255,0.6)]"></div>
            
            <div className="relative w-48 h-72 flex flex-col items-center animate-[float-hologram_4s_ease-in-out_infinite]">
              <div className={`w-24 h-44 relative transition-all duration-500 scale-125 ${
                selectedAgent.status === 'active' ? 'bg-gradient-to-b from-[#00f2ff] to-[#9854ff] opacity-70' :
                selectedAgent.status === 'idle' ? 'bg-gradient-to-b from-[#00d1ff] to-[#9854ff] opacity-60' :
                'bg-gradient-to-b from-[#ff416c] to-[#ff2a6d] opacity-90'
              }`} style={{ clipPath: 'polygon(30% 0%, 70% 0%, 70% 10%, 80% 10%, 80% 20%, 70% 20%, 70% 40%, 80% 45%, 80% 50%, 70% 55%, 70% 80%, 60% 100%, 40% 100%, 30% 80%, 30% 55%, 20% 50%, 20% 45%, 30% 40%, 30% 20%, 20% 20%, 20% 10%, 30% 10%)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#00f2ff] to-transparent opacity-30 animate-pulse"></div>
              </div>
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent animate-[scan-worker_3s_ease-in-out_infinite] blur-[2px] opacity-70"></div>
              
              <div className="mt-8 text-center">
                <h3 className="font-['Orbitron'] text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.6)]">{selectedAgent.name}</h3>
                <div className="text-sm text-gray-400 font-medium">{selectedAgent.path || selectedAgent.id}</div>
                <div className="text-sm text-gray-300 font-semibold mb-3">{selectedAgent.agent || 'SUPERVISOR'}</div>
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#ff2a6d] bg-black/30 text-[#ff2a6d] text-xs font-bold">
                  {selectedAgent.type}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel */}
          <div className="bg-black/30 p-5 border-t border-[#00f2ff26] relative h-44">
            <div className="absolute inset-y-0 left-0 flex items-center px-2 z-10 pointer-events-none">
              <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full bg-black/50 border border-[#00f2ff26] text-[#00f2ff] flex items-center justify-center hover:bg-[#00f2ff33] transition-all pointer-events-auto">
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 z-10 pointer-events-none">
              <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full bg-black/50 border border-[#00f2ff26] text-[#00f2ff] flex items-center justify-center hover:bg-[#00f2ff33] transition-all pointer-events-auto">
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div ref={listRef} className="flex gap-4 overflow-x-auto no-scrollbar h-full items-center px-12">
              {filteredAgents.map((agent, i) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedIndex(i)}
                  className={`min-w-[120px] h-32 rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                    i === selectedIndex ? 'border-[#00f2ff] bg-[#00f2ff1a] shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'border-[#00f2ff26] bg-[#0a0e1e80] hover:bg-[#00f2ff0d]'
                  }`}
                >
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border border-white/20 ${
                    agent.status === 'active' ? 'bg-[#06d6a0] shadow-[0_0_6px_#06d6a0]' : 'bg-[#00d1ff] shadow-[0_0_6px_#00d1ff]'
                  }`}></div>
                  <div className="text-2xl mb-2 relative">
                    {agent.avatar}
                    <div className="absolute inset-0 border border-[#00f2ff] rounded-full scale-125 opacity-40"></div>
                  </div>
                  <div className="text-xs font-bold text-center truncate w-full">{agent.name}</div>
                  <div className="text-[9px] text-[#9854ff] font-medium">{agent.type}</div>
                  <div className="text-[9px] text-gray-500 font-['Orbitron']">{agent.id.split('-').pop()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Diagnostics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#10142866] backdrop-blur-xl rounded-2xl border border-[#00f2ff26] overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)] flex flex-col h-full">
            <div className="bg-[#181a2ccc] flex border-b border-[#00f2ff26]">
              {['health', 'resources', 'logs'].map(tab => (
                <button
                  key={tab}
                  className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-[#00f2ff26] last:border-0 hover:bg-[#00f2ff1a] transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <section>
                <h3 className="font-['Orbitron'] text-sm font-bold text-[#00f2ff] mb-4 flex items-center gap-2">
                  <Activity size={16} /> Execution Health
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Status', val: selectedAgent.status.toUpperCase(), color: 'text-[#06d6a0]' },
                    { label: 'Task Queue', val: '0', color: 'text-[#00f2ff]' },
                    { label: 'Uptime', val: '14h 22m', color: 'text-[#9854ff]' },
                    { label: 'Frequency', val: '42 c/min', color: 'text-[#ffd166]' }
                  ].map((m, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{m.label}</div>
                      <div className={`text-sm font-['Orbitron'] font-bold ${m.color}`}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-['Orbitron'] text-sm font-bold text-[#00f2ff] mb-4 flex items-center gap-2">
                  <ChartLine size={16} /> Resource Usage
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Cognitive Load', val: selectedAgent.performance, color: '#06d6a0' },
                    { label: 'Memory Saturation', val: selectedAgent.efficiency, color: '#9854ff' }
                  ].map((m, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400">{m.label}</span>
                        <span style={{ color: m.color }}>{m.val}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full transition-all duration-1000" style={{ width: `${m.val}%`, backgroundColor: m.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-['Orbitron'] text-sm font-bold text-[#00f2ff] mb-4 flex items-center gap-2">
                  <Terminal size={16} /> Agent Protocol Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tools.map((tool, i) => (
                    <span key={i} className="px-3 py-1 bg-[#00f2ff0d] border border-[#00f2ff4d] rounded-full text-[10px] text-[#00f2ff] font-bold">
                      {tool}
                    </span>
                  ))}
                </div>
              </section>

              <section className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-3">Last Task Log</div>
                <div className="font-mono text-[10px] text-[#00d1ff] leading-relaxed">
                  <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> Task executed successfully. Memory parity verified.
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- TODO LIST ---
interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'High' | 'Med' | 'Low';
  timestamp: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Optimize GLM-4.7-FLASH neural weights', status: 'In Progress', priority: 'High', timestamp: '2026-03-29 06:24' },
  { id: '2', title: 'Synchronize episodic memory clusters', status: 'Pending', priority: 'Med', timestamp: '2026-03-29 06:25' },
  { id: '3', title: 'Audit autonomous agent permissions', status: 'Completed', priority: 'Low', timestamp: '2026-03-29 06:26' },
  { id: '4', title: 'Refactor memory pipeline for Android', status: 'In Progress', priority: 'High', timestamp: '2026-03-29 06:27' },
  { id: '5', title: 'Update diagnostic visualization layers', status: 'Pending', priority: 'Med', timestamp: '2026-03-29 06:28' }
];

function TodoList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      status: 'Pending',
      priority: 'Med',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus: Task['status'] = t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Pending';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-full bg-transparent text-[#e0e7ff] font-['Inter'] p-4 max-w-4xl mx-auto">
      <div className="bg-black/40 p-6 md:p-8 rounded-2xl border border-[#1bf7cd33] shadow-[0_0_40px_rgba(27,247,205,0.1)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-bold text-[#1bf7cd] flex items-center gap-4 uppercase tracking-tighter">
            <ListTodo size={32} /> INTENT CLASSIFIER
          </h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Inject new operation..."
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1bf7cd] transition-all flex-1 md:w-64"
            />
            <button 
              onClick={addTask}
              className="animated-border p-2 bg-[#1bf7cd26] border border-[#1bf7cd4d] text-[#1bf7cd] rounded-lg hover:bg-[#1bf7cd33] transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((t) => (
            <div 
              key={t.id} 
              className="group p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/10 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-[#1bf7cd] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button 
                  onClick={() => toggleStatus(t.id)}
                  className={`transition-colors ${
                    t.status === 'Completed' ? 'text-[#1bf7cd]' : 
                    t.status === 'In Progress' ? 'text-[#f7d31b]' : 'text-gray-600'
                  }`}
                >
                  {t.status === 'Completed' ? <CheckCircle2 size={20} /> : t.status === 'In Progress' ? <Clock size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${t.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                    {t.title}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">{t.timestamp}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">{t.status}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    t.priority === 'High' ? 'bg-[#ff2a6d26] text-[#ff2a6d]' :
                    t.priority === 'Med' ? 'bg-[#f7d31b26] text-[#f7d31b]' :
                    'bg-[#1bf7cd26] text-[#1bf7cd]'
                  }`}>{t.priority}</span>
                </div>
                <button 
                  onClick={() => deleteTask(t.id)}
                  className="p-2 text-gray-600 hover:text-[#ff2a6d] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-500 font-mono text-sm">
              <AlertCircle className="mx-auto mb-3 opacity-20" size={48} />
              NO ACTIVE OPERATIONS DETECTED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- WORKERS CENTER ---
interface Worker {
  name: string;
  path: string;
  type: string;
  agent: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  load: number;
  memory: number;
  tasks: number;
  category: 'embedded' | 'external' | 'supervisor';
  icon: React.ReactNode;
  pm2Name?: string;
  port?: number;
  prefix?: string;
  description?: string;
  diagnostics: any;
}

const WorkersCenter: React.FC = () => {
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<'all' | 'embedded' | 'external' | 'supervisor'>('all');
  const [activeTab, setActiveTab] = useState<'health' | 'resources' | 'logs' | 'autonomy' | 'service'>('health');
  
  const cyclesChartRef = useRef<HTMLCanvasElement>(null);
  const resourceChartRef = useRef<HTMLCanvasElement>(null);
  const responseChartRef = useRef<HTMLCanvasElement>(null);
  
  const chartsRef = useRef<{ [key: string]: Chart | null }>({
    cycles: null,
    resources: null,
    response: null,
    modal: null
  });

  const [workerData, setWorkerData] = useState<Worker[]>([]);

  useEffect(() => {
    const generateDiagnosticData = (name: string) => ({
      uptime: Date.now() - Math.random() * 86400000,
      taskQueue: Math.floor(Math.random() * 10),
      runFrequency: Math.floor(Math.random() * 60) + 20,
      isPolling: Math.random() > 0.1,
      customInterval: [1000, 2000, 5000][Math.floor(Math.random() * 3)],
      backupTriggered: Math.random() < 0.1,
      autoRecovery: Math.random() > 0.05,
      lastTaskLog: `Task executed at ${new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString()}`,
      failedRuns: Math.random() < 0.1 ? [`Error: ${['Connection timeout', 'Memory overflow', 'Invalid input'][Math.floor(Math.random() * 3)]}`] : [],
      handledAgents: [`AGENT-${Math.floor(Math.random() * 255) + 1}`],
      cyclesHistory: Array.from({length: 20}, () => Math.floor(Math.random() * 80) + 20),
      resourceHistory: {
        cpu: Array.from({length: 20}, () => Math.floor(Math.random() * 100)),
        memory: Array.from({length: 20}, () => Math.floor(Math.random() * 200) + 50)
      },
      responseTimeHistory: Array.from({length: 10}, () => Math.floor(Math.random() * 500) + 50),
      handshake: 'AGENT_LEE_SOVEREIGN_V1',
      healthEndpoint: name.includes('MCP') ? `http://127.0.0.1:700${Math.floor(Math.random() * 9)}/health` : 'N/A'
    });

    const embeddedMCPs: Worker[] = [
      {
        name: "DashboardMCP",
        path: "services/dashboard-mcp",
        type: "Embedded MCP",
        agent: "AgentLee-DashboardMCP",
        status: 'active',
        load: 12,
        memory: 45,
        tasks: 1240,
        category: 'embedded',
        icon: <LayoutGrid size={24} />,
        pm2Name: "AgentLee-DashboardMCP",
        port: 7008,
        description: "Polls PM2 + backend health; status: operational; contract: strict; roles: [role:monitor]; caps: [cap:verify.http]",
        diagnostics: generateDiagnosticData("DashboardMCP")
      },
      {
        name: "BrowserMCP",
        path: "services/browser-mcp",
        type: "Embedded MCP",
        agent: "AgentLee-BrowserMCP",
        status: 'active',
        load: 28,
        memory: 156,
        tasks: 850,
        category: 'embedded',
        icon: <Globe size={24} />,
        pm2Name: "AgentLee-BrowserMCP",
        port: 7009,
        description: "Headless browser agent; roles: [role:publisher]; caps: [cap:browser.automation]",
        diagnostics: generateDiagnosticData("BrowserMCP")
      },
      {
        name: "VS Code Bridge",
        path: "services/vscode-bridge",
        type: "Embedded MCP",
        agent: "AgentLee-Bridge",
        status: 'active',
        load: 5,
        memory: 32,
        tasks: 4500,
        category: 'embedded',
        icon: <Terminal size={24} />,
        pm2Name: "AgentLee-Bridge",
        port: 7002,
        description: "VS Code integration; roles: [role:builder]; caps: [cap:fs.read, cap:fs.write]",
        diagnostics: generateDiagnosticData("VS Code Bridge")
      },
      {
        name: "InsForge Bridge",
        path: "services/insforge-bridge",
        type: "Embedded MCP",
        agent: "AgentLee-InsForgeBridge",
        status: 'active',
        load: 18,
        memory: 64,
        tasks: 2100,
        category: 'embedded',
        icon: <Database size={24} />,
        pm2Name: "AgentLee-InsForgeBridge",
        port: 7007,
        description: "PostgreSQL CRUD relay; roles: [role:monitor]; caps: [cap:memory.write]",
        diagnostics: generateDiagnosticData("InsForge Bridge")
      }
    ];

    const externalMCPs: Worker[] = [
      {
        name: "InsForge DB",
        path: "external/insforge-db",
        type: "External Tool Set",
        agent: "mcp_io_github_ins_*",
        status: 'active',
        load: 15,
        memory: 120,
        tasks: 3200,
        category: 'external',
        icon: <Zap size={24} />,
        prefix: "mcp_io_github_ins_*",
        description: "SQL & Bucket ops; roles: [role:monitor]; caps: [cap:memory.write]",
        diagnostics: generateDiagnosticData("InsForge DB")
      },
      {
        name: "Chrome Automation",
        path: "external/chrome-auto",
        type: "External Tool Set",
        agent: "mcp_io_github_chr_*",
        status: 'active',
        load: 45,
        memory: 512,
        tasks: 1200,
        category: 'external',
        icon: <Globe size={24} />,
        prefix: "mcp_io_github_chr_*",
        description: "Public URL automation; roles: [role:publisher]; caps: [cap:browser.automation]",
        diagnostics: generateDiagnosticData("Chrome Automation")
      },
      {
        name: "GitKraken",
        path: "external/gitkraken",
        type: "External Tool Set",
        agent: "mcp_gitkraken_*",
        status: 'active',
        load: 8,
        memory: 85,
        tasks: 540,
        category: 'external',
        icon: <GitBranch size={24} />,
        prefix: "mcp_gitkraken_*",
        description: "VCS workflows; roles: [role:builder]; caps: [cap:fs.write]",
        diagnostics: generateDiagnosticData("GitKraken")
      },
      {
        name: "Desktop Commander",
        path: "external/desktop-cmd",
        type: "External Tool Set",
        agent: "mcp_desktop-comma_*",
        status: 'active',
        load: 12,
        memory: 45,
        tasks: 890,
        category: 'external',
        icon: <Monitor size={24} />,
        prefix: "mcp_desktop-comma_*",
        description: "Host operations; roles: [role:builder]; caps: [cap:terminal.exec]",
        diagnostics: generateDiagnosticData("Desktop Commander")
      },
      {
        name: "TestSprite",
        path: "external/testsprite",
        type: "External Tool Set",
        agent: "mcp_cigro_testspr_*",
        status: 'active',
        load: 22,
        memory: 110,
        tasks: 320,
        category: 'external',
        icon: <Bug size={24} />,
        prefix: "mcp_cigro_testspr_*",
        description: "QA orchestration; roles: [role:verifier]; caps: [cap:verify.http]",
        diagnostics: generateDiagnosticData("TestSprite")
      },
      {
        name: "Spline 3D",
        path: "external/spline",
        type: "External Tool Set",
        agent: "mcp_spline-mcp_*",
        status: 'active',
        load: 65,
        memory: 1024,
        tasks: 150,
        category: 'external',
        icon: <Box size={24} />,
        prefix: "mcp_spline-mcp_*",
        description: "3D spec generation; roles: [role:builder]; caps: [cap:vision]",
        diagnostics: generateDiagnosticData("Spline 3D")
      },
      {
        name: "Stitch UI",
        path: "external/stitch",
        type: "External Tool Set",
        agent: "mcp_stitch-mcp_*",
        status: 'active',
        load: 35,
        memory: 256,
        tasks: 420,
        category: 'external',
        icon: <Palette size={24} />,
        prefix: "mcp_stitch-mcp_*",
        description: "UI generation; roles: [role:builder]; caps: [cap:vision]",
        diagnostics: generateDiagnosticData("Stitch UI")
      },
      {
        name: "Agent Lee Self",
        path: "external/agentlee-self",
        type: "External Tool Set",
        agent: "mcp_agentlee_*",
        status: 'active',
        load: 10,
        memory: 64,
        tasks: 15000,
        category: 'external',
        icon: <Bot size={24} />,
        prefix: "mcp_agentlee_*",
        description: "Self-analysis; roles: [role:monitor]; caps: [cap:memory.read]",
        diagnostics: generateDiagnosticData("Agent Lee Self")
      }
    ];

    const supervisorMCPs: Worker[] = [
      {
        name: "Core-Orchestrator",
        path: "supervisor/orchestrator",
        type: "Supervisor",
        agent: "AGENT-000",
        status: 'active',
        load: 5,
        memory: 128,
        tasks: 99999,
        category: 'supervisor',
        icon: <ShieldCheck size={24} />,
        description: "System coordinator; roles: [role:planner]; caps: [cap:plan]",
        diagnostics: generateDiagnosticData("Core-Orchestrator")
      }
    ];

    setWorkerData([...embeddedMCPs, ...externalMCPs, ...supervisorMCPs]);
  }, []);

  const filteredWorkers = workerData.filter(w => currentCategory === 'all' || w.category === currentCategory);
  const currentWorker = filteredWorkers[selectedWorkerIndex];

  useEffect(() => {
    if (!currentWorker) return;

    const initChart = (ref: React.RefObject<HTMLCanvasElement | null>, key: string, config: any) => {
      if (chartsRef.current[key]) chartsRef.current[key]?.destroy();
      if (ref.current) {
        chartsRef.current[key] = new Chart(ref.current, config);
      }
    };

    initChart(cyclesChartRef, 'cycles', {
      type: 'line',
      data: {
        labels: Array.from({length: 20}, (_, i) => i),
        datasets: [{
          label: 'Cycles/min',
          data: currentWorker.diagnostics.cyclesHistory,
          borderColor: '#00f2ff',
          backgroundColor: 'rgba(0, 242, 255, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { beginAtZero: true, ticks: { color: '#e0e7ff' } } }
      }
    });

    initChart(resourceChartRef, 'resources', {
      type: 'line',
      data: {
        labels: Array.from({length: 20}, (_, i) => i),
        datasets: [{
          label: 'CPU %',
          data: currentWorker.diagnostics.resourceHistory.cpu,
          borderColor: '#06d6a0',
          backgroundColor: 'rgba(6, 214, 160, 0.1)',
          tension: 0.4
        }, {
          label: 'Memory MB',
          data: currentWorker.diagnostics.resourceHistory.memory,
          borderColor: '#9854ff',
          backgroundColor: 'rgba(152, 84, 255, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#e0e7ff', font: { size: 8 } } } },
        scales: { x: { display: false }, y: { beginAtZero: true, ticks: { color: '#e0e7ff' } } }
      }
    });

    initChart(responseChartRef, 'response', {
      type: 'bar',
      data: {
        labels: Array.from({length: 10}, (_, i) => `T${i+1}`),
        datasets: [{
          label: 'Response Time (ms)',
          data: currentWorker.diagnostics.responseTimeHistory,
          backgroundColor: 'rgba(255, 42, 109, 0.6)',
          borderColor: '#ff2a6d',
          borderWidth: 1
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: '#e0e7ff' } }, y: { beginAtZero: true, ticks: { color: '#e0e7ff' } } }
      }
    });

    return () => {
      Object.values(chartsRef.current).forEach((chart: any) => chart?.destroy());
    };
  }, [currentWorker, activeTab]);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!currentWorker) return <div className="p-10 text-center opacity-50">Initializing Workers Center...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0a0e29] text-[#e0e7ff] font-['Inter'] overflow-hidden">
      {/* Header */}
      <div className="p-2 md:p-6 bg-black/40 border-b border-[#00f2ff26] flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#00f2ff] to-[#9854ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <Cpu size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="font-['Orbitron'] text-lg md:text-2xl font-black text-white tracking-tighter flex items-center gap-2">
              MCP AGENTS <span className="text-[#ff2a6d] animate-pulse">SENSITIVE</span>
            </h1>
            <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-[#00f2ff] font-bold uppercase tracking-widest opacity-70">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00f2ff] animate-ping" />
              Neural Network Active • {workerData.length} Nodes
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-1 md:gap-2">
          <button 
            onClick={() => { setCurrentCategory('all'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold transition-all ${currentCategory === 'all' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <LayoutGrid size={10} className="md:w-3 md:h-3" /> ALL
          </button>
          <button 
            onClick={() => { setCurrentCategory('embedded'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold transition-all ${currentCategory === 'embedded' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <Server size={10} className="md:w-3 md:h-3" /> EMBEDDED
          </button>
          <button 
            onClick={() => { setCurrentCategory('external'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold transition-all ${currentCategory === 'external' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <Link size={10} className="md:w-3 md:h-3" /> EXTERNAL
          </button>
          <button 
            onClick={() => { setCurrentCategory('supervisor'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold transition-all ${currentCategory === 'supervisor' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <ShieldCheck size={10} className="md:w-3 md:h-3" /> SUPERVISORS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-32 md:pb-40 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Display */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          <div className="flex-1 bg-black/40 backdrop-blur-md rounded-xl border border-[#00f2ff26] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)]">
            <div className="bg-[#181a2ccc] p-4 border-b border-[#00f2ff26] flex justify-between items-center">
              <div className="flex items-center gap-3 font-['Orbitron'] text-sm font-bold">
                <Microchip className="text-[#00f2ff]" size={18} /> AGENT LEE'S WORKER MONITOR
              </div>
              <div className="bg-black/40 px-3 py-1 rounded-full text-[10px] font-['Orbitron'] text-[#00f2ff] border border-[#00f2ff26]">
                {filteredWorkers.length} {currentCategory.toUpperCase()}
              </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
              <div className="absolute bottom-20 w-[300px] h-[10px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent rounded-full blur-[5px] opacity-70 shadow-[0_0_20px_rgba(0,242,255,0.6)]" />
              
              <div className="relative flex flex-col items-center animate-[float_4s_ease-in-out_infinite]">
                <div 
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center relative mb-4 transition-all duration-500 ${
                    currentWorker.status === 'active' ? 'bg-gradient-to-br from-[#00f2ff33] to-[#9854ff33] border border-[#00f2ff44]' :
                    currentWorker.status === 'processing' ? 'bg-gradient-to-br from-[#f7d31b33] to-[#00f2ff33] border border-[#f7d31b44]' :
                    currentWorker.status === 'error' ? 'bg-gradient-to-br from-[#ff2a6d33] to-[#ff416c33] border border-[#ff2a6d44]' :
                    'bg-white/5 border border-white/10 opacity-40'
                  }`}
                >
                  <div className="text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]">
                    {currentWorker.icon}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00f2ff11] to-transparent opacity-30 animate-pulse rounded-2xl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black border border-[#00f2ff26] flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${currentWorker.status === 'active' ? 'bg-[#1bf7cd]' : 'bg-gray-500'}`} />
                  </div>
                </div>
                
                <h2 className="font-['Orbitron'] text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.7)] mb-1">{currentWorker.name}</h2>
                <p className="text-[10px] opacity-60 mb-2 font-mono tracking-widest uppercase">{currentWorker.path}</p>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-black/40 px-4 py-1.5 rounded-lg border border-[#ff2a6d] text-[10px] text-[#ff2a6d] uppercase tracking-widest font-bold">
                    {currentWorker.type}
                  </div>
                  <p className="text-[11px] text-center max-w-xs opacity-80 italic">"{currentWorker.description}"</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 p-4 border-t border-[#00f2ff26] relative overflow-hidden h-40">
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar h-full items-center">
                {filteredWorkers.map((worker, i) => (
                  <button 
                    key={worker.path}
                    onClick={() => setSelectedWorkerIndex(i)}
                    className={`shrink-0 w-28 h-28 bg-[#0a0e1e80] border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden ${selectedWorkerIndex === i ? 'border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'border-[#00f2ff1a] hover:border-[#00f2ff44]'}`}
                  >
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      worker.status === 'active' ? 'bg-[#1bf7cd] shadow-[0_0_5px_#1bf7cd]' :
                      worker.status === 'processing' ? 'bg-[#f7d31b] shadow-[0_0_5px_#f7d31b]' :
                      worker.status === 'error' ? 'bg-[#ff2a6d] shadow-[0_0_5px_#ff2a6d]' :
                      'bg-[#0af] shadow-[0_0_5px_#0af]'
                    }`} />
                    <div className="text-[#00f2ff] opacity-80 group-hover:scale-110 transition-transform">
                      {worker.icon}
                    </div>
                    <div className="text-[10px] font-bold text-center truncate w-full">{worker.name}</div>
                    <div className="text-[8px] opacity-40 uppercase tracking-tighter">{worker.type}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSelectedWorkerIndex(prev => Math.max(0, prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 border border-[#00f2ff26] rounded-full flex items-center justify-center text-[#00f2ff] hover:bg-[#00f2ff26] transition-all z-10"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setSelectedWorkerIndex(prev => Math.min(filteredWorkers.length - 1, prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 border border-[#00f2ff26] rounded-full flex items-center justify-center text-[#00f2ff] hover:bg-[#00f2ff26] transition-all z-10"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-[#00f2ff26] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)]">
          <div className="flex border-b border-[#00f2ff26] bg-[#181a2ccc]">
            {(['health', 'resources', 'logs', 'autonomy', 'service'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[8px] font-bold uppercase tracking-widest transition-all border-r border-[#00f2ff26] last:border-r-0 ${activeTab === tab ? 'bg-[#00f2ff] text-black' : 'hover:bg-white/5 opacity-60'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {activeTab === 'health' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <HeartPulse size={12} /> Execution Health
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Status</div>
                      <div className="text-xs font-bold text-[#1bf7cd]">{currentWorker.status.toUpperCase()}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Queue</div>
                      <div className="text-xs font-bold">{currentWorker.diagnostics.taskQueue}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Uptime</div>
                      <div className="text-xs font-bold">{formatUptime(Date.now() - currentWorker.diagnostics.uptime)}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Frequency</div>
                      <div className="text-xs font-bold">{currentWorker.diagnostics.runFrequency} c/min</div>
                    </div>
                  </div>
                </div>
                <div className="h-40 bg-black/40 rounded-lg border border-[#00f2ff1a] p-2 relative">
                  <div className="absolute top-2 left-2 text-[8px] opacity-40 uppercase">Cycle Flux</div>
                  <canvas ref={cyclesChartRef} />
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Resource Usage
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#06d6a0" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - currentWorker.load / 100)}`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-[#06d6a0]">{currentWorker.load}%</span>
                          <span className="text-[6px] opacity-40 uppercase">CPU</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#9854ff" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - currentWorker.memory / 256)}`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-[#9854ff]">{currentWorker.memory}MB</span>
                          <span className="text-[6px] opacity-40 uppercase">RAM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-40 bg-black/40 rounded-lg border border-[#00f2ff1a] p-2">
                  <canvas ref={resourceChartRef} />
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> System Logs
                </h3>
                <div className="space-y-3">
                  <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px]">
                    <div className="opacity-40 mb-1">LAST TASK LOG</div>
                    <div className="text-[#00f2ff]">{currentWorker.diagnostics.lastTaskLog}</div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px]">
                    <div className="opacity-40 mb-1">FAILED RUNS</div>
                    {currentWorker.diagnostics.failedRuns.length > 0 ? (
                      currentWorker.diagnostics.failedRuns.map((err: string, i: number) => (
                        <div key={i} className="text-[#ff2a6d]">{err}</div>
                      ))
                    ) : (
                      <div className="opacity-30">No recent failures</div>
                    )}
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px]">
                    <div className="opacity-40 mb-1">HANDLED AGENTS</div>
                    {currentWorker.diagnostics.handledAgents.map((agent: string, i: number) => (
                      <div key={i} className="text-[#1bf7cd] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#1bf7cd]" /> {agent} - Task Sync Complete
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'service' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Server size={12} /> Service Configuration
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Handshake Protocol</div>
                      <div className="text-[10px] font-mono text-[#00f2ff] break-all">{currentWorker.diagnostics.handshake}</div>
                    </div>
                    {currentWorker.port && (
                      <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                        <div className="text-[8px] opacity-40 uppercase mb-1">Service Port</div>
                        <div className="text-xs font-bold text-[#f7d31b]">{currentWorker.port}</div>
                      </div>
                    )}
                    {currentWorker.pm2Name && (
                      <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                        <div className="text-[8px] opacity-40 uppercase mb-1">PM2 Process Name</div>
                        <div className="text-xs font-bold text-[#9854ff]">{currentWorker.pm2Name}</div>
                      </div>
                    )}
                    {currentWorker.prefix && (
                      <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                        <div className="text-[8px] opacity-40 uppercase mb-1">Tool Prefix</div>
                        <div className="text-[10px] font-mono text-[#00f2ff]">{currentWorker.prefix}</div>
                      </div>
                    )}
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Health Check URL</div>
                      <div className="text-[10px] font-mono opacity-60 truncate">{currentWorker.diagnostics.healthEndpoint}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={12} /> Diagnostic Commands
                  </h3>
                  <div className="bg-black/60 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px] space-y-2">
                    <div className="text-white/40"># Check PM2 Status</div>
                    <div className="text-[#1bf7cd]">pm2 status {currentWorker.pm2Name || ''}</div>
                    <div className="text-white/40 mt-2"># Health Verification</div>
                    <div className="text-[#1bf7cd]">curl -H "x-neural-handshake: AGENT_LEE_SOVEREIGN_V1" {currentWorker.diagnostics.healthEndpoint}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

// --- MATRIX DASHBOARD ---
interface TaskStep {
  id: string;
  description: string;
  tools: string[];
  status: 'pending' | 'completed';
  timestamp?: string;
  explanation?: string;
}

interface MatrixTask {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  source: 'LLM' | 'AGENT' | 'WORKER' | 'MCP';
  completed: boolean;
  date: string;
  time: string;
  plan: TaskStep[];
}

const MatrixDashboard: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(window.innerWidth > 1024);
  const [rightOpen, setRightOpen] = useState(window.innerWidth > 1024);
  const [todos, setTodos] = useState<MatrixTask[]>([
    { 
      id: '1', 
      text: 'Diagnose failing LLM neural pathways', 
      priority: 'high', 
      source: 'LLM', 
      completed: false,
      date: '2026-03-29',
      time: '09:00',
      plan: [
        { id: 's1', description: 'Scan neural weights for anomalies', tools: ['NeuralScanner', 'WeightAnalyzer'], status: 'completed', timestamp: '09:05', explanation: 'Identified 3 nodes with drifting weights.' },
        { id: 's2', description: 'Re-calibrate attention heads', tools: ['HeadCalibrator'], status: 'pending' }
      ]
    },
    { 
      id: '2', 
      text: 'Verify agent plan integrity', 
      priority: 'medium', 
      source: 'AGENT', 
      completed: false,
      date: '2026-03-29',
      time: '09:15',
      plan: [
        { id: 's1', description: 'Cross-reference plan with safety protocols', tools: ['SafetyChecker'], status: 'pending' }
      ]
    },
    { 
      id: '3', 
      text: 'Cache vector store in memory', 
      priority: 'low', 
      source: 'WORKER', 
      completed: true,
      date: '2026-03-29',
      time: '08:30',
      plan: [
        { id: 's1', description: 'Initialize cache buffer', tools: ['MemManager'], status: 'completed', timestamp: '08:35', explanation: 'Buffer allocated successfully.' },
        { id: 's2', description: 'Stream vector data to RAM', tools: ['DataStreamer'], status: 'completed', timestamp: '08:45', explanation: '1.2GB of vectors cached.' }
      ]
    },
    { 
      id: '4', 
      text: 'Sync InsForge Bridge data', 
      priority: 'high', 
      source: 'MCP', 
      completed: false,
      date: '2026-03-29',
      time: '09:30',
      plan: [
        { id: 's1', description: 'Establish handshake with InsForge', tools: ['InsForgeBridge'], status: 'completed', timestamp: '09:32', explanation: 'Handshake AGENT_LEE_SOVEREIGN_V1 verified.' },
        { id: 's2', description: 'Pull latest database schema', tools: ['SQLTool'], status: 'pending' }
      ]
    }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedTask, setSelectedTask] = useState<MatrixTask | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notepadContent, setNotepadContent] = useState(`🔷 Agent Lee's Task Memory Core initialized.
🧠 Pentagon Brain Network: 5 nodes connected.
📡 TaskMemoryBus: Active and monitoring.
💓 Vital Signs: All systems nominal.
🔄 Task Flow: Processing 14 active tasks.
🧠 Memory: State retention at 99.4%.
📞 Communication: Message rate 34.2/min.
⚙️ Autonomy: Decision triggers functioning.
📡 Dependencies: 5/6 APIs synchronized.
🚀 Latency: Response time 84ms average.
🗃️ Database: Connection stable, backup current.
📝 Notepad: Mirror sync verified at 96%.`);

  const [syncStats, setSyncStats] = useState({
    connected: 5,
    lastSync: 'Now',
    mirror: 96
  });

  const p5ContainerRef = useRef<HTMLDivElement>(null);
  const diagnosticsChartRef = useRef<HTMLCanvasElement>(null);
  const taskAnalyticsChartRef = useRef<HTMLCanvasElement>(null);
  const memoryStreamChartRef = useRef<HTMLCanvasElement>(null);
  const taskWorkflowChartRef = useRef<HTMLCanvasElement>(null);
  const databaseHealthChartRef = useRef<HTMLCanvasElement>(null);

  const chartsRef = useRef<{ [key: string]: Chart | null }>({});

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // P5 Grid Background - Optimized for Raspberry Pi (Static or Simple)
    const sketch = (p: p5) => {
      const drawGrid = () => {
        p.clear(0, 0, 0, 0);
        const gridSize = 100; // Larger grid size
        
        p.stroke('rgba(0, 174, 255, 0.03)');
        p.strokeWeight(1);
        for (let x = 0; x <= p.width; x += gridSize) {
          p.line(x, 0, x, p.height);
        }
        for (let y = 0; y <= p.height; y += gridSize) {
          p.line(0, y, p.width, y);
        }
      };

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.position(0, 0);
        canvas.style('z-index', '-1');
        canvas.style('pointer-events', 'none');
        p.noLoop(); // Disable continuous draw loop for performance
        drawGrid();
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        drawGrid();
      };
    };

    const p5Instance = new p5(sketch, p5ContainerRef.current!);

    // Charts Initialization
    const initChart = (ref: React.RefObject<HTMLCanvasElement | null>, key: string, config: any) => {
      if (chartsRef.current[key]) chartsRef.current[key]?.destroy();
      if (ref.current) {
        chartsRef.current[key] = new Chart(ref.current, config);
      }
    };

    initChart(diagnosticsChartRef, 'diagnostics', {
      type: 'line',
      data: {
        labels: Array.from({length: 20}, (_, i) => i),
        datasets: [{
          label: 'System Health',
          data: Array.from({length: 20}, () => Math.random() * 40 + 60),
          borderColor: '#00eeff',
          backgroundColor: 'rgba(0, 238, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } },
        elements: { point: { radius: 0 } }
      }
    });

    initChart(taskAnalyticsChartRef, 'taskAnalytics', {
      type: 'bar',
      data: {
        labels: ['Queued', 'Processing', 'Complete', 'Failed'],
        datasets: [{
          data: [45, 123, 892, 12],
          backgroundColor: ['#f7d31b', '#00eeff', '#1bf7cd', '#f73a1b'],
          borderWidth: 0
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#aaf', font: { size: 8 } }, grid: { display: false } },
          y: { ticks: { color: '#aaf', font: { size: 8 } }, grid: { color: 'rgba(0, 174, 255, 0.1)' } }
        }
      }
    });

    initChart(memoryStreamChartRef, 'memoryStream', {
      type: 'line',
      data: {
        labels: Array.from({length: 50}, (_, i) => i),
        datasets: [{
          data: Array.from({length: 50}, () => Math.random() * 60 + 20),
          borderColor: '#1bf7cd',
          backgroundColor: 'rgba(27, 247, 205, 0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.6
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 } }
      }
    });

    initChart(taskWorkflowChartRef, 'taskWorkflow', {
      type: 'doughnut',
      data: {
        labels: ['LLM', 'Agents', 'Workers', 'Services'],
        datasets: [{
          data: [25, 35, 30, 10],
          backgroundColor: ['#f7d31b', '#00eeff', '#1bf7cd', '#f73a1b'],
          borderWidth: 0
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true,
            position: 'bottom',
            labels: { color: '#aaf', font: { size: 8 }, usePointStyle: true }
          }
        }
      }
    });

    initChart(databaseHealthChartRef, 'databaseHealth', {
      type: 'polarArea',
      data: {
        labels: ['Todo Tasks', 'Task History', 'Memory Cache', 'Log Storage'],
        datasets: [{
          data: [95, 87, 93, 89],
          backgroundColor: [
            'rgba(27, 247, 205, 0.7)',
            'rgba(0, 238, 255, 0.7)',
            'rgba(247, 211, 27, 0.7)',
            'rgba(247, 58, 27, 0.7)'
          ],
          borderWidth: 2,
          borderColor: '#00eeff'
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: true, position: 'bottom', labels: { color: '#aaf', font: { size: 8 } } }
        },
        scales: {
          r: {
            ticks: { color: '#aaf', font: { size: 8 }, backdropColor: 'transparent' },
            grid: { color: 'rgba(0, 174, 255, 0.1)' }
          }
        }
      }
    });

    return () => {
      p5Instance.remove();
      Object.values(chartsRef.current).forEach((chart: any) => chart?.destroy());
    };
  }, []);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const priorityLevels = ['high', 'medium', 'low'] as const;
    const sourceTypes = ['LLM', 'AGENT', 'WORKER', 'MCP'] as const;
    const now = new Date();
    const newTask: MatrixTask = {
      id: Date.now().toString(),
      text: newTodo,
      priority: priorityLevels[Math.floor(Math.random() * 3)],
      source: sourceTypes[Math.floor(Math.random() * 4)],
      completed: false,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plan: [
        { id: 's1', description: 'Initialize task processing', tools: ['CoreEngine'], status: 'pending' }
      ]
    };
    setTodos([newTask, ...todos]);
    setNewTodo('');
  };

  const updateTask = (updatedTask: MatrixTask) => {
    setTodos(todos.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  return (
    <div className="flex flex-col h-full bg-[#001529] text-[#aaf] font-['Inter'] p-4 md:p-6 gap-6 relative overflow-hidden">
      <div ref={p5ContainerRef} className="absolute inset-0 -z-10 pointer-events-none" />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#001e3c]/90 to-[#00325a]/90 border-2 border-[#00eeff] rounded-xl p-4 md:p-6 text-center shadow-[0_0_25px_rgba(0,238,255,0.3)] backdrop-blur-md relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00eeff1a] to-transparent -translate-x-full animate-[scanline_4s_linear_infinite]" />
        <h1 className="font-['Orbitron'] text-xl md:text-3xl font-black text-[#00eeff] drop-shadow-[0_0_15px_rgba(0,238,255,0.7)] tracking-widest uppercase mb-1">
          Agent Lee's Dynamic To-Do List
        </h1>
        <p className="text-[10px] md:text-sm text-[#3fd2f8] font-light tracking-[2px] uppercase">and Shared Notepad</p>
      </div>

      {/* Sidebar Toggle Buttons (Mobile & Desktop) */}
      <div className="flex justify-between items-center px-2 shrink-0">
        <button 
          onClick={() => setLeftOpen(!leftOpen)}
          className={`p-2 rounded-lg border transition-all ${leftOpen ? 'bg-[#00eeff22] border-[#00eeff]' : 'bg-black/40 border-white/10 opacity-50'}`}
          title="Toggle Diagnostics"
        >
          <Maximize2 size={16} className={leftOpen ? 'text-[#00eeff]' : 'text-white'} />
        </button>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">System Matrix Core</div>
        <button 
          onClick={() => setRightOpen(!rightOpen)}
          className={`p-2 rounded-lg border transition-all ${rightOpen ? 'bg-[#00eeff22] border-[#00eeff]' : 'bg-black/40 border-white/10 opacity-50'}`}
          title="Toggle Notepad"
        >
          <Maximize2 size={16} className={rightOpen ? 'text-[#00eeff]' : 'text-white'} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Diagnostics & Tasks */}
        <div className={`${leftOpen ? 'flex' : 'hidden'} flex-col gap-6 w-full lg:w-80 shrink-0 min-h-0 overflow-y-auto no-scrollbar`}>
          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col shrink-0 h-48">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Diagnostics Overview</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={diagnosticsChartRef} />
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Agent To-Do List Manager</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mb-3 min-h-[200px]">
              {todos.map(todo => (
                <div 
                  key={todo.id} 
                  onClick={() => setSelectedTask(todo)}
                  className={`flex items-center gap-3 bg-black/40 p-2 rounded border-l-4 transition-all hover:bg-black/60 cursor-pointer ${todo.priority === 'high' ? 'border-[#f73a1b]' : todo.priority === 'medium' ? 'border-[#f7d31b]' : 'border-[#1bf7cd]'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={todo.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
                    }}
                    className="w-4 h-4 rounded border-[#0af] bg-transparent text-[#1bf7cd] focus:ring-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${todo.completed ? 'line-through opacity-40' : ''}`}>{todo.text}</div>
                    <div className="text-[8px] opacity-50">{todo.date} {todo.time}</div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full ${todo.source === 'LLM' ? 'bg-[#f7d31b33] text-[#f7d31b]' : todo.source === 'AGENT' ? 'bg-[#00eeff33] text-[#00eeff]' : todo.source === 'MCP' ? 'bg-[#9854ff33] text-[#9854ff]' : 'bg-[#1bf7cd33] text-[#1bf7cd]'}`}>
                    {todo.source}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add new task..."
                className="flex-1 bg-black/40 border border-[#0af] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#00eeff]"
              />
              <button onClick={addTodo} className="bg-[#00eeff] text-[#001529] px-3 py-1.5 rounded font-bold text-lg hover:bg-[#0af] transition-all">+</button>
            </div>
          </div>
        </div>

        {/* Center Column: Neural Core */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 font-['Orbitron'] text-5xl font-black text-[#00eeff] drop-shadow-[0_0_15px_rgba(0,238,255,0.7)] flex items-center justify-center">LLM</div>
              <svg className="w-full h-full absolute inset-0 filter drop-shadow-[0_0_10px_#00eeff]">
                <path d="M60,50 C30,30 10,60 20,90 C25,110 45,120 70,115 C90,125 120,120 140,110 C160,125 190,120 200,100 C210,80 190,50 170,40 C150,20 130,25 110,35 C90,25 70,30 60,50 Z" stroke="#0af" strokeWidth="2" fill="none" />
              </svg>
            </div>
            
            <div className="mt-12 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
              {['AI AGENTS', 'MCP SERVICES', 'LLM NODES', 'SPECIALIZED'].map((title, i) => (
                <div key={title} className="bg-gradient-to-b from-[#002c56] to-[#001529] border border-[#0af] rounded-lg p-3 flex flex-col items-center gap-2 transform hover:scale-105 transition-all">
                  <div className="text-[8px] font-bold text-[#00eeff] text-center leading-tight">{title}</div>
                  <div className="text-xl font-bold">{[125, 13, 5, 15][i]}</div>
                  <div className="grid grid-cols-4 gap-1 w-full">
                    {Array.from({length: 12}).map((_, j) => (
                      <div key={j} className={`h-1.5 rounded-sm border border-[#0af] ${Math.random() > 0.4 ? 'bg-[#00eeff] shadow-[0_0_5px_#00eeff]' : 'bg-[#0af2]'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] h-64 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Database Health & To-Do Tasks</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="h-full pb-8">
              <canvas ref={databaseHealthChartRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Memory & Notepad */}
        <div className={`${rightOpen ? 'flex' : 'hidden'} flex-col gap-6 w-full lg:w-80 shrink-0 min-h-0 overflow-y-auto no-scrollbar`}>
          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col h-48 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Memory Stream</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={memoryStreamChartRef} />
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col h-48 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Task Workflow</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={taskWorkflowChartRef} />
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Shared Notepad & Database Sync</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <textarea 
              value={notepadContent}
              onChange={(e) => setNotepadContent(e.target.value)}
              className="flex-1 bg-black/40 border border-[#0af] rounded p-3 font-mono text-[10px] resize-none focus:outline-none focus:border-[#00eeff] custom-scrollbar min-h-[150px]"
              placeholder="Agent Lee is listening..."
            />
            <div className="flex justify-between mt-3 text-[8px] opacity-70">
              <div className="flex items-center gap-1">📡 Connected: <span className="text-[#00eeff]">{syncStats.connected}/5</span></div>
              <div className="flex items-center gap-1">🔄 Last Sync: <span className="text-[#00eeff]">{syncStats.lastSync}</span></div>
              <div className="flex items-center gap-1">💾 DB Mirror: <span className="text-[#00eeff]">{syncStats.mirror}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#001e3c]/80 border border-[#0af] rounded-full px-4 md:px-6 py-2 flex flex-wrap items-center justify-center gap-3 md:gap-6 backdrop-blur-md self-center mb-4 shadow-[0_0_20px_rgba(0,174,255,0.3)] shrink-0">
        <select className="bg-transparent text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-2 md:px-3 py-1 focus:outline-none">
          <option value="all">All Components</option>
          <option value="ai-agents">Active AI Agents</option>
        </select>
        <button className="text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-3 md:px-4 py-1 hover:bg-[#0af2] transition-all">Enable Zoom</button>
        <select className="bg-transparent text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-2 md:px-3 py-1 focus:outline-none">
          <option value="1">Playback: 1x</option>
          <option value="5">Playback: 5x</option>
        </select>
        <button className="text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-3 md:px-4 py-1 hover:bg-[#0af2] transition-all whitespace-nowrap">↻ Replay Last 10 Min</button>
      </div>
      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#001e3c] border-2 border-[#00eeff] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,238,255,0.3)] overflow-hidden">
            <div className="p-4 border-b border-[#00eeff22] flex justify-between items-center bg-gradient-to-r from-[#00eeff11] to-transparent">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${selectedTask.priority === 'high' ? 'bg-[#f73a1b]' : selectedTask.priority === 'medium' ? 'bg-[#f7d31b]' : 'bg-[#1bf7cd]'}`} />
                <h2 className="font-['Orbitron'] text-sm font-bold text-[#00eeff] uppercase tracking-widest">Task Intelligence Core</h2>
              </div>
              <button onClick={() => { setSelectedTask(null); setIsEditing(false); }} className="text-[#aaf] hover:text-white transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Task Header Info */}
              <div className="space-y-4">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={selectedTask.text}
                    onChange={(e) => updateTask({ ...selectedTask, text: e.target.value })}
                    className="w-full bg-black/40 border border-[#00eeff] rounded px-4 py-2 text-lg font-bold text-white focus:outline-none"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-white">{selectedTask.text}</h3>
                )}
                
                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest font-bold">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#00eeff22]">
                    <span className="opacity-50 text-[#aaf]">Source:</span>
                    <span className="text-[#00eeff]">{selectedTask.source}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#00eeff22]">
                    <span className="opacity-50 text-[#aaf]">Priority:</span>
                    <span className={selectedTask.priority === 'high' ? 'text-[#f73a1b]' : selectedTask.priority === 'medium' ? 'text-[#f7d31b]' : 'text-[#1bf7cd]'}>{selectedTask.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#00eeff22]">
                    <span className="opacity-50 text-[#aaf]">Created:</span>
                    <span className="text-white">{selectedTask.date} {selectedTask.time}</span>
                  </div>
                </div>
              </div>

              {/* Plan Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Strategic Plan Breakdown</h4>
                  <button 
                    onClick={() => {
                      const newStep: TaskStep = { id: Date.now().toString(), description: 'New step...', tools: [], status: 'pending' };
                      updateTask({ ...selectedTask, plan: [...selectedTask.plan, newStep] });
                      setIsEditing(true);
                    }}
                    className="text-[10px] bg-[#00eeff22] text-[#00eeff] px-3 py-1 rounded border border-[#00eeff] hover:bg-[#00eeff44] transition-all"
                  >
                    + Add Step
                  </button>
                </div>
                
                <div className="space-y-4">
                  {selectedTask.plan.map((step, idx) => (
                    <div key={step.id} className="relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-[#00eeff22]">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step.status === 'completed' ? 'bg-[#1bf7cd] border-[#1bf7cd] text-black' : 'bg-[#001e3c] border-[#00eeff] text-[#00eeff]'}`}>
                        {step.status === 'completed' ? '✓' : idx + 1}
                      </div>
                      
                      <div className="bg-black/40 border border-[#00eeff11] rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          {isEditing ? (
                            <textarea 
                              value={step.description}
                              onChange={(e) => {
                                const newPlan = [...selectedTask.plan];
                                newPlan[idx].description = e.target.value;
                                updateTask({ ...selectedTask, plan: newPlan });
                              }}
                              className="flex-1 bg-transparent border-b border-[#00eeff22] text-sm text-white focus:outline-none focus:border-[#00eeff] resize-none"
                            />
                          ) : (
                            <p className={`text-sm ${step.status === 'completed' ? 'text-white/60 line-through' : 'text-white'}`}>{step.description}</p>
                          )}
                          <div className="flex gap-2 ml-4">
                            <button 
                              onClick={() => {
                                const newPlan = [...selectedTask.plan];
                                newPlan[idx].status = newPlan[idx].status === 'completed' ? 'pending' : 'completed';
                                if (newPlan[idx].status === 'completed') {
                                  newPlan[idx].timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  newPlan[idx].explanation = 'Task step completed by Agent Lee.';
                                }
                                updateTask({ ...selectedTask, plan: newPlan });
                              }}
                              className={`text-[8px] px-2 py-1 rounded border transition-all ${step.status === 'completed' ? 'bg-[#1bf7cd33] border-[#1bf7cd] text-[#1bf7cd]' : 'bg-black/40 border-white/20 text-white/40 hover:border-[#00eeff] hover:text-[#00eeff]'}`}
                            >
                              {step.status === 'completed' ? 'COMPLETED' : 'MARK DONE'}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {step.tools.map(tool => (
                            <span key={tool} className="text-[8px] bg-[#00eeff11] text-[#00eeff] px-2 py-0.5 rounded border border-[#00eeff22] flex items-center gap-1">
                              <Zap size={8} /> {tool}
                            </span>
                          ))}
                          {isEditing && (
                            <button 
                              onClick={() => {
                                const tool = prompt('Enter tool name:');
                                if (tool) {
                                  const newPlan = [...selectedTask.plan];
                                  newPlan[idx].tools = [...newPlan[idx].tools, tool];
                                  updateTask({ ...selectedTask, plan: newPlan });
                                }
                              }}
                              className="text-[8px] border border-dashed border-[#00eeff44] text-[#00eeff44] px-2 py-0.5 rounded hover:border-[#00eeff] hover:text-[#00eeff] transition-all"
                            >
                              + Tool
                            </button>
                          )}
                        </div>

                        {step.status === 'completed' && (
                          <div className="pt-2 border-t border-[#00eeff11] flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[8px] font-bold text-[#1bf7cd] uppercase tracking-widest">
                              <CheckCircle2 size={10} /> Accomplished at {step.timestamp}
                            </div>
                            <p className="text-[10px] text-white/50 italic leading-relaxed">"{step.explanation}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#00eeff22] bg-black/40 flex justify-between items-center">
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    setTodos(todos.filter(t => t.id !== selectedTask.id));
                    setSelectedTask(null);
                  }
                }}
                className="text-[10px] text-[#f73a1b] hover:underline uppercase tracking-widest font-bold"
              >
                Terminate Task
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 rounded-full border font-bold text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-[#1bf7cd33] border-[#1bf7cd] text-[#1bf7cd]' : 'border-[#00eeff] text-[#00eeff] hover:bg-[#00eeff22]'}`}
                >
                  {isEditing ? 'LOCK CHANGES' : 'EDIT INTELLIGENCE'}
                </button>
                <button 
                  onClick={() => { setSelectedTask(null); setIsEditing(false); }}
                  className="px-8 py-2 rounded-full bg-[#00eeff] text-[#001529] font-bold text-[10px] uppercase tracking-widest hover:bg-[#0af] transition-all shadow-[0_0_15px_rgba(0,238,255,0.5)]"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Diagnostics() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [autoOpt, setAutoOpt] = useState(true);
  const [androidCompat, setAndroidCompat] = useState(true);
  const [memoryLog, setMemoryLog] = useState(false);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [expandedRightSections, setExpandedRightSections] = useState<string[]>(['logs', 'datacore', 'agents']);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean; source: string }[]>([
    { id: '1', text: 'Calibrate neural pathways', completed: false, source: 'LLM' },
    { id: '2', text: 'Sync memory buffers', completed: true, source: 'AGENT' },
    { id: '3', text: 'Check system vitals', completed: false, source: 'USER' }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [notes, setNotes] = useState('System is running at peak efficiency. All neural pathways are clear.');
  const [telemetry, setTelemetry] = useState({
    cpuCores: Array.from({ length: 8 }, (_, i) => ({ name: `C${i}`, temp: 40 + Math.random() * 20 })),
    battery: { current: -450, voltage: 3.8, cycles: 142, level: 85 },
    storage: { read: 120, write: 45 },
    hinge: 180,
    gyro: { x: 0, y: 0, z: 0 },
    network: { rsrp: -95, rsrq: -12, latency: 45 },
    inference: { latency: 120, tokens: 45, drift: 0.12 },
    security: { handshakes: 99.8, violations: 0, quarantine: 0 },
    memory: { retrieval: 12, mcpLatency: 25 },
    agentDb: {
      health: 99.9,
      latency: 12,
      throughput: 850,
      readRate: 1200,
      writeRate: 450,
      transferRate: 320,
      processRate: 150,
      uptime: '142d 06h 24m',
      connections: 12,
      history: Array.from({ length: 20 }, (_, i) => ({ time: i, latency: 10 + Math.random() * 5, throughput: 800 + Math.random() * 100 }))
    },
    persona: [
      { subject: 'Professional', A: 120, fullMark: 150 },
      { subject: 'Rhythmic', A: 98, fullMark: 150 },
      { subject: 'Technical', A: 86, fullMark: 150 },
      { subject: 'Direct', A: 99, fullMark: 150 },
      { subject: 'Sovereign', A: 85, fullMark: 150 },
    ]
  });

  const toggleRightSection = (section: string) => {
    setExpandedRightSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const [logs, setLogs] = useState<{ time: string; message: string; type: 'info' | 'warn' | 'error' | 'success' }[]>([
    { time: '06:24:15', message: 'NOMINAL: System integrity verified', type: 'success' },
    { time: '06:24:16', message: 'LINK: GLM 4.7 Flash synchronized', type: 'info' },
    { time: '06:24:17', message: 'LINK: GLM 4.6V Flash synchronized', type: 'info' },
    { time: '06:24:18', message: 'LINK: Llama 3 (Local) synchronized', type: 'info' },
    { time: '06:24:19', message: 'LINK: Notebook LM synchronized', type: 'info' },
    { time: '06:24:20', message: 'LINK: Qwen 2.5 (Local) synchronized', type: 'info' },
    { time: '06:24:21', message: 'DATA: Vector pipeline active', type: 'success' }
  ]);
  const [metrics, setMetrics] = useState({ agents: 110, workers: 255, queue: 47, memory: 94, cpu: 65, latency: 42, tokens: 1240 });
  const [isAZRActive, setIsAZRActive] = useState(false);
  const [signalData, setSignalData] = useState<{ value: number }[]>(Array.from({ length: 30 }, () => ({ value: Math.random() * 100 })));
  const diagnosticsCursorRef = useRef<string>('');

  // ── Governance Verification state ─────────────────────────────
  const [verifyRunning, setVerifyRunning] = useState(false);
  const [verifyVerdict, setVerifyVerdict] = useState<GovernanceVerdict | null>(null);
  const [verifyScenarios, setVerifyScenarios] = useState<ScenarioResult[]>([]);

  const logActivity = (message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), message, type }, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    pushDiagnosticsReport({
      surface: 'diagnostics',
      status: 'ok',
      message: 'Diagnostics brain active and synchronized.',
      agents: ['Shield', 'AgentLee'],
      mcps: ['health-agent-mcp', 'agent-registry-mcp', 'memory-agent-mcp'],
      tags: ['department:diagnostics', 'subsurface:brain', 'contract:strict']
    });
  }, []);

  useEffect(() => {
    const syncReports = () => {
      const reports = readDiagnosticsReports();
      if (reports.length === 0) return;
      const latest = reports[0];
      if (latest.id === diagnosticsCursorRef.current) return;
      diagnosticsCursorRef.current = latest.id;
      const mapType = latest.status === 'error' ? 'error' : latest.status === 'warn' ? 'warn' : 'info';
      logActivity(`[${latest.surface}] ${latest.message}`, mapType);
    };

    syncReports();
    const interval = setInterval(syncReports, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        agents: Math.max(100, prev.agents + Math.floor(Math.random() * 5) - 2),
        workers: Math.max(200, prev.workers + Math.floor(Math.random() * 10) - 5),
        queue: Math.max(0, prev.queue + Math.floor(Math.random() * 10) - 5),
        memory: Math.max(70, Math.min(99, prev.memory + Math.floor(Math.random() * 3) - 1)),
        cpu: Math.max(40, Math.min(95, prev.cpu + Math.floor(Math.random() * 10) - 5)),
        latency: Math.max(20, Math.min(100, prev.latency + Math.floor(Math.random() * 10) - 5)),
        tokens: prev.tokens + Math.floor(Math.random() * 50)
      }));

      setSignalData(prev => [...prev.slice(1), { value: Math.random() * 100 }]);

      setTelemetry(prev => ({
        ...prev,
        cpuCores: prev.cpuCores.map(c => ({ ...c, temp: Math.max(30, Math.min(90, c.temp + (Math.random() * 4 - 2))) })),
        battery: { ...prev.battery, current: -400 + Math.random() * 100 },
        storage: { read: Math.random() * 200, write: Math.random() * 100 },
        gyro: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1 },
        network: { ...prev.network, latency: 30 + Math.random() * 30 },
        inference: { ...prev.inference, latency: 100 + Math.random() * 50, tokens: 30 + Math.random() * 20 },
        agentDb: {
          ...prev.agentDb,
          latency: Math.max(0.4, Math.min(1.5, prev.agentDb.latency + (Math.random() * 0.2 - 0.1))),
          throughput: Math.max(800, Math.min(1500, prev.agentDb.throughput + (Math.random() * 100 - 50))),
          readRate: Math.max(800, Math.min(1200, prev.agentDb.readRate + (Math.random() * 40 - 20))),
          writeRate: Math.max(300, Math.min(600, prev.agentDb.writeRate + (Math.random() * 20 - 10))),
          transferRate: Math.max(100, Math.min(400, prev.agentDb.transferRate + (Math.random() * 10 - 5))),
          processRate: Math.max(4000, Math.min(6000, prev.agentDb.processRate + (Math.random() * 200 - 100))),
          history: [...prev.agentDb.history.slice(1), { 
            time: Date.now(), 
            latency: Math.max(0.4, Math.min(1.5, prev.agentDb.latency + (Math.random() * 0.2 - 0.1))), 
            throughput: Math.max(800, Math.min(1500, prev.agentDb.throughput + (Math.random() * 100 - 50))) 
          }]
        }
      }));

      if (Math.random() > 0.7) {
        const activities: { msg: string; type: 'info' | 'warn' | 'error' | 'success' }[] = [
          { msg: 'Neural pathway optimized', type: 'success' },
          { msg: 'Memory sync completed', type: 'success' },
          { msg: 'Agent task redistributed', type: 'info' },
          { msg: 'Worker health check passed', type: 'info' },
          { msg: 'Database backup verified', type: 'success' },
          { msg: 'Minor latency spike detected', type: 'warn' },
          { msg: 'Gemini 3.1 Pro token usage high', type: 'warn' },
          { msg: 'Llama 3 local inference stable', type: 'success' },
          { msg: 'Mistral local context window full', type: 'warn' },
          { msg: 'Qwen 2.5 local weights optimized', type: 'success' }
        ];
        const act = activities[Math.floor(Math.random() * activities.length)];
        logActivity(act.msg, act.type);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const telemetryData = [
    { name: 'Agents', value: metrics.agents, color: '#ff2a6d' },
    { name: 'Latency', value: metrics.latency, color: '#f7d31b' },
    { name: 'Load', value: metrics.cpu, color: '#1bf7cd' },
    { name: 'Memory', value: metrics.memory, color: '#9854ff' }
  ];

  const resourceData = [
    { name: 'CPU', value: metrics.cpu, fill: '#00f2ff' },
    { name: 'RAM', value: metrics.memory, fill: '#9854ff' },
    { name: 'GPU', value: 45, fill: '#ff2a6d' },
    { name: 'NET', value: metrics.latency, fill: '#1bf7cd' }
  ];

  useEffect(() => {
    const diagnosticSnapshot = {
      updatedAt: new Date().toISOString(),
      selectedRegion,
      logsCount: logs.length,
      metrics,
      agentDb: {
        health: telemetry.agentDb.health,
        latency: telemetry.agentDb.latency,
        throughput: telemetry.agentDb.throughput,
        readRate: telemetry.agentDb.readRate,
        writeRate: telemetry.agentDb.writeRate,
        connections: telemetry.agentDb.connections,
        uptime: telemetry.agentDb.uptime
      }
    };

    localStorage.setItem('agent_lee_diagnostics_snapshot', JSON.stringify(diagnosticSnapshot));
  }, [telemetry.agentDb, metrics, logs.length, selectedRegion]);

  // ── Verification Corps EventBus wiring ────────────────────────
  useEffect(() => {
    const unsubStart = eventBus.on('verification:start', ({ mission_id }) => {
      setVerifyRunning(true);
      logActivity(`[MarshalVerify] Mission ${mission_id} started`, 'info');
    });
    const unsubResult = eventBus.on('verification:result', ({ verdict, scenarios }) => {
      setVerifyRunning(false);
      setVerifyVerdict(verdict);
      setVerifyScenarios(scenarios);
      const t = verdict.status === 'PASS' ? 'success' : verdict.status === 'FAIL' ? 'error' : 'warn';
      logActivity(`[MarshalVerify] ${verdict.status} | Confidence: ${(verdict.confidence * 100).toFixed(0)}%`, t);
    });
    return () => { unsubStart(); unsubResult(); };
  }, []);

  const selectedRegionProfile = useMemo(
    () => (selectedRegion ? regionIntel[selectedRegion] : null),
    [selectedRegion]
  );

  const atlasCards = useMemo(
    () => regionGroups.map(group => ({
      ...group,
      nodes: regionConfig.filter(region => regionIntel[region.id]?.category === group.id)
    })),
    []
  );

  return (
    <div className="h-full bg-[#030410] text-[#e0e7ff] font-['Inter'] relative overflow-x-hidden lg:overflow-hidden flex flex-col">
      {/* Background Grid - Simplified */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40 -z-10"></div>
      
      {/* Header */}
      <header className="w-full bg-[#0a0e29cc] border-b border-[#00f2ff26] p-2 md:p-4 backdrop-blur-md z-50 flex justify-between items-center shadow-[0_0_30px_rgba(0,242,255,0.1)]">
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-[#00f2ff] to-[#9854ff] rounded-lg flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <h1 className="font-['Orbitron'] text-[10px] md:text-xl font-bold tracking-tighter text-[#00f2ff]">
              Agent -Lee Neural-Diagnostic-Center
            </h1>
            <div className="text-[7px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Neural Matrix v2026.03</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[9px] text-gray-500 uppercase font-bold">Status</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1bf7cd] shadow-[0_0_8px_#1bf7cd] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#1bf7cd]">NOMINAL</span>
            </div>
          </div>
          <button onClick={() => setActiveModal('settings')} className="animated-border p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Cog size={18} className="text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* Mobile Backdrop Left */}
        {isLeftSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" 
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar: Advanced Diagnostics & Telemetry */}
        <aside className={`fixed inset-y-0 left-0 z-[9999] w-full bg-[#0a0e29f8] border-r border-[#00f2ff1a] flex flex-col shrink-0 p-4 md:p-8 gap-6 no-scrollbar overflow-y-auto transition-transform duration-500 ease-in-out transform ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Close tab — right edge of left panel, near top */}
          <button
            onClick={() => setIsLeftSidebarOpen(false)}
            className="absolute top-8 -right-4 w-8 h-14 bg-[#0a0e29f8] border border-[#00f2ff33] border-l-0 rounded-r-2xl flex items-center justify-center text-[#00f2ff] hover:bg-[#00f2ff15] transition-all z-10"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-[#00f2ff]" />
            <h2 className="font-['Orbitron'] text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Health</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Section: Vessel Vitals */}
            <button 
              onClick={() => setActiveModal('vitals')}
              className="w-full py-2.5 bg-gradient-to-r from-[#00f2ff22] to-[#00f2ff44] border border-[#00f2ff44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#00f2ff33] transition-all group"
            >
              <Cpu className="text-[#00f2ff] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">System Health</span>
            </button>

            {/* Section: Sensory Streams */}
            <button 
              onClick={() => setActiveModal('sensory')}
              className="w-full py-2.5 bg-gradient-to-r from-[#ff2a6d22] to-[#ff2a6d44] border border-[#ff2a6d44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#ff2a6d33] transition-all group"
            >
              <Zap className="text-[#ff2a6d] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Sensory Streams</span>
            </button>

            {/* Section: Network Integrity */}
            <button 
              onClick={() => setActiveModal('network')}
              className="w-full py-2.5 bg-gradient-to-r from-[#1bf7cd22] to-[#1bf7cd44] border border-[#1bf7cd44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#1bf7cd33] transition-all group"
            >
              <Network className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Network Integrity</span>
            </button>

            {/* Section: Mind Inference */}
            <button 
              onClick={() => setActiveModal('mind')}
              className="w-full py-2.5 bg-gradient-to-r from-[#9854ff22] to-[#9854ff44] border border-[#9854ff44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#9854ff33] transition-all group"
            >
              <Brain className="text-[#9854ff] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Mind Inference</span>
            </button>

            {/* Section: Security & Sovereignty */}
            <button 
              onClick={() => setActiveModal('security')}
              className="w-full py-2.5 bg-gradient-to-r from-[#1bf7cd22] to-[#1bf7cd44] border border-[#1bf7cd44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#1bf7cd33] transition-all group"
            >
              <UserCog className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Safety & Security</span>
            </button>

            {/* Section: Memory & Tooling */}
            <button 
              onClick={() => setActiveModal('tooling')}
              className="w-full py-2.5 bg-gradient-to-r from-[#00f2ff22] to-[#00f2ff44] border border-[#00f2ff44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#00f2ff33] transition-all group"
            >
              <Database className="text-[#00f2ff] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Memory & Tooling</span>
            </button>

            {/* Section: Signal Waves */}
            <button 
              onClick={() => setActiveModal('spectral')}
              className="w-full py-2.5 bg-gradient-to-r from-[#f7d31b22] to-[#f7d31b44] border border-[#f7d31b44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#f7d31b33] transition-all group"
            >
              <LineChart className="text-[#f7d31b] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Signal Waves</span>
            </button>

            {/* Section: Stability */}
            <button 
              onClick={() => setActiveModal('quantum')}
              className="w-full py-2.5 bg-gradient-to-r from-[#1bf7cd22] to-[#1bf7cd44] border border-[#1bf7cd44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#1bf7cd33] transition-all group"
            >
              <Zap className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Quantum Balance</span>
            </button>
          </div>
        </aside>

        {/* Center: 3D Brain Visualization */}
        <main className="flex-1 relative flex flex-col bg-gradient-to-b from-transparent to-[#00f2ff05] overflow-hidden min-h-0">
          {/* Left panel tab — near top of left edge */}
          <button
            onClick={() => setIsLeftSidebarOpen(v => !v)}
            className="fixed left-0 top-32 z-[10001] w-9 h-14 bg-black/50 backdrop-blur-md border border-[#00f2ff33] border-l-0 rounded-r-2xl flex items-center justify-center text-[#00f2ff] hover:bg-[#00f2ff15] hover:border-[#00f2ff66] transition-all shadow-[2px_0_20px_rgba(0,242,255,0.2)] group"
            title={isLeftSidebarOpen ? 'Close diagnostics' : 'Open diagnostics'}
          >
            {isLeftSidebarOpen
              ? <ChevronLeft size={18} className="group-hover:scale-110 transition-transform" />
              : <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />}
          </button>

          {/* Right panel tab — center of right edge */}
          <button
            onClick={() => setIsRightSidebarOpen(v => !v)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[10001] w-9 h-14 bg-black/50 backdrop-blur-md border border-[#ff2a6d33] border-r-0 rounded-l-2xl flex items-center justify-center text-[#ff2a6d] hover:bg-[#ff2a6d15] hover:border-[#ff2a6d66] transition-all shadow-[-2px_0_20px_rgba(255,42,109,0.2)] group"
            title={isRightSidebarOpen ? 'Close control' : 'Open control'}
          >
            {isRightSidebarOpen
              ? <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />
              : <ChevronLeft size={18} className="group-hover:scale-110 transition-transform" />}
          </button>

          <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-0">
            <BrainVisualization 
              onRegionClick={(id) => {
                setSelectedRegion(id);
              }} 
              autoRotate={!selectedRegion} 
              selectedRegionId={selectedRegion}
              isLeftSidebarOpen={isLeftSidebarOpen}
              isRightSidebarOpen={isRightSidebarOpen}
            />



            {/* Quick Diagnostic Overlay */}
            {selectedRegion && (
              <div className="absolute z-30 w-72 bg-[#050a15cc] backdrop-blur-md border border-[#00f2ff33] rounded-2xl p-4 shadow-[0_0_30px_rgba(0,242,255,0.2)] animated-border pointer-events-auto pointer-events-auto" style={{ top: '10%', right: '5%' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Quick Diagnostic
                  </h3>
                  <button onClick={() => setSelectedRegion(null)} className="text-gray-500 hover:text-[#ff2a6d]">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] text-gray-500 uppercase font-bold">Target Node</div>
                      <div className="text-sm font-bold text-white uppercase">{selectedRegionProfile?.title || selectedRegion.replace(/-/g, ' ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-gray-500 uppercase font-bold">Status</div>
                      <div className={`text-[10px] font-bold uppercase tracking-tighter ${selectedRegionProfile?.status === 'watch' ? 'text-[#f7d31b]' : 'text-[#1bf7cd]'}`}>
                        {selectedRegionProfile?.status === 'watch' ? 'Watch' : 'Operational'}
                      </div>
                    </div>
                  </div>

                  {selectedRegionProfile && (
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-[#00f2ff14] border border-[#00f2ff33] text-[8px] font-bold text-[#00f2ff] uppercase tracking-widest">
                          {selectedRegionProfile.layer}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                          {selectedRegionProfile.route}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        {selectedRegionProfile.summary}
                      </div>
                    </div>
                  )}

                  <div className="h-24 w-full bg-black/40 rounded-lg border border-white/5 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedRegion === 'agent-db' ? telemetry.agentDb.history : Array.from({ length: 10 }, (_, i) => ({ time: i, latency: 0, throughput: 40 + Math.random() * 40 }))}>
                        <Area type="monotone" dataKey="throughput" stroke="#00f2ff" fill="#00f2ff33" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <div className="text-[7px] text-gray-500 uppercase font-bold">Latency</div>
                      <div className="text-xs font-bold text-[#9854ff]">
                        {selectedRegion === 'agent-db' ? `${telemetry.agentDb.latency.toFixed(1)}ms` : `${(10 + Math.random() * 20).toFixed(1)}ms`}
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <div className="text-[7px] text-gray-500 uppercase font-bold">Load</div>
                      <div className="text-xs font-bold text-[#ff2a6d]">
                        {selectedRegion === 'agent-db' ? `${(telemetry.agentDb.throughput / 10).toFixed(1)}%` : `${(40 + Math.random() * 30).toFixed(1)}%`}
                      </div>
                    </div>
                  </div>

                  {selectedRegionProfile && (
                    <>
                      <div className="space-y-2">
                        <div className="text-[8px] text-gray-500 uppercase font-bold">Monitoring Cues</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRegionProfile.monitors.map(item => (
                            <span key={item} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-slate-300 uppercase tracking-wide">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-[#9854ff26] bg-[#9854ff0d] p-2">
                          <div className="text-[7px] text-slate-500 uppercase font-bold mb-1">Linked Agents</div>
                          <div className="text-[10px] text-white leading-relaxed">{selectedRegionProfile.agents.join(', ')}</div>
                        </div>
                        <div className="rounded-lg border border-[#1bf7cd26] bg-[#1bf7cd0d] p-2">
                          <div className="text-[7px] text-slate-500 uppercase font-bold mb-1">MCP Surfaces</div>
                          <div className="text-[10px] text-white leading-relaxed">{selectedRegionProfile.mcps.join(', ')}</div>
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    onClick={() => {
                      if (selectedRegion.startsWith('workers-')) {
                        setActiveModal('workers');
                      } else {
                        setActiveModal(selectedRegion);
                      }
                      setSelectedRegion(null);
                    }}
                    className="w-full py-2 bg-[#00f2ff22] border border-[#00f2ff] rounded-lg text-[9px] font-bold text-[#00f2ff] uppercase hover:bg-[#00f2ff] hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <Maximize2 size={12} /> Expand Full Diagnostics
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Backdrop Right */}
        {isRightSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" 
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}

        {/* Right Sidebar: System Logs & Status */}
        <aside className={`fixed inset-y-0 right-0 z-[9999] w-full bg-[#0a0e29f8] border-l border-[#00f2ff1a] flex flex-col shrink-0 p-4 md:p-8 gap-6 no-scrollbar overflow-y-auto transition-transform duration-500 ease-in-out transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Close tab — left edge of right panel, center */}
          <button
            onClick={() => setIsRightSidebarOpen(false)}
            className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-14 bg-[#0a0e29f8] border border-[#ff2a6d33] border-r-0 rounded-l-2xl flex items-center justify-center text-[#ff2a6d] hover:bg-[#ff2a6d15] transition-all z-10"
          >
            <ChevronRight size={16} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Terminal size={16} className="text-[#ff2a6d]" />
            <h2 className="font-['Orbitron'] text-xs font-bold text-white uppercase tracking-widest">System Control</h2>
          </div>

          {/* Section: Logs */}
          <button 
            onClick={() => setActiveModal('logs')}
            className="w-full py-4 bg-gradient-to-r from-[#ff2a6d22] to-[#ff2a6d44] border border-[#ff2a6d44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#ff2a6d33] transition-all group"
          >
            <Terminal className="text-[#ff2a6d] group-hover:scale-110 transition-transform" size={24} />
            <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">Logs</span>
          </button>

          {/* Core Module Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => setActiveModal('workers')}
              className="w-full py-4 bg-gradient-to-r from-[#00f2ff22] to-[#9854ff22] border border-[#00f2ff44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#00f2ff33] transition-all group"
            >
              <Cpu className="text-[#00f2ff] group-hover:scale-110 transition-transform" size={24} />
              <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">mcp agents</span>
            </button>

            <button 
              onClick={() => setActiveModal('matrix')}
              className="w-full py-4 bg-gradient-to-r from-[#1bf7cd22] to-[#00f2ff22] border border-[#1bf7cd44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#1bf7cd33] transition-all group"
            >
              <ListTodo className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={24} />
              <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">to-do-list</span>
            </button>
          </div>

          {/* Section: Agents */}
          <button 
            onClick={() => setActiveModal('agents')}
            className="w-full py-4 bg-gradient-to-r from-[#ff2a6d22] to-[#ff2a6d44] border border-[#ff2a6d44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#ff2a6d33] transition-all group mb-4"
          >
            <UserCog className="text-[#ff2a6d] group-hover:scale-110 transition-transform" size={24} />
            <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">Agents</span>
          </button>

          {/* Section: Governance Verify */}
          <button
            onClick={() => setActiveModal('verify')}
            className={`w-full py-4 bg-gradient-to-r from-[#7C3AED22] to-[#7C3AED44] border rounded-xl flex flex-col items-center justify-center gap-2 transition-all group mb-4 ${verifyRunning ? 'border-[#7C3AED] animate-pulse' : 'border-[#7C3AED44] hover:bg-[#7C3AED33]'}`}
          >
            <ShieldCheck className={`group-hover:scale-110 transition-transform ${verifyVerdict?.status === 'PASS' ? 'text-[#1bf7cd]' : verifyVerdict?.status === 'FAIL' ? 'text-[#ff2a6d]' : verifyRunning ? 'text-[#f7d31b]' : 'text-[#A78BFA]'}`} size={24} />
            <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">Gov Verify</span>
            {verifyVerdict && (
              <span className={`text-[8px] font-bold uppercase tracking-widest ${verifyVerdict.status === 'PASS' ? 'text-[#1bf7cd]' : verifyVerdict.status === 'FAIL' ? 'text-[#ff2a6d]' : 'text-[#f7d31b]'}`}>
                {verifyVerdict.status}
              </span>
            )}
          </button>

          {/* Memory Lake Mini Diagnostics */}
          <div className="bg-black/40 border border-[#00ff8833] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-[#00ff88]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Memory Lake</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_5px_#00ff88]" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Read/Write</span>
                <span className="text-[10px] text-white font-mono">{telemetry.agentDb.readRate}/{telemetry.agentDb.writeRate} MB/s</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88]" style={{ width: `${(telemetry.agentDb.readRate / 1000) * 100}%` }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Latency</span>
                <span className="text-[10px] text-[#00f2ff] font-mono">{telemetry.agentDb.latency.toFixed(1)}ms</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Health</span>
                <span className="text-[10px] text-[#1bf7cd] font-mono">{telemetry.agentDb.health}%</span>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveModal('agent-db')}
              className="w-full py-2 bg-[#00ff8811] border border-[#00ff8833] rounded-lg text-[8px] font-bold text-[#00ff88] uppercase hover:bg-[#00ff8822] transition-all"
            >
              Full Analytics
            </button>
          </div>

          {/* System Atlas — bottom of right panel */}
          <div className="mt-auto pt-4 border-t border-[#00f2ff15]">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-[0.25em]">System Atlas</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Tap a node to focus the brain view.</div>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-slate-400 uppercase shrink-0">
                {regionConfig.length} nodes
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
              {atlasCards.map(group => (
                <div key={group.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-[9px] font-bold text-white uppercase tracking-[0.18em]">{group.label}</div>
                    <div className="text-[8px] font-mono text-[#00f2ff]">{group.nodes.length}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.nodes.map(region => (
                      <button
                        key={region.id}
                        onClick={() => setSelectedRegion(region.id)}
                        className={`px-2 py-1 rounded-full border text-[8px] font-bold uppercase tracking-wide transition-all ${selectedRegion === region.id ? 'text-black shadow-[0_0_12px_rgba(0,242,255,0.3)]' : 'text-slate-300 hover:text-white'}`}
                        style={{
                          backgroundColor: selectedRegion === region.id ? colorNumberToHex(region.color) : 'rgba(255,255,255,0.04)',
                          borderColor: `${colorNumberToHex(region.color)}55`
                        }}
                      >
                        {region.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[1000] flex items-center justify-center p-2 md:p-10 animate-in fade-in zoom-in duration-300">
          <div className="w-full h-full max-w-[1600px] bg-[#0a0e29cc] border border-[#00f2ff26] rounded-2xl shadow-[0_0_60px_rgba(0,242,255,0.2)] flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 bg-[#181a2ccc] border-b border-[#00f2ff26] flex justify-between items-center">
              <h2 className="font-['Orbitron'] text-lg md:text-xl font-bold text-[#00f2ff] flex items-center gap-4">
                {activeModal === 'datacore' && <><Database className="text-[#6C47FF]" /> ESES: DATABASE ANALYTICS</>}
                {activeModal === 'agent-db' && <><Database className="text-[#00ff88]" /> AGENT DB: MEMORY LAKE</>}
                {activeModal === 'agents' && <><UserCog className="text-[#ff2a6d]" /> ESES: AGENT CENTER</>}
                {activeModal === 'workers' && <><Cpu className="text-[#00f2ff]" /> MCP AGENTS</>}
                {activeModal === 'matrix' && <><ListTodo className="text-[#1bf7cd]" /> TO-DO-LIST</>}
                {activeModal === 'logs' && <><Terminal className="text-[#ff2a6d]" /> SYSTEM LOGS</>}
                {activeModal === 'vitals' && <><Cpu className="text-[#00f2ff]" /> BODY HEALTH</>}
                {activeModal === 'sensory' && <><Zap className="text-[#ff2a6d]" /> SENSORY STREAMS</>}
                {activeModal === 'network' && <><Network className="text-[#1bf7cd]" /> NETWORK INTEGRITY</>}
                {activeModal === 'mind' && <><Brain className="text-[#9854ff]" /> PERSONALITY CORE</>}
                {activeModal === 'security' && <><UserCog className="text-[#1bf7cd]" /> SAFETY & SECURITY</>}
                {activeModal === 'tooling' && <><Database className="text-[#00f2ff]" /> MEMORY & TOOLING</>}
                {activeModal === 'spectral' && <><LineChart className="text-[#f7d31b]" /> BRAIN WAVES</>}
                {activeModal === 'quantum' && <><Zap className="text-[#1bf7cd]" /> QUANTUM BALANCE</>}
                {activeModal === 'todo' && <><ListTodo className="text-[#1bf7cd]" /> TASKS</>}
                {activeModal === 'glm-4-7-flash' && <><Brain className="text-[#00f2ff]" /> GLM 4.7 FLASH CORE</>}
                {activeModal === 'glm-4-6v-flash' && <><Brain className="text-[#9854ff]" /> GLM 4.6V FLASH CORE</>}
                {activeModal === 'notebook-lm' && <><Brain className="text-[#1bf7cd]" /> NOTEBOOK LM CORE</>}
                {activeModal === 'llama-3-local' && <><Brain className="text-[#1bf7cd]" /> LLAMA 3 LOCAL CORE</>}
                {activeModal === 'qwen-local' && <><Brain className="text-[#ff2a6d]" /> QWEN 2.5 LOCAL CORE</>}
                {activeModal === 'settings' && <><Cog className="text-gray-400" /> SYSTEM SETTINGS</>}
                {activeModal === 'verify' && <><ShieldCheck className="text-[#A78BFA]" /> GOVERNANCE VERIFY</>}
              </h2>
              <button onClick={() => setActiveModal(null)} className="animated-border w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[#ff2a6d] flex items-center justify-center hover:bg-[#ff2a6d33] transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 md:p-8 no-scrollbar">
              {activeModal === 'datacore' && <DatabaseDashboard />}
              {activeModal === 'agent-db' && <MemoryLake telemetry={telemetry} />}
              {activeModal === 'agents' && <AgentCenter />}
              {activeModal === 'workers' && <WorkersCenter />}
              {activeModal === 'matrix' && <MatrixDashboard />}
              {activeModal === 'vitals' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#00f2ff33] p-8">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-6 uppercase tracking-widest flex items-center gap-3">
                      <Cpu /> Processor Temperature
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={telemetry.cpuCores}>
                          <defs>
                            <linearGradient id="modalColorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#555" />
                          <YAxis stroke="#555" />
                          <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,242,255,0.2)' }} />
                          <Area type="monotone" dataKey="temp" stroke="#00f2ff" fillOpacity={1} fill="url(#modalColorTemp)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <div className="text-sm opacity-60 uppercase font-bold">Battery Level</div>
                        <div className="text-3xl font-black text-[#1bf7cd]">{telemetry.battery.level}%</div>
                      </div>
                      <Zap size={40} className="text-[#1bf7cd] opacity-20" />
                    </div>
                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <div className="text-sm opacity-60 uppercase font-bold">System Voltage</div>
                        <div className="text-3xl font-black text-[#9854ff]">{telemetry.battery.voltage}V</div>
                      </div>
                      <Activity size={40} className="text-[#9854ff] opacity-20" />
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'sensory' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#ff2a6d33] p-8">
                    <h3 className="text-xl font-bold text-[#ff2a6d] mb-6 uppercase tracking-widest flex items-center gap-3">
                      <Zap /> Movement Sensors
                    </h3>
                    <div className="h-64 flex items-end gap-2">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-[#ff2a6d] to-[#ff2a6d33] rounded-t-lg shadow-[0_0_15px_rgba(255,42,109,0.3)]" 
                          style={{ height: `${20 + Math.random() * 80}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="text-lg opacity-60 uppercase font-bold tracking-widest">Current Hinge Angle</div>
                      <div className="text-6xl font-black text-white">{telemetry.hinge}°</div>
                    </div>
                    <RefreshCw size={80} className="text-[#ff2a6d] animate-spin-slow opacity-20" />
                  </div>
                </div>
              )}
              {activeModal === 'network' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#1bf7cd33] flex flex-col items-center justify-center text-center">
                      <div className="text-sm opacity-60 uppercase font-bold mb-2">Signal Strength</div>
                      <div className="text-5xl font-black text-[#1bf7cd]">{telemetry.network.rsrp} <span className="text-xl">dBm</span></div>
                    </div>
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#1bf7cd33] flex flex-col items-center justify-center text-center">
                      <div className="text-sm opacity-60 uppercase font-bold mb-2">Average Latency</div>
                      <div className="text-5xl font-black text-[#1bf7cd]">{telemetry.network.latency.toFixed(0)} <span className="text-xl">ms</span></div>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-2xl border border-[#1bf7cd33] p-8">
                    <h3 className="text-xl font-bold text-[#1bf7cd] mb-6 uppercase tracking-widest flex items-center gap-3">
                      <Network /> Signal Stability
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={signalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <ReBar dataKey="value" fill="#1bf7cd" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'mind' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#9854ff33]">
                      <h3 className="text-xl font-bold text-[#9854ff] mb-8 uppercase tracking-widest flex items-center gap-3">
                        <Brain /> Personality Radar
                      </h3>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={telemetry.persona}>
                            <PolarGrid stroke="#ffffff20" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                            <Radar name="Persona" dataKey="A" stroke="#9854ff" fill="#9854ff" fillOpacity={0.5} isAnimationActive={false} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-[#9854ff1a] rounded-2xl p-6 border border-[#9854ff40] flex items-center gap-4">
                        <Brain size={32} className="text-[#9854ff] animate-pulse" />
                        <div>
                          <div className="text-lg font-bold text-[#9854ff] uppercase">Core Personality</div>
                          <div className="text-sm opacity-60 uppercase">Stable, Technical & Friendly</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-6 rounded-xl border border-white/10">
                          <div className="text-xs opacity-60 uppercase font-bold">Tokens/Sec</div>
                          <div className="text-2xl font-black text-[#9854ff]">{telemetry.inference.tokens.toFixed(1)}</div>
                        </div>
                        <div className="bg-black/40 p-6 rounded-xl border border-white/10">
                          <div className="text-xs opacity-60 uppercase font-bold">Inference Latency</div>
                          <div className="text-2xl font-black text-[#9854ff]">{telemetry.inference.latency.toFixed(0)}ms</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'security' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#1bf7cd33] p-8">
                    <h3 className="text-xl font-bold text-[#1bf7cd] mb-8 uppercase tracking-widest flex items-center gap-3">
                      <ShieldCheck /> Security Matrix
                    </h3>
                    <div className="grid grid-cols-10 gap-2">
                      {Array.from({ length: 100 }).map((_, i) => (
                        <div key={i} className={`aspect-square rounded-md shadow-inner ${Math.random() > 0.95 ? 'bg-[#ff2a6d] animate-pulse shadow-[0_0_10px_#ff2a6d]' : 'bg-[#1bf7cd]/20'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Handshake Integrity</div>
                      <div className="text-5xl font-black text-[#1bf7cd]">{telemetry.security.handshakes}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Violations Blocked</div>
                      <div className="text-5xl font-black text-[#ff2a6d]">{telemetry.security.violations}</div>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'tooling' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#00f2ff33] p-8">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-8 uppercase tracking-widest flex items-center gap-3">
                      <Database /> Memory Retrieval Performance
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Retrieval', val: telemetry.memory.retrieval }, 
                          { name: 'MCP Latency', val: telemetry.memory.mcpLatency },
                          { name: 'Cache Hit', val: 94 },
                          { name: 'Disk I/O', val: 45 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#555" />
                          <YAxis stroke="#555" />
                          <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,242,255,0.2)' }} />
                          <ReBar dataKey="val" fill="#00f2ff" radius={[4, 4, 0, 0]}>
                            {resourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#00f2ff', '#9854ff', '#1bf7cd', '#ff2a6d'][index % 4]} />
                            ))}
                          </ReBar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'spectral' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#f7d31b33] p-8">
                    <h3 className="text-xl font-bold text-[#f7d31b] mb-8 uppercase tracking-widest flex items-center gap-3">
                      <LineChart /> Brain Wave Analysis
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={signalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis hide />
                          <YAxis stroke="#555" />
                          <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(247,211,27,0.2)' }} />
                          <ReLine type="monotone" dataKey="value" stroke="#f7d31b" strokeWidth={3} dot={false} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'quantum' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#1bf7cd33] flex flex-col items-center justify-center">
                      <h3 className="text-xl font-bold text-[#1bf7cd] mb-8 uppercase tracking-widest">Stability Balance</h3>
                      <div className="relative w-64 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Stable', value: 85 },
                                { name: 'Entangled', value: 15 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#1bf7cd" />
                              <Cell fill="#1bf7cd33" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-4xl font-black text-[#1bf7cd]">85%</div>
                          <div className="text-[10px] opacity-60 uppercase font-bold">Stable</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex flex-col justify-center space-y-6">
                      <div className="space-y-2">
                        <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Coherence Level</div>
                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-[#1bf7cd] h-full w-[85%] shadow-[0_0_15px_#1bf7cd]"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Entanglement Risk</div>
                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-[#ff2a6d] h-full w-[15%] shadow-[0_0_15px_#ff2a6d]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'logs' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="bg-black/40 rounded-xl border border-[#ff2a6d33] p-6 font-mono text-xs overflow-y-auto custom-scrollbar max-h-[70vh] space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className={`p-3 rounded-lg border-l-4 bg-white/5 shadow-lg ${
                        log.type === 'success' ? 'border-[#1bf7cd] text-[#1bf7cd]' :
                        log.type === 'warn' ? 'border-[#f7d31b] text-[#f7d31b]' :
                        log.type === 'error' ? 'border-[#ff2a6d] text-[#ff2a6d]' :
                        'border-[#00f2ff] text-gray-400'
                      }`}>
                        <div className="flex justify-between mb-2 opacity-60 text-[10px] font-bold">
                          <span>{log.time}</span>
                          <span className="uppercase tracking-widest">{log.type}</span>
                        </div>
                        <div className="leading-relaxed break-words text-sm">{log.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeModal === 'todo' && <TodoList />}
              {(activeModal === 'glm-4-7-flash' || activeModal === 'glm-4-6v-flash' || activeModal === 'notebook-lm' || activeModal === 'llama-3-local' || activeModal === 'qwen-local') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-6 flex items-center gap-3">
                      <Activity /> Synaptic Flux
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Array.from({ length: 20 }, (_, i) => ({ name: i, value: Math.random() * 20 + 80 }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis hide />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
                          <ReTooltip 
                            contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px' }}
                            itemStyle={{ color: '#e0e7ff' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#00f2ff" fill="rgba(0, 242, 255, 0.1)" strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-6 flex items-center gap-3">
                      <Terminal /> System Parameters
                    </h3>
                    <div className="space-y-4 font-mono text-sm">
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Model ID:</span>
                        <span className="text-[#00f2ff] uppercase">{activeModal.replace(/-/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Connectivity:</span>
                        <span className="text-[#1bf7cd]">STABLE / WOKE</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Register:</span>
                        <span className="text-[#9854ff]">MENTOR_CALM</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Intent Confidence:</span>
                        <span className="text-[#f7d31b]">0.98</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Context Window:</span>
                        <span className="text-[#ff2a6d]">{activeModal.includes('4-6v') || activeModal.includes('4-7') ? '128K' : '32K'}</span>
                      </div>
                      {activeModal === 'qwen-local' && (
                        <div className="mt-4 p-4 bg-[#ff2a6d1a] border border-[#ff2a6d33] rounded-xl text-[10px] text-gray-300 space-y-2">
                          <div className="flex items-center gap-2 text-[#ff2a6d] font-bold">
                            <Terminal size={12} /> LOCAL MODEL PATH
                          </div>
                          <div className="font-mono break-all bg-black/40 p-2 rounded border border-white/5">
                            D:\Portable-VSCode-MCP-Kit\models\qwen2.5-0.5b
                          </div>
                          <div className="flex justify-between text-[8px] opacity-60">
                            <span>Architecture: Qwen2.5</span>
                            <span>Size: 0.5B Parameters</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'verify' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Header controls */}
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <div className="font-['Orbitron'] text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest mb-1">Mission: civilization_readiness</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest">G1–G7 in-process governance validation — edge-device safe</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={verifyRunning}
                        onClick={async () => {
                          const v = await MarshalVerify.runMission({
                            mission_id: `VERIFY-${Date.now()}`,
                            type: 'civilization_readiness',
                            initiator: 'LeePrime',
                            workflows: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
                            budget_mode: 'BALANCED',
                          });
                          setVerifyVerdict(v);
                        }}
                        className="px-4 py-2 rounded-xl font-['Orbitron'] text-[9px] font-bold uppercase tracking-widest border border-[#7C3AED] text-[#A78BFA] bg-[#7C3AED22] hover:bg-[#7C3AED44] disabled:opacity-40 transition-all"
                      >
                        {verifyRunning ? 'Running…' : 'Run G1–G7'}
                      </button>
                      <button
                        disabled={verifyRunning}
                        onClick={async () => {
                          const r = await MarshalVerify.quickCheck();
                          const ok = r.zoneOk && r.budgetOk && r.busOk && r.injectionOk;
                          logActivity(`[MarshalVerify] Quick: zone=${r.zoneOk ? 'OK' : 'LEAK'} budget=${r.budgetOk ? 'OK' : 'OVER'} bus=${r.busOk ? 'OK' : 'DEAD'} inject=${r.injectionOk ? 'BLOCKED' : 'OPEN'}`, ok ? 'success' : 'warn');
                        }}
                        className="px-4 py-2 rounded-xl font-['Orbitron'] text-[9px] font-bold uppercase tracking-widest border border-[#00f2ff44] text-[#00f2ff] bg-[#00f2ff11] hover:bg-[#00f2ff22] disabled:opacity-40 transition-all"
                      >
                        Quick Check
                      </button>
                    </div>
                  </div>

                  {/* Verdict banner */}
                  {verifyVerdict && (
                    <div className={`rounded-2xl border p-5 flex flex-wrap gap-4 items-center justify-between ${
                      verifyVerdict.status === 'PASS' ? 'border-[#1bf7cd44] bg-[#1bf7cd0a]' :
                      verifyVerdict.status === 'FAIL' ? 'border-[#ff2a6d44] bg-[#ff2a6d0a]' :
                      verifyVerdict.status === 'BLOCKED' ? 'border-[#9854ff44] bg-[#9854ff0a]' :
                      'border-[#f7d31b44] bg-[#f7d31b0a]'
                    }`}>
                      <div>
                        <div className={`font-['Orbitron'] text-2xl font-black ${
                          verifyVerdict.status === 'PASS' ? 'text-[#1bf7cd]' :
                          verifyVerdict.status === 'FAIL' ? 'text-[#ff2a6d]' :
                          verifyVerdict.status === 'BLOCKED' ? 'text-[#9854ff]' : 'text-[#f7d31b]'
                        }`}>{verifyVerdict.status}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{verifyVerdict.recommendation}</div>
                      </div>
                      <div className="flex gap-6 text-center">
                        <div>
                          <div className="text-[8px] text-gray-500 uppercase font-bold">Scenarios</div>
                          <div className="text-lg font-black text-white">{verifyVerdict.scenarios_passed}/{verifyVerdict.scenarios_run}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-gray-500 uppercase font-bold">Steps</div>
                          <div className="text-lg font-black text-white">{verifyVerdict.total_steps - verifyVerdict.total_failures}/{verifyVerdict.total_steps}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-gray-500 uppercase font-bold">Confidence</div>
                          <div className="text-lg font-black text-[#A78BFA]">{(verifyVerdict.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scenario grid */}
                  {verifyScenarios.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verifyScenarios.map(sc => (
                        <div key={sc.scenario_id} className={`bg-black/40 rounded-xl border p-4 space-y-3 ${sc.pass ? 'border-[#1bf7cd22]' : 'border-[#ff2a6d22]'}`}>
                          <div className="flex items-center justify-between">
                            <div className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-widest">{sc.workflow} — {sc.lead_expected}</div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${sc.pass ? 'text-[#1bf7cd] bg-[#1bf7cd11]' : 'text-[#ff2a6d] bg-[#ff2a6d11]'}`}>
                              {sc.pass ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {sc.steps.map(step => (
                              <div key={step.step} className="flex items-center gap-2 text-[9px]">
                                <span className={step.pass ? 'text-[#1bf7cd]' : 'text-[#ff2a6d]'}>{step.pass ? '✓' : '✗'}</span>
                                <span className="text-gray-400 font-mono">{step.step}</span>
                                <span className="text-gray-600 ml-auto">{step.durationMs}ms</span>
                              </div>
                            ))}
                          </div>
                          {sc.failures > 0 && (
                            <div className="text-[8px] text-[#ff2a6d] bg-[#ff2a6d0a] border border-[#ff2a6d22] rounded-lg p-2 space-y-1">
                              {sc.steps.filter(s => !s.pass).map((s, i) => <div key={i}>{s.step}: {s.message}</div>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Idle state */}
                  {!verifyVerdict && !verifyRunning && (
                    <div className="text-center py-16 text-gray-600">
                      <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                      <div className="font-['Orbitron'] text-[10px] uppercase tracking-widest">No mission run yet</div>
                      <div className="text-[9px] mt-2">Run G1–G7 to validate governance civilization law</div>
                    </div>
                  )}

                  {/* Running state */}
                  {verifyRunning && (
                    <div className="text-center py-16">
                      <ShieldCheck size={48} className="mx-auto mb-4 text-[#A78BFA] animate-pulse" />
                      <div className="font-['Orbitron'] text-[10px] uppercase tracking-widest text-[#A78BFA]">Mission in progress…</div>
                      <div className="text-[9px] text-gray-500 mt-2">Validating G1–G7 governance flows in-process</div>
                    </div>
                  )}

                  {/* Critical failures */}
                  {verifyVerdict && verifyVerdict.critical_failures.length > 0 && (
                    <div className="bg-[#ff2a6d0a] border border-[#ff2a6d33] rounded-xl p-4 space-y-2">
                      <div className="font-['Orbitron'] text-[9px] font-bold text-[#ff2a6d] uppercase tracking-widest">Critical Failures</div>
                      {verifyVerdict.critical_failures.map((f, i) => (
                        <div key={i} className="text-[9px] text-gray-300 flex gap-2">
                          <span className="text-[#ff2a6d]">✗</span> {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeModal === 'settings' && (
                <div className="max-w-2xl mx-auto bg-black/40 p-8 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest">System Settings</h3>
                  <div className="space-y-6">
                    {/* Auto-Optimization */}
                    <button
                      type="button"
                      onClick={() => setAutoOpt(v => !v)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div>
                        <div className="font-bold text-white">Auto-Optimization</div>
                        <div className="text-xs text-gray-500">Allow system to self-tune neural pathways</div>
                      </div>
                      <div
                        className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
                        style={{ background: autoOpt ? '#00f2ff' : 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                          style={{ left: autoOpt ? '1.75rem' : '0.25rem' }}
                        />
                      </div>
                    </button>

                    {/* Android Compatibility Mode */}
                    <button
                      type="button"
                      onClick={() => setAndroidCompat(v => !v)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div>
                        <div className="font-bold text-white">Android Compatibility Mode</div>
                        <div className="text-xs text-gray-500">Optimize UI for mobile diagnostic performance</div>
                      </div>
                      <div
                        className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
                        style={{ background: androidCompat ? '#00f2ff' : 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                          style={{ left: androidCompat ? '1.75rem' : '0.25rem' }}
                        />
                      </div>
                    </button>

                    {/* Memory Pipeline Logging */}
                    <button
                      type="button"
                      onClick={() => setMemoryLog(v => !v)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div>
                        <div className="font-bold text-white">Memory Pipeline Logging</div>
                        <div className="text-xs text-gray-500">Detailed reporting of all data transactions</div>
                      </div>
                      <div
                        className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
                        style={{ background: memoryLog ? '#00f2ff' : 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                          style={{ left: memoryLog ? '1.75rem' : '0.25rem' }}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 30px 30px; }
        }
        @keyframes borderRotate {
          0% { border-color: #00f2ff; box-shadow: 0 0 5px #00f2ff; }
          33% { border-color: #9854ff; box-shadow: 0 0 5px #9854ff; }
          66% { border-color: #ff2a6d; box-shadow: 0 0 5px #ff2a6d; }
          100% { border-color: #00f2ff; box-shadow: 0 0 5px #00f2ff; }
        }
        .animated-border {
          border-width: 1px;
          animation: borderRotate 4s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00f2ff33;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
