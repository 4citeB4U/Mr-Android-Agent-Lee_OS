/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.DEPLOYMENT
TAG: UI.PAGE.DEPLOYMENT.HUB

COLOR_ONION_HEX:
NEON=#10B981
FLUO=#34D399
PASTEL=#A7F3D0

ICON_ASCII:
family=lucide
glyph=rocket

5WH:
WHAT = Deployment Hub page — manages apps, deployment configs, system monitoring, and console commands
WHY = Provides full production deployment pipeline for code built in the VM through to live infrastructure
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Deployment.tsx
WHEN = 2026
HOW = React component with tabs (Apps, Deploy, Monitor, Settings), app CRUD, kernel event bus integration

AGENTS:
ASSESS
AUDIT
GEMINI
NEXUS

LICENSE:
MIT
*/
import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, Terminal, Send, Zap, Upload, Mic, ArrowRight, 
  Home, Activity, Rocket, Code, Database, Settings, Menu, X, 
  TrendingUp, Palette, Megaphone, BookOpen, Search, Video, 
  Globe, RefreshCw, Save, Share2, Layout as LayoutIcon, PenTool, 
  Image as ImageIcon, Layers, Cpu, ShieldCheck, 
  ChevronRight, ChevronLeft, ChevronDown, Trash2, Plus, Download, Filter,
  AlertTriangle, CheckCircle2, Radio, Sparkles, Clipboard, 
  Mail, FileText, MousePointer2, Clock, BarChart3, Network,
  Maximize2, Play, Pause, Square, SkipBack, SkipForward, MoreVertical, Music, MoreHorizontal,
  Calendar, Users, Target, DollarSign, Heart, MessageCircle,
  Shield, Eye, Lock, FileJson, Trash, HardDrive, Cpu as CpuIcon,
  Activity as ActivityIcon, Link2, CheckCircle2 as CheckCircle, Circle, Circle as CircleIcon,
  ExternalLink, RefreshCcw, Layout, FileCode, Package, AlertCircle, Briefcase,
  Smartphone, Server, ShoppingCart, Gavel, MessageSquare, ArrowLeftRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { eventBus } from '../core/EventBus';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- GOVERNANCE CONSTANTS ---
const AGENTS = {
  CORE: [
    { id: 'LEE_PRIME', name: 'Lee Prime', role: 'Sovereign Architect', family: 'AgentLee', icon: Bot, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    { id: 'ATLAS', name: 'Atlas', role: 'Lead Researcher', family: 'VECTOR', icon: Search, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { id: 'NOVA', name: 'Nova', role: 'Master Builder', family: 'FORGE', icon: Code, color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    { id: 'ECHO', name: 'Echo', role: 'Voice of Feeling', family: 'AURA', icon: Mic, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    { id: 'SAGE', name: 'Sage', role: 'Dreaming Chronicler', family: 'ARCHIVE', icon: BookOpen, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    { id: 'SHIELD', name: 'Shield', role: 'Guardian of Intent', family: 'AEGIS', icon: ShieldCheck, color: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    { id: 'PIXEL', name: 'Pixel', role: 'Visual Weaver', family: 'AURA', icon: Palette, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    { id: 'NEXUS', name: 'Nexus', role: 'Deployment Conductor', family: 'NEXUS', icon: Rocket, color: 'cyan', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
    { id: 'ARIA', name: 'Aria', role: 'Social Voice', family: 'AURA', icon: Globe, color: 'teal', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' },
    { id: 'ADAM', name: 'Adam Cortex', role: 'Logic Engine', family: 'FORGE', icon: Cpu, color: 'slate', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
    { id: 'GABRIEL', name: 'Gabriel Cortex', role: 'Creative Director', family: 'AURA', icon: PenTool, color: 'pink', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
    { id: 'LILY', name: 'Lily Cortex', role: 'Empathy Engine', family: 'AURA', icon: Heart, color: 'fuchsia', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100' },
    { id: 'BRAIN', name: 'Brain Sentinel', role: 'Budget Warden', family: 'AEGIS', icon: ActivityIcon, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    { id: 'BUGHUNTER', name: 'Bug Hunter', role: 'Code Auditor', family: 'FORGE', icon: AlertCircle, color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    { id: 'SYNTAX', name: 'Syntax Forge', role: 'Code Standards', family: 'FORGE', icon: FileCode, color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    { id: 'GUARD', name: 'Guard Aegis', role: 'Security Monitor', family: 'AEGIS', icon: Lock, color: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    { id: 'DIRECTORY_SEARCH', name: 'Directory', role: 'Contact Intelligence', family: 'VECTOR', icon: Users, color: 'green', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  ],
  GOVERNANCE: [
    { id: 'CLERK', name: 'ClerkArchive', role: 'Keeper of Reports', icon: Clipboard },
    { id: 'JANITOR', name: 'JanitorSentinel', role: 'Warden of Retention', icon: Trash2 },
    { id: 'LIBRARIAN', name: 'LibrarianAegis', role: 'Documentation Officer', icon: FileText },
    { id: 'MARSHAL', name: 'MarshalVerify', role: 'Commander of Verification', icon: Shield },
    { id: 'STANDARDS', name: 'LeewayStandards', role: 'Enforcer of Standards', icon: Target },
  ],
  VOICE: [
    { id: 'CONDUCTOR', name: 'LiveConductor', role: 'Session Orchestrator', icon: Radio },
    { id: 'STT', name: 'StreamingSTT', role: 'Listener', icon: Mic },
    { id: 'TTS', name: 'StreamingTTS', role: 'Speaker', icon: Megaphone },
    { id: 'VISION', name: 'VisionAgent', role: 'Observer', icon: Eye },
    { id: 'ROUTER', name: 'RouterAgent', role: 'Intent Dispatcher', icon: Network },
    { id: 'SAFETY', name: 'SafetyRedaction', role: 'Guardian', icon: Lock },
  ]
};

const WORKFLOWS = [
  { id: 'G1', name: 'Conversation', lead: 'LEE_PRIME', helpers: ['ARIA'] },
  { id: 'G2', name: 'Research', lead: 'ATLAS', helpers: ['SAGE'] },
  { id: 'G3', name: 'Engineering', lead: 'NOVA', helpers: ['SHIELD'] },
  { id: 'G4', name: 'Design', lead: 'PIXEL', helpers: ['ARIA', 'ECHO'] },
  { id: 'G5', name: 'Memory', lead: 'SAGE', helpers: ['CLERK'] },
  { id: 'G6', name: 'Deployment', lead: 'NEXUS', helpers: ['SHIELD'] },
  { id: 'G7', name: 'Health', lead: 'SHIELD', helpers: ['MARSHAL'] },
  { id: 'G8', name: 'Governance', lead: 'MARSHAL', helpers: ['CLERK', 'JANITOR'] },
  { id: 'G9', name: 'Directory Search', lead: 'DIRECTORY_SEARCH', helpers: ['ATLAS', 'ARIA'] },
  { id: 'G10', name: 'Code Build', lead: 'NOVA', helpers: ['BUGHUNTER', 'SYNTAX'] },
  { id: 'G11', name: 'Creative', lead: 'GABRIEL', helpers: ['PIXEL', 'LILY'] },
];

const MODES = [
  { id: 'FULL', maxAgents: 4, heavyLane: true, color: 'emerald' },
  { id: 'BALANCED', maxAgents: 3, heavyLane: true, color: 'blue' },
  { id: 'BATTERY', maxAgents: 2, heavyLane: false, color: 'amber' },
  { id: 'SLEEP_CITY', maxAgents: 1, heavyLane: false, color: 'indigo' },
  { id: 'SAFE', maxAgents: 2, heavyLane: false, color: 'red' },
];

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Types ---
type TabId = 'launches' | 'code' | 'creator' | 'publish' | 'monitor' | 'connections' | 'ecosystem' | 'directory' | 'vm';

interface Launch {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'in-progress' | 'live';
  readiness: number;
  lastUpdated: string;
  url?: string;
  progress?: number;
}

// --- Mock Data ---
const MOCK_LAUNCHES: Launch[] = [
  { id: 'L1', name: 'Nexus Prime', type: 'Full-stack App', status: 'live', readiness: 100, lastUpdated: '2h ago', url: 'https://nexus.prime.io' },
  { id: 'L2', name: 'Summer Drop', type: 'Digital Product', status: 'in-progress', readiness: 65, lastUpdated: '12m ago', progress: 75 },
  { id: 'L3', name: 'Alpha Landing', type: 'Marketing Site', status: 'draft', readiness: 40, lastUpdated: '1d ago' },
];

const PIPELINE_STEPS = [
  { id: 'validate', label: 'Validate' },
  { id: 'build', label: 'Build' },
  { id: 'package', label: 'Package' },
  { id: 'publish', label: 'Publish' },
  { id: 'verify', label: 'Verify' },
  { id: 'announce', label: 'Announce' },
];

// --- Components ---

const DIRECTORY_DATA = [
  // App Founders
  { profession: 'App Founders', company: 'Y Combinator', category: 'Incubator', subcategory: 'Seed', stage: 'Early', contactRoute: 'ycapply.com', outreachAngle: 'Validated MVP, 1K users', assetNeeded: 'YC app', expectedOutcome: '$125K funding', website: 'ycombinator.com' },
  { profession: 'App Founders', company: 'Techstars', category: 'Incubator', subcategory: 'Seed', stage: 'Early', contactRoute: 'techstars.com/apply', outreachAngle: 'Strong team, clear vision', assetNeeded: 'Pitch Deck', expectedOutcome: '$120K funding', website: 'techstars.com' },
  { profession: 'App Founders', company: '500 Global', category: 'Incubator', subcategory: 'Seed', stage: 'Early', contactRoute: '500.co/apply', outreachAngle: 'Global growth potential', assetNeeded: 'Growth metrics', expectedOutcome: 'Seed funding', website: '500.co' },
  { profession: 'App Founders', company: 'Bubble', category: 'No-Code', subcategory: 'Platform', stage: 'Prototype', contactRoute: 'bubble.io', outreachAngle: 'Visual programming', assetNeeded: 'App Idea', expectedOutcome: 'Functional MVP', website: 'bubble.io' },
  { profession: 'App Founders', company: 'Adalo', category: 'No-Code', subcategory: 'Mobile', stage: 'Prototype', contactRoute: 'adalo.com', outreachAngle: 'Native mobile apps', assetNeeded: 'Design mockup', expectedOutcome: 'Mobile MVP', website: 'adalo.com' },
  { profession: 'App Founders', company: 'Goji Labs', category: 'Studio', subcategory: 'MVP build', stage: 'Idea', contactRoute: 'Partner form', outreachAngle: 'Startup focused', assetNeeded: 'Pitch Deck', expectedOutcome: 'MVP build', website: 'gojilabs.com' },
  { profession: 'App Founders', company: 'Designli', category: 'Studio', subcategory: 'Non-tech founders', stage: 'Idea', contactRoute: 'Founder outreach', outreachAngle: 'Structured process', assetNeeded: 'Product brief', expectedOutcome: 'Design prototype', website: 'designli.co' },
  { profession: 'App Founders', company: 'Vercel', category: 'Hosting', subcategory: 'Frontend', stage: 'Launch', contactRoute: 'vercel.com', outreachAngle: 'Next.js deployment', assetNeeded: 'Git repo', expectedOutcome: 'Live site', website: 'vercel.com' },
  // Writers
  { profession: 'Writers', company: 'ICM Partners', category: 'Literary Agent', subcategory: 'Fiction', stage: 'Pre-published', contactRoute: 'icmtalent.com/submissions', outreachAngle: '50K word sample + synopsis', assetNeeded: 'Query letter', expectedOutcome: 'Book deal', website: 'icmtalent.com' },
  { profession: 'Writers', company: 'CAA Books', category: 'Literary Agent', subcategory: 'Non-fiction', stage: 'Pre-published', contactRoute: 'caa.com/submissions', outreachAngle: 'Platform + proposal', assetNeeded: 'Book proposal', expectedOutcome: 'Representation', website: 'caa.com' },
  { profession: 'Writers', company: 'Amazon KDP', category: 'Platform', subcategory: 'Self-publishing', stage: 'Launch', contactRoute: 'kdp.amazon.com', outreachAngle: 'Amazon reach', assetNeeded: 'Manuscript', expectedOutcome: 'Published book', website: 'kdp.amazon.com' },
  { profession: 'Writers', company: 'Draft2Digital', category: 'Platform', subcategory: 'Wide distribution', stage: 'Launch', contactRoute: 'draft2digital.com', outreachAngle: 'Multi-retailer', assetNeeded: 'EPUB file', expectedOutcome: 'Global distribution', website: 'draft2digital.com' },
  { profession: 'Writers', company: 'Reedsy', category: 'Service', subcategory: 'Marketplace', stage: 'Prototype', contactRoute: 'reedsy.com', outreachAngle: 'Editing/publishing', assetNeeded: 'Draft', expectedOutcome: 'Polished book', website: 'reedsy.com' },
  { profession: 'Writers', company: 'WGAW', category: 'Guild', subcategory: 'Industry access', stage: 'Growth', contactRoute: 'wga.org', outreachAngle: 'Job openings', assetNeeded: 'Screenplay', expectedOutcome: 'Union membership', website: 'wga.org' },
  // Artists
  { profession: 'Artists', company: 'Saatchi Art', category: 'Gallery', subcategory: 'Online', stage: 'Growth', contactRoute: 'saatchiart.com', outreachAngle: 'Global collectors', assetNeeded: 'Portfolio', expectedOutcome: 'Art sales', website: 'saatchiart.com' },
  { profession: 'Artists', company: 'ArtStation', category: 'Portfolio', subcategory: 'Discovery', stage: 'Prototype', contactRoute: 'artstation.com', outreachAngle: 'Industry standard', assetNeeded: 'Digital art', expectedOutcome: 'Job offers', website: 'artstation.com' },
  { profession: 'Artists', company: 'Society6', category: 'Print-on-demand', subcategory: 'Merch sales', stage: 'Launch', contactRoute: 'society6.com', outreachAngle: 'Print POD', assetNeeded: 'High-res art', expectedOutcome: 'Passive income', website: 'society6.com' },
  { profession: 'Artists', company: 'Artsy', category: 'Marketplace', subcategory: 'Collectors', stage: 'Scale', contactRoute: 'artsy.net', outreachAngle: 'Gallery access', assetNeeded: 'Exhibition history', expectedOutcome: 'High-value sales', website: 'artsy.net' },
  { profession: 'Artists', company: 'Foundation', category: 'NFT', subcategory: 'Crypto art', stage: 'Launch', contactRoute: 'foundation.app', outreachAngle: 'Web3 discovery', assetNeeded: 'NFT asset', expectedOutcome: 'ETH sales', website: 'foundation.app' },
  // Influencers
  { profession: 'Influencers', company: 'Viral Nation', category: 'Agency', subcategory: 'Management', stage: 'Scale', contactRoute: 'viralnation.com', outreachAngle: 'High engagement', assetNeeded: 'Media kit', expectedOutcome: 'Brand deals', website: 'viralnation.com' },
  { profession: 'Influencers', company: 'Collabstr', category: 'Marketplace', subcategory: 'Direct deals', stage: 'Launch', contactRoute: 'collabstr.com', outreachAngle: 'Direct marketplace', assetNeeded: 'Profile', expectedOutcome: 'Paid collabs', website: 'collabstr.com' },
  { profession: 'Influencers', company: 'Patreon', category: 'Membership', subcategory: 'Recurring revenue', stage: 'Growth', contactRoute: 'patreon.com', outreachAngle: 'Fan support', assetNeeded: 'Content plan', expectedOutcome: 'Monthly income', website: 'patreon.com' },
  { profession: 'Influencers', company: 'Night Media', category: 'Management', subcategory: 'Top tier', stage: 'Scale', contactRoute: 'night.co', outreachAngle: 'Massive reach', assetNeeded: 'Channel stats', expectedOutcome: 'Enterprise deals', website: 'night.co' },
  // Marketers
  { profession: 'Marketers', company: 'Shopify', category: 'Ecommerce', subcategory: 'Storefronts', stage: 'Launch', contactRoute: 'shopify.com', outreachAngle: 'Core commerce', assetNeeded: 'Product set', expectedOutcome: 'Online store', website: 'shopify.com' },
  { profession: 'Marketers', company: 'HubSpot', category: 'CRM', subcategory: 'Sales pipelines', stage: 'Growth', contactRoute: 'hubspot.com', outreachAngle: 'Full CRM', assetNeeded: 'Lead list', expectedOutcome: 'Sales automation', website: 'hubspot.com' },
  { profession: 'Marketers', company: 'Mailchimp', category: 'Email', subcategory: 'Automation', stage: 'Growth', contactRoute: 'mailchimp.com', outreachAngle: 'Email nurturing', assetNeeded: 'Email list', expectedOutcome: 'Customer retention', website: 'mailchimp.com' },
  { profession: 'Marketers', company: 'Stripe', category: 'Payment', subcategory: 'Infrastructure', stage: 'Launch', contactRoute: 'stripe.com', outreachAngle: 'Global payments', assetNeeded: 'Business info', expectedOutcome: 'Revenue flow', website: 'stripe.com' },
  // Investors
  { profession: 'Investors', company: 'a16z', category: 'VC', subcategory: 'Software/creator', stage: 'Scale', contactRoute: 'a16z.com', outreachAngle: 'Creator focus', assetNeeded: 'Pitch Deck', expectedOutcome: 'Series A funding', website: 'a16z.com' },
  { profession: 'Investors', company: 'AngelList', category: 'Angel Groups', subcategory: 'Syndicates', stage: 'Early', contactRoute: 'angellist.com', outreachAngle: 'Warm intro', assetNeeded: 'Deck + Traction', expectedOutcome: 'Angel funding', website: 'angellist.com' },
  { profession: 'Investors', company: 'Pipe', category: 'Revenue Finance', subcategory: 'Growth', stage: 'Growth', contactRoute: 'pipe.com', outreachAngle: 'Recurring revenue', assetNeeded: 'Revenue data', expectedOutcome: 'Non-dilutive capital', website: 'pipe.com' },
  // Entertainment
  { profession: 'Entertainment', company: 'Casting Networks', category: 'Casting', subcategory: 'Auditions', stage: 'Prototype', contactRoute: 'castingnetworks.com', outreachAngle: 'Union/non-union', assetNeeded: 'Headshot + Reel', expectedOutcome: 'Audition calls', website: 'castingnetworks.com' },
  { profession: 'Entertainment', company: 'A24', category: 'Production', subcategory: 'Indie film', stage: 'Scale', contactRoute: 'a24films.com', outreachAngle: 'Unique vision', assetNeeded: 'Script/Pitch', expectedOutcome: 'Film production', website: 'a24films.com' },
  { profession: 'Entertainment', company: 'Voices.com', category: 'Voiceover', subcategory: 'Marketplace', stage: 'Launch', contactRoute: 'voices.com', outreachAngle: 'Professional voice', assetNeeded: 'Voice demo', expectedOutcome: 'VO gigs', website: 'voices.com' },
];

const CommandCenter = ({ isOpen, onClose, onStartBuild }: { isOpen: boolean, onClose: () => void, onStartBuild?: () => void }) => {
  const [input, setInput] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [leadAgent, setLeadAgent] = useState('LEE_PRIME');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, agent?: string }[]>([
    { role: 'assistant', content: "I am Lee Prime. The Sovereign Architect. I have full access to the Master Directory, all domain agents, and your complete VM. Issue your command.", agent: 'LEE_PRIME' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build directory summary for Agent Lee's context
  const directorySummary = useMemo(() => {
    const byProfession: Record<string, string[]> = {};
    DIRECTORY_DATA.forEach(item => {
      if (!byProfession[item.profession]) byProfession[item.profession] = [];
      byProfession[item.profession].push(`${item.company} (${item.category}, Stage: ${item.stage}, Route: ${item.contactRoute})`);
    });
    return Object.entries(byProfession).map(([prof, items]) => 
      `${prof}: ${items.join('; ')}`
    ).join('\n');
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const detectWorkflow = (msg: string): { workflow: string, lead: string } => {
    const lower = msg.toLowerCase();
    if (lower.includes('directory') || lower.includes('contact') || lower.includes('find company') || lower.includes('partner') || lower.includes('outreach')) 
      return { workflow: 'G9', lead: 'DIRECTORY_SEARCH' };
    if (lower.includes('build') || lower.includes('deploy') || lower.includes('pipeline') || lower.includes('publish') || lower.includes('launch'))
      return { workflow: 'G6', lead: 'NEXUS' };
    if (lower.includes('code') || lower.includes('fix') || lower.includes('debug') || lower.includes('error') || lower.includes('bug'))
      return { workflow: 'G10', lead: 'NOVA' };
    if (lower.includes('research') || lower.includes('search') || lower.includes('find') || lower.includes('analyze'))
      return { workflow: 'G2', lead: 'ATLAS' };
    if (lower.includes('design') || lower.includes('art') || lower.includes('visual') || lower.includes('image') || lower.includes('creative'))
      return { workflow: 'G11', lead: 'GABRIEL' };
    if (lower.includes('health') || lower.includes('status') || lower.includes('monitor') || lower.includes('check'))
      return { workflow: 'G7', lead: 'SHIELD' };
    if (lower.includes('memory') || lower.includes('archive') || lower.includes('save') || lower.includes('recall'))
      return { workflow: 'G5', lead: 'SAGE' };
    return { workflow: 'G1', lead: 'LEE_PRIME' };
  };

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = (overrideMsg || input).trim();
    if (!userMsg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const { workflow: detectedWorkflow, lead: detectedLead } = detectWorkflow(userMsg);
    setActiveWorkflow(detectedWorkflow);
    setLeadAgent(detectedLead);

    // Special command handling
    if (userMsg.toLowerCase().includes('run build') || userMsg.toLowerCase().includes('start build') || userMsg.toLowerCase().includes('start pipeline')) {
      if (onStartBuild) {
        onStartBuild();
        setMessages(prev => [...prev, { role: 'assistant', content: "Baton passed to Nexus. G6 Deployment workflow initiated. VM-first execution sequence engaged. Tracking build progress in real-time.", agent: 'NEXUS' }]);
        setIsLoading(false);
        return;
      }
    }

    if (userMsg.toLowerCase().includes('go to code') || userMsg.toLowerCase().includes('open code studio') || userMsg.toLowerCase().includes('switch to code')) {
      eventBus.emit('navigate:page', { page: 'code' });
      setMessages(prev => [...prev, { role: 'assistant', content: "Navigating to Code Studio. Nova is standing by.", agent: 'NOVA' }]);
      setIsLoading(false);
      return;
    }

    if (userMsg.toLowerCase().includes('go to creator') || userMsg.toLowerCase().includes('open creator') || userMsg.toLowerCase().includes('switch to creator')) {
      eventBus.emit('navigate:page', { page: 'creators' });
      setMessages(prev => [...prev, { role: 'assistant', content: "Navigating to Creator Studio. Gabriel and Pixel are ready.", agent: 'GABRIEL' }]);
      setIsLoading(false);
      return;
    }

    const agent = AGENTS.CORE.find(a => a.id === detectedLead) || AGENTS.CORE[0];
    const workflowObj = WORKFLOWS.find(w => w.id === detectedWorkflow);

    const systemPrompt = detectedLead === 'DIRECTORY_SEARCH'
      ? `You are the Directory Search agent in Agent Lee OS — you are contact intelligence specialist and direct assistant to Lee Prime. You have complete knowledge of this professional directory:\n\n${directorySummary}\n\nWhen the user asks about contacts, partners, platforms, outreach, or companies, search this directory and respond with specific, actionable intelligence. Format your response clearly with company name, contact route, stage, and outreach angle. Be precise and strategic.`
      : `You are ${agent.name}, the ${agent.role} in the Agent Lee OS. You are part of the ${agent.family} family. You are currently leading Workflow ${workflowObj?.name || detectedWorkflow}. Your helpers are: ${workflowObj?.helpers?.join(', ') || 'none'}. Agent Lee OS has a complete Master Directory of professional contacts across App Founders, Writers, Artists, Influencers, Marketers, Investors, and Entertainment. You also have VM-first task execution authority. Respond in character, being concise and action-oriented. The user says: ${userMsg}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Mission acknowledged. Proceeding with automation.", agent: detectedLead }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Communication link unstable. Shield Aegis is investigating. Standing by.", agent: 'SHIELD' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'G6: Run Build', msg: 'Run build' },
    { label: 'G9: Find Investor', msg: 'Find investor contacts in the directory' },
    { label: 'G2: Research SEO', msg: 'Research SEO strategy' },
    { label: 'G10: Code Review', msg: 'Code review' },
    { label: 'G7: Health Check', msg: 'Health check' },
    { label: 'G9: Find Partners', msg: 'Find partner contacts for app founders' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-6 right-6 w-[480px] max-w-[calc(100vw-48px)] h-[680px] max-h-[calc(100vh-100px)] bg-white border border-slate-200 rounded-3xl shadow-2xl z-[150] flex flex-col overflow-hidden"
        >
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">Command Center</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {activeWorkflow 
                      ? `${activeWorkflow}: ${WORKFLOWS.find(w => w.id === activeWorkflow)?.name || 'Active'}` 
                      : 'Awaiting Orders'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[9px] font-bold text-slate-500 uppercase">
                {AGENTS.CORE.find(a => a.id === leadAgent)?.name || 'Lee Prime'}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-50/50">
            {messages.map((msg, i) => {
              const agent = AGENTS.CORE.find(a => a.id === msg.agent);
              return (
                <motion.div 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[88%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-slate-900 text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {msg.role === 'assistant' && agent && (
                      <agent.icon size={10} className={agent.text} />
                    )}
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {msg.role === 'user' ? 'Commander' : agent?.name || 'Agent Lee'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400">
                <RefreshCcw size={14} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {AGENTS.CORE.find(a => a.id === leadAgent)?.name || 'Lee Prime'} processing...
                </span>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
              {quickActions.map(action => (
                <button 
                  key={action.label}
                  onClick={() => handleSend(action.msg)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all whitespace-nowrap"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Issue command to Lee Prime..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all pr-14"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PipelineStrip = () => {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            i < 3 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : 
            i === 3 ? "bg-blue-500 animate-pulse" : "bg-slate-200"
          )} />
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            i <= 3 ? "text-slate-900" : "text-slate-400"
          )}>
            {step.label}
          </span>
          {i < PIPELINE_STEPS.length - 1 && (
            <div className="w-6 h-[1px] bg-slate-200 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
};

const Card = ({ children, className, title, badge }: { children: React.ReactNode, className?: string, title?: string, badge?: string, key?: any }) => (
  <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
    {(title || badge) && (
      <div className="flex items-center justify-between mb-1">
        {title && <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>}
        {badge && <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded uppercase text-slate-600">{badge}</span>}
      </div>
    )}
    {children}
  </div>
);

const Button = ({ children, className, variant = 'primary', icon: Icon, onClick, disabled }: { children?: React.ReactNode, className?: string, variant?: 'primary' | 'secondary' | 'outline' | 'ghost', icon?: any, onClick?: () => void, disabled?: boolean }) => {
  const variants = {
    primary: 'bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm',
    outline: 'bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-500 font-bold hover:text-slate-900 hover:bg-slate-100',
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

// --- Tab Views ---

const LaunchesView = ({ isBuilding, buildProgress, startBuild }: { isBuilding: boolean, buildProgress: number, startBuild: () => void }) => (
  <div className="space-y-8">

    {/* Studio Transfer Row */}
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={() => eventBus.emit('navigate:page', { page: 'code' })}
        className="flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 hover:shadow-md transition-all"
      >
        <Code size={14} /> Code Studio
      </button>
      <button
        onClick={() => eventBus.emit('navigate:page', { page: 'creators' })}
        className="flex items-center justify-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-100 hover:shadow-md transition-all"
      >
        <Palette size={14} /> Creator Studio
      </button>
      <button
        onClick={() => eventBus.emit('navigate:page', { page: 'vm' })}
        className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 hover:shadow-md transition-all"
      >
        <Server size={14} /> VM
      </button>
    </div>

    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Drafts</span>
        <span className="text-xs font-mono text-slate-300">01</span>
      </div>
      <Card title="Marketing Site" badge="Draft">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Alpha Landing</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Readiness: 40%</p>
          </div>
          <Button variant="outline" className="px-4 py-2">Open</Button>
        </div>
      </Card>
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">In Progress</span>
        <span className="text-xs font-mono text-slate-300">01</span>
      </div>
      <Card title="Digital Product" badge={isBuilding ? "Building" : "Packaging"}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">Summer Drop</h3>
          <span className="text-xs font-bold text-blue-600">{isBuilding ? `${buildProgress}%` : '75%'}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full bg-blue-600 shadow-sm transition-all duration-300",
              isBuilding ? "bg-emerald-500" : "bg-blue-600"
            )} 
            style={{ width: `${isBuilding ? buildProgress : 75}%` }} 
          />
        </div>
        <div className="flex gap-3 mt-5">
          <Button 
            variant="secondary" 
            className="flex-1" 
            icon={isBuilding ? RefreshCcw : Rocket} 
            onClick={startBuild}
            disabled={isBuilding}
          >
            {isBuilding ? 'Processing...' : 'Run Pipeline'}
          </Button>
          <Button variant="outline" icon={MoreHorizontal} className="px-3" />
        </div>
      </Card>
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Live</span>
        <span className="text-xs font-mono text-slate-300">01</span>
      </div>
      <Card title="Full-stack App" badge="Healthy">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Nexus Prime</h3>
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-slate-500 truncate">
          https://nexus.prime.io
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" icon={ExternalLink}>Visit</Button>
          <Button variant="outline" className="flex-1" icon={RefreshCcw}>Re-publish</Button>
        </div>
      </Card>
    </section>
  </div>
);

const CodeView = ({ onPush, onPull }: { onPush: () => void, onPull: () => void }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <Code size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Code Studio</h2>
          <p className="text-xs text-slate-500">Manage source and VM synchronization</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" icon={Download} onClick={onPull} className="py-2">Pull</Button>
        <Button variant="primary" icon={Upload} onClick={onPush} className="py-2">Push</Button>
      </div>
    </div>

    {/* Transfer Banner */}
    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
        <ArrowLeftRight size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-indigo-900">Direct Studio Transfer</div>
        <div className="text-[10px] text-indigo-600">Open your project in the full IDE or Creator Studio</div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => eventBus.emit('navigate:page', { page: 'code' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
        >
          <Code size={12} /> Full IDE
        </button>
        <button
          onClick={() => eventBus.emit('navigate:page', { page: 'creators' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-all"
        >
          <Palette size={12} /> Creator
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Source Control">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <FileCode size={20} className="text-blue-500" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Main Workspace</span>
                  <span className="text-[10px] text-slate-400 font-mono">/src/agent-lee-core</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Synced</span>
                <ChevronDown size={18} className="text-slate-400" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer opacity-60 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <Layers size={20} className="text-slate-500" />
                <span className="text-sm font-bold text-slate-900">Import GitHub Repo</span>
              </div>
              <Link2 size={18} className="text-slate-400" />
            </div>
          </div>
        </Card>

        <Card title="VM File System" badge="Z1_WRITE">
          <div className="space-y-1 font-mono text-[11px]">
            {[
              { name: 'server.ts', size: '4.2kb', type: 'file' },
              { name: 'engine/', size: '--', type: 'dir' },
              { name: 'engine/core.ts', size: '12.8kb', type: 'file' },
              { name: 'engine/utils.ts', size: '2.1kb', type: 'file' },
              { name: 'package.json', size: '1.1kb', type: 'file' },
              { name: 'dist/', size: '--', type: 'dir' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded group cursor-pointer">
                {f.type === 'dir' ? <Database size={14} className="text-amber-500" /> : <FileText size={14} className="text-blue-400" />}
                <span className="flex-1 text-slate-700">{f.name}</span>
                <span className="text-slate-300 group-hover:text-slate-500 transition-colors">{f.size}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="VM Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Environment</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Development</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>CPU Usage</span>
                <span>12%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[12%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Memory</span>
                <span>1.2GB / 4GB</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[30%]" />
              </div>
            </div>
            <Button variant="outline" className="w-full py-2" icon={Terminal}>Open Terminal</Button>
          </div>
        </Card>

        <Card title="Build Profile">
          <div className="flex flex-wrap gap-2">
            {['Static', 'Next.js', 'Node API', 'Full-stack'].map(p => (
              <button key={p} className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                p === 'Full-stack' ? "bg-emerald-600 text-white border-emerald-500 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}>
                {p}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

const CreatorView = ({ onGenerate, onPush }: { onGenerate: () => void, onPush: () => void }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
          <Palette size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Creator Studio</h2>
          <p className="text-xs text-slate-500">Asset generation and media pipeline</p>
        </div>
      </div>
      <Button variant="primary" icon={Upload} onClick={onPush} className="py-2">Push to VM</Button>
    </div>

    {/* Transfer Banner */}
    <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
      <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
        <ArrowLeftRight size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-rose-900">Direct Studio Transfer</div>
        <div className="text-[10px] text-rose-600">Move your creative project to the full Creator Studio or Code IDE</div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => eventBus.emit('navigate:page', { page: 'creators' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-all"
        >
          <Palette size={12} /> Full Studio
        </button>
        <button
          onClick={() => eventBus.emit('navigate:page', { page: 'code' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
        >
          <Code size={12} /> Code IDE
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Asset Readiness">
        <div className="space-y-4">
          {[
            { label: 'Cover Image', ok: true, size: '2.4MB' },
            { label: 'Product Description', ok: true, size: '12kb' },
            { label: 'Thumbnail Set', ok: false, size: '--' },
            { label: 'Press Kit', ok: false, size: '--' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                {item.ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-slate-200" />}
                <div>
                  <span className="text-sm font-bold text-slate-700 block">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.size}</span>
                </div>
              </div>
              <Button variant="ghost" className="p-2 h-auto" icon={MoreHorizontal} />
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="AI Generation">
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="justify-start text-left px-5" icon={Palette} onClick={onGenerate}>Generate Landing Copy</Button>
            <Button variant="outline" className="justify-start text-left px-5" icon={Search} onClick={onGenerate}>Generate SEO Pack</Button>
            <Button variant="outline" className="justify-start text-left px-5" icon={Layout} onClick={onGenerate}>Generate Social Pack</Button>
            <Button variant="secondary" className="mt-3 py-4 bg-rose-600 hover:bg-rose-700" onClick={onGenerate}>Generate All Assets</Button>
          </div>
        </Card>

        <Card title="Media Pipeline" badge="Active">
          <div className="space-y-3">
            {[
              { name: 'Optimizing Images', progress: 100, status: 'done' },
              { name: 'Generating Metadata', progress: 45, status: 'running' },
              { name: 'Packaging Assets', progress: 0, status: 'idle' },
            ].map((p, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className={cn(p.status === 'idle' ? "text-slate-400" : "text-slate-700")}>{p.name}</span>
                  <span className="text-slate-400">{p.progress}%</span>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      p.status === 'done' ? "bg-emerald-500" : p.status === 'running' ? "bg-rose-500 animate-pulse" : "bg-slate-200"
                    )} 
                    style={{ width: `${p.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

const PublishView = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 gap-4">
      <Card title="Web" badge="Connected">
        <div className="flex flex-col items-center gap-3 py-3">
          <Globe size={32} className="text-blue-500" />
          <span className="text-sm font-bold text-slate-900">Vercel</span>
          <Button variant="outline" className="w-full py-2 text-[10px]">Publish</Button>
        </div>
      </Card>
      <Card title="Store" badge="Ready">
        <div className="flex flex-col items-center gap-3 py-3">
          <Shield size={32} className="text-emerald-500" />
          <span className="text-sm font-bold text-slate-900">Stripe</span>
          <Button variant="outline" className="w-full py-2 text-[10px]">Connect</Button>
        </div>
      </Card>
      <Card title="Social" badge="Idle">
        <div className="flex flex-col items-center gap-3 py-3">
          <Send size={32} className="text-indigo-500" />
          <span className="text-sm font-bold text-slate-900">X / Twitter</span>
          <Button variant="outline" className="w-full py-2 text-[10px]">Schedule</Button>
        </div>
      </Card>
      <Card title="SEO" badge="Active">
        <div className="flex flex-col items-center gap-3 py-3">
          <Search size={32} className="text-amber-500" />
          <span className="text-sm font-bold text-slate-900">Sitemap</span>
          <Button variant="outline" className="w-full py-2 text-[10px]">Update</Button>
        </div>
      </Card>
    </div>

    <div className="space-y-3">
      <Button variant="primary" className="w-full py-5 text-sm" icon={Rocket}>Publish Everywhere</Button>
      <Button variant="outline" className="w-full py-4">Publish Web Only</Button>
    </div>
  </div>
);

const MonitorView = () => (
  <div className="space-y-8">
    <Card title="Launch Health">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-900">HTTP 200 OK</span>
          </div>
          <span className="text-xs font-mono text-slate-400">42ms</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Perf</div>
            <div className="text-lg font-black text-emerald-600">98</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">SEO</div>
            <div className="text-lg font-black text-blue-600">92</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">SSL</div>
            <div className="text-lg font-black text-emerald-600">A+</div>
          </div>
        </div>
      </div>
    </Card>

    <Card title="Pipeline Timeline">
      <div className="space-y-5">
        {[
          { label: 'Build Started', time: '21:45:12', status: 'done' },
          { label: 'Assets Packaged', time: '21:46:05', status: 'done' },
          { label: 'Publishing to Vercel', time: '21:46:42', status: 'running' },
          { label: 'Social Announcement', time: '--:--:--', status: 'idle' },
        ].map((step, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                step.status === 'done' ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                step.status === 'running' ? "bg-blue-500 border-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.3)]" :
                "bg-transparent border-slate-200"
              )} />
              {i < 3 && <div className="w-[1px] h-8 bg-slate-100" />}
            </div>
            <div className="flex-1 flex justify-between items-start">
              <span className={cn("text-sm font-bold", step.status === 'idle' ? "text-slate-300" : "text-slate-900")}>{step.label}</span>
              <span className="text-[10px] font-mono text-slate-400">{step.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const ConnectionsView = () => (
  <div className="space-y-8">
    <section className="space-y-4">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Web & Hosting</span>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <div>
              <div className="text-sm font-bold text-slate-900">Vercel</div>
              <div className="text-[10px] text-emerald-600 font-mono uppercase font-bold">Connected</div>
            </div>
          </div>
          <Button variant="outline" className="px-4 py-2">Test</Button>
        </div>
        <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm opacity-60">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 font-bold">G</div>
            <div>
              <div className="text-sm font-bold text-slate-900">GitHub</div>
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Not Linked</div>
            </div>
          </div>
          <Button variant="outline" className="px-4 py-2">Connect</Button>
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Social & Distribution</span>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">X</div>
            <div>
              <div className="text-sm font-bold text-slate-900">X / Twitter</div>
              <div className="text-[10px] text-emerald-600 font-mono uppercase font-bold">Connected</div>
            </div>
          </div>
          <Button variant="outline" className="px-4 py-2">Test</Button>
        </div>
      </div>
    </section>
  </div>
);

const EcosystemView = () => {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const toggleConnect = (id: string) => {
    setConnected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    {
      title: "Freelance Marketplaces",
      icon: Briefcase,
      links: [
        { id: "fiverr", name: "Fiverr", url: "https://www.fiverr.com" },
        { id: "upwork", name: "Upwork", url: "https://www.upwork.com" },
      ]
    },
    {
      title: "App Distribution",
      icon: Smartphone,
      links: [
        { id: "googleplay", name: "Google Play", url: "https://play.google.com/console" },
        { id: "appstore", name: "Apple App Store", url: "https://developer.apple.com/app-store" },
      ]
    },
    {
      title: "Domain & Hosting",
      icon: Server,
      links: [
        { id: "godaddy", name: "GoDaddy", url: "https://www.godaddy.com" },
        { id: "namecheap", name: "Namecheap", url: "https://www.namecheap.com" },
      ]
    },
    {
      title: "Content Creation",
      icon: Video,
      links: [
        { id: "youtube", name: "YouTube", url: "https://studio.youtube.com" },
        { id: "tiktok", name: "TikTok", url: "https://www.tiktok.com/creator-center" },
        { id: "instagram", name: "Instagram", url: "https://creators.instagram.com" },
        { id: "patreon", name: "Patreon", url: "https://www.patreon.com" },
        { id: "kofi", name: "Ko-fi", url: "https://ko-fi.com" },
      ]
    },
    {
      title: "Digital Products",
      icon: ShoppingCart,
      links: [
        { id: "gumroad", name: "Gumroad", url: "https://gumroad.com" },
        { id: "shopify", name: "Shopify", url: "https://www.shopify.com" },
        { id: "etsy", name: "Etsy", url: "https://www.etsy.com" },
        { id: "sellfy", name: "Sellfy", url: "https://sellfy.com" },
        { id: "stripe", name: "Stripe", url: "https://stripe.com" },
      ]
    },
    {
      title: "Creative Platforms",
      icon: Music,
      links: [
        { id: "bandcamp", name: "Bandcamp", url: "https://bandcamp.com" },
        { id: "soundcloud", name: "SoundCloud", url: "https://soundcloud.com" },
        { id: "artstation", name: "ArtStation", url: "https://www.artstation.com" },
        { id: "behance", name: "Behance", url: "https://www.behance.net" },
      ]
    },
    {
      title: "Marketing & SEO",
      icon: TrendingUp,
      links: [
        { id: "googleads", name: "Google Ads", url: "https://ads.google.com" },
        { id: "metaads", name: "Meta Ads Manager", url: "https://business.facebook.com" },
        { id: "semrush", name: "SEMrush", url: "https://www.semrush.com" },
        { id: "ahrefs", name: "Ahrefs", url: "https://ahrefs.com" },
      ]
    },
    {
      title: "Legal & Business",
      icon: Gavel,
      links: [
        { id: "sba", name: "U.S. SBA", url: "https://www.sba.gov" },
        { id: "irs", name: "IRS", url: "https://www.irs.gov" },
        { id: "uspto", name: "USPTO", url: "https://www.uspto.gov" },
        { id: "state", name: "State Registration", url: "https://www.wdfi.org" },
      ]
    },
    {
      title: "Funding & Investment",
      icon: DollarSign,
      links: [
        { id: "kickstarter", name: "Kickstarter", url: "https://www.kickstarter.com" },
        { id: "angellist", name: "AngelList", url: "https://wellfound.com" },
        { id: "ycombinator", name: "Y Combinator", url: "https://www.ycombinator.com" },
        { id: "indiegogo", name: "Indiegogo", url: "https://www.indiegogo.com" },
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900">Launch Ecosystem</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Connect your accounts to enable Agent Lee to automate your launch process. 
          Once linked, the agent can handle publishing, distribution, and marketing on your behalf.
        </p>
      </div>

      {categories.map((cat, i) => (
        <section key={i} className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <cat.icon size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{cat.title}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cat.links.map(link => (
              <div key={link.id} className="group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors",
                      connected[link.id] ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                    )}>
                      {link.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{link.name}</h4>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 hover:text-blue-500 flex items-center gap-1 mt-0.5"
                      >
                        {new URL(link.url).hostname} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  
                  <Button 
                    variant={connected[link.id] ? "outline" : "primary"}
                    className="py-1.5 px-3 h-auto text-[10px]"
                    onClick={() => toggleConnect(link.id)}
                  >
                    {connected[link.id] ? "Linked" : "Connect"}
                  </Button>
                </div>
                
                {connected[link.id] && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white">
                    <CheckCircle2 size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const DirectoryView = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  const filteredData = DIRECTORY_DATA.filter(item => 
    (filter === 'All' || item.profession === filter) &&
    (item.company.toLowerCase().includes(search.toLowerCase()) || 
     item.category.toLowerCase().includes(search.toLowerCase()) ||
     item.profession.toLowerCase().includes(search.toLowerCase()))
  );

  const professions = ['All', 'App Founders', 'Writers', 'Artists', 'Influencers', 'Marketers', 'Investors', 'Entertainment'];

  return (
    <div className="space-y-8 pb-20">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900">Master Directory</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          A production-ready CRM foundation for every user journey stage. 
          Find the right partners, platforms, and funding for your profession.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30 bg-white/80 backdrop-blur-md py-4 -mx-1 px-1">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search company, category, or profession..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
          {professions.map(p => (
            <button 
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border",
                filter === p 
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.length > 0 ? filteredData.map((item, i) => (
          <Card key={i} className="hover:border-emerald-500 hover:shadow-md transition-all group border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{item.profession}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1 group-hover:text-emerald-700 transition-colors">{item.company}</h3>
              </div>
              <span className={cn(
                "px-2 py-1 text-[9px] font-bold rounded uppercase border",
                item.stage === 'Early' ? "bg-blue-50 text-blue-600 border-blue-100" :
                item.stage === 'Launch' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                item.stage === 'Scale' ? "bg-purple-50 text-purple-600 border-purple-100" :
                "bg-slate-50 text-slate-500 border-slate-200"
              )}>
                {item.stage}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-[11px] mb-4">
              <div>
                <div className="text-slate-400 uppercase font-bold text-[9px] mb-1 tracking-tighter">Subcategory</div>
                <div className="text-slate-700 font-bold">{item.subcategory}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase font-bold text-[9px] mb-1 tracking-tighter">Contact Route</div>
                <div className="text-blue-600 font-mono truncate hover:underline cursor-pointer">{item.contactRoute}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Target size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Outreach Angle</div>
                  <span className="text-[10px] text-slate-600 italic leading-relaxed">"{item.outreachAngle}"</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Asset Needed</div>
                  <span className="text-[10px] text-slate-700 font-bold">{item.assetNeeded}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
                <Zap size={14} className="fill-emerald-600" />
                {item.expectedOutcome}
              </div>
              <a 
                href={item.website ? `https://${item.website}` : '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all"
              >
                Visit <ExternalLink size={10} />
              </a>
            </div>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Search size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No contacts found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearch(''); setFilter('All'); }}>Clear All Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

const VMView = () => {
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Agent Lee VM v2.4.0 initialized.',
    'System: Sovereign OS Z-Series',
    'Status: Operational',
    'Z0_READ capability granted.',
    'Waiting for command...',
  ]);

  return (
    <div className="space-y-8 pb-20">
      <div className="px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Server size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Sovereign VM</h2>
            <p className="text-sm text-slate-500">Agent Lee's private execution environment</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="px-4 py-2 bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">lee-vm-01 : bash</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-slate-500">SSH: 127.0.0.1:2222</span>
                <Maximize2 size={12} className="text-slate-500" />
              </div>
            </div>
            <div className="p-6 font-mono text-xs text-emerald-400 space-y-1 h-[400px] overflow-y-auto no-scrollbar">
              {terminalLines.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className="text-slate-500 shrink-0">$</span>
                  <span className="break-all">{line}</span>
                </div>
              ))}
              <div className="flex gap-3 animate-pulse">
                <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className="text-slate-500 shrink-0">$</span>
                <div className="w-2 h-4 bg-emerald-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card title="Push Data" className="border-indigo-100 bg-indigo-50/30">
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                  <Upload size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Push to VM</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Sync local studio data to Agent Lee's environment</p>
                </div>
                <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700">Initiate Push</Button>
              </div>
            </Card>
            <Card title="Pull Data" className="border-emerald-100 bg-emerald-50/30">
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
                  <Download size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pull from VM</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Retrieve artifacts and logs from the sovereign VM</p>
                </div>
                <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700">Initiate Pull</Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="VM Resources">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu size={20} className="text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700">CPU Cores</span>
                </div>
                <span className="text-xs font-mono font-bold">8 vCPU</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive size={20} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-700">Storage</span>
                </div>
                <span className="text-xs font-mono font-bold">128GB SSD</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Network size={20} className="text-teal-500" />
                  <span className="text-xs font-bold text-slate-700">Network</span>
                </div>
                <span className="text-xs font-mono font-bold">10 Gbps</span>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                  <span>Uptime</span>
                  <span>14d 2h 12m</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Active Processes">
            <div className="space-y-3">
              {[
                { name: 'lee-prime-core', cpu: '2.4%', mem: '450MB' },
                { name: 'shield-aegis-v2', cpu: '0.8%', mem: '120MB' },
                { name: 'nexus-conductor', cpu: '1.2%', mem: '310MB' },
                { name: 'sage-archiver', cpu: '0.1%', mem: '890MB' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-700">{p.name}</span>
                  <div className="flex gap-3 text-[9px] font-mono text-slate-400">
                    <span>{p.cpu}</span>
                    <span>{p.mem}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Button variant="outline" className="w-full py-4 border-rose-200 text-rose-600 hover:bg-rose-50" icon={RefreshCw}>Restart VM</Button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function AgentLeeLaunchPad() {
  const [activeTab, setActiveTab] = useState<TabId>('launches');
  const [activeLaunch, setActiveLaunch] = useState('Nexus Prime');
  const [showNewLaunch, setShowNewLaunch] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [systemMode, setSystemMode] = useState('BALANCED');
  const [activeAgents, setActiveAgents] = useState<string[]>(['LEE_PRIME', 'SHIELD', 'CLERK']);
  const [reports, setReports] = useState<{ id: string, agent: string, content: string, time: string, type: 'info' | 'success' | 'warning' | 'error' }[]>([
    { id: 'R1', agent: 'CLERK', content: 'System initialized in BALANCED mode.', time: '13:41:01', type: 'info' },
    { id: 'R2', agent: 'SHIELD', content: 'Z0_READ capability granted to all core agents.', time: '13:41:05', type: 'success' },
    { id: 'R3', agent: 'SAGE', content: 'Memory Lake snapshot completed.', time: '13:42:10', type: 'info' },
  ]);

  const currentMode = MODES.find(m => m.id === systemMode) || MODES[1];

  const startBuild = () => {
    setIsBuilding(true);
    setBuildProgress(0);
    setActiveAgents(prev => [...new Set([...prev, 'NOVA', 'NEXUS'])]);
    
    setReports(prev => [
      { id: Date.now().toString(), agent: 'NEXUS', content: 'Initiating G6 Deployment workflow.', time: new Date().toLocaleTimeString(), type: 'info' },
      ...prev
    ]);

    const interval = setInterval(() => {
      setBuildProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBuilding(false);
          setReports(r => [
            { id: Date.now().toString(), agent: 'MARSHAL', content: 'Build verified. Ready for distribution.', time: new Date().toLocaleTimeString(), type: 'success' },
            ...r
          ]);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const generateAsset = async (type: string) => {
    setIsCommandCenterOpen(true);
    // This will be handled by the CommandCenter if we pass a trigger, 
    // but for now let's just simulate it here or use a global message.
  };

  const renderTabContent = () => {
    const handlePush = () => {
      setIsCommandCenterOpen(true);
      setReports(prev => [
        { id: Date.now().toString(), agent: 'NEXUS', content: 'Initiating data push to Sovereign VM.', time: new Date().toLocaleTimeString(), type: 'info' },
        ...prev
      ]);
    };

    const handlePull = () => {
      setIsCommandCenterOpen(true);
      setReports(prev => [
        { id: Date.now().toString(), agent: 'SAGE', content: 'Pulling latest artifacts from Memory Lake.', time: new Date().toLocaleTimeString(), type: 'info' },
        ...prev
      ]);
    };

    switch (activeTab) {
      case 'launches': return <LaunchesView isBuilding={isBuilding} buildProgress={buildProgress} startBuild={startBuild} />;
      case 'code': return <CodeView onPush={handlePush} onPull={handlePull} />;
      case 'creator': return <CreatorView onGenerate={() => setIsCommandCenterOpen(true)} onPush={handlePush} />;
      case 'publish': return <PublishView />;
      case 'monitor': return <MonitorView />;
      case 'connections': return <ConnectionsView />;
      case 'ecosystem': return <EcosystemView />;
      case 'directory': return <DirectoryView />;
      case 'vm': return <VMView />;
      default: return <LaunchesView isBuilding={isBuilding} buildProgress={buildProgress} startBuild={startBuild} />;
    }
  };

  const AgentStatus = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Agents</span>
        <span className="text-[10px] font-mono text-slate-300">{activeAgents.length}/{AGENTS.CORE.length}</span>
      </div>
      <div className="space-y-1">
        {AGENTS.CORE.map(agent => {
          const isActive = activeAgents.includes(agent.id);
          return (
            <div 
              key={agent.id} 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                isActive ? "bg-white shadow-sm border border-slate-100" : "opacity-40 grayscale"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isActive ? `${agent.bg} ${agent.text}` : "bg-slate-100 text-slate-400"
              )}>
                <agent.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-900 truncate">{agent.name}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-tighter truncate">{agent.role}</div>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const GovernanceMode = () => (
    <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Mode</span>
        <div className={cn("w-2 h-2 rounded-full", `bg-${currentMode.color}-500 animate-pulse`)} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-black tracking-tighter">{systemMode}</span>
        <button 
          onClick={() => {
            const nextIdx = (MODES.findIndex(m => m.id === systemMode) + 1) % MODES.length;
            setSystemMode(MODES[nextIdx].id);
          }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <div className="text-[8px] uppercase font-bold text-white/40">Max Agents</div>
          <div className="text-xs font-bold">{currentMode.maxAgents}</div>
        </div>
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <div className="text-[8px] uppercase font-bold text-white/40">Heavy Lane</div>
          <div className="text-xs font-bold">{currentMode.heavyLane ? 'ON' : 'OFF'}</div>
        </div>
      </div>
    </div>
  );

  const IntelligenceFeed = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Intelligence Feed</span>
        <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><Filter size={12} /></button>
      </div>
      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                  {AGENTS.GOVERNANCE.find(a => a.name === report.agent)?.icon ? 
                    React.createElement(AGENTS.GOVERNANCE.find(a => a.name === report.agent)!.icon, { size: 12 }) : 
                    <Bot size={12} />
                  }
                </div>
                <span className="text-[10px] font-bold text-slate-900">{report.agent}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">{report.time}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">{report.content}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const NavItems = () => (
    <nav className="space-y-1">
      {[
        { id: 'launches', icon: Rocket, label: 'Launches' },
        { id: 'code', icon: Code, label: 'Code Studio' },
        { id: 'creator', icon: Palette, label: 'Creator Studio' },
        { id: 'publish', icon: Globe, label: 'Distribution' },
        { id: 'directory', icon: BookOpen, label: 'Directory' },
        { id: 'vm', icon: Server, label: 'Sovereign VM' },
        { id: 'ecosystem', icon: Layers, label: 'Ecosystem' },
        { id: 'monitor', icon: Activity, label: 'Monitoring' },
        { id: 'connections', icon: Link2, label: 'Connections' },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id as TabId);
            setIsRightPanelOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
            activeTab === item.id 
              ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <item.icon size={18} className={cn(
            "transition-colors",
            activeTab === item.id ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
          )} />
          {item.label}
        </button>
      ))}
    </nav>
  );

  const ToolItems = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quick Tools</span>
        <Button 
          variant="primary" 
          className="w-full lg:justify-start" 
          icon={Plus}
          onClick={() => {
            setShowNewLaunch(true);
            setIsLeftPanelOpen(false);
          }}
        >
          <span>New Launch</span>
        </Button>
        <Button 
          variant="secondary" 
          className="w-full lg:justify-start bg-slate-900 hover:bg-black" 
          icon={Sparkles}
          onClick={() => setIsCommandCenterOpen(true)}
        >
          <span>Agent Lee</span>
        </Button>
        <Button variant="outline" className="w-full lg:justify-start" icon={Search}>
          <span>Search</span>
        </Button>
      </div>

      <div className="space-y-2">
        <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">System</span>
        <Button variant="ghost" className="w-full lg:justify-start" icon={Activity}>
          <span>Status</span>
        </Button>
        <Button variant="ghost" className="w-full lg:justify-start" icon={Database}>
          <span>Storage</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 overflow-hidden">
      
      {/* --- LANE 1: GOVERNANCE & AGENTS --- */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-slate-50 border-r border-slate-200 z-[70] transition-transform duration-300 md:relative md:translate-x-0 md:w-20 lg:w-72 flex flex-col overflow-hidden",
        isLeftPanelOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
            <Bot size={18} className="text-white" />
          </div>
          <span className="ml-3 text-sm font-black uppercase tracking-tighter text-slate-900 md:hidden lg:block">Agent Lee OS</span>
          <button className="md:hidden ml-auto p-2 text-slate-400" onClick={() => setIsLeftPanelOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          <GovernanceMode />
          <AgentStatus />
          <div className="md:hidden lg:block">
            <ToolItems />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
              <User size={16} />
            </div>
            <div className="md:hidden lg:block">
              <div className="text-xs font-bold truncate">Lee Leonard</div>
              <div className="text-[10px] text-slate-400 truncate">Sovereign Prime</div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- LANE 2: WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* --- TOP BAR --- */}
        <header className="flex-none border-b border-slate-200 bg-white z-40">
          <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setIsLeftPanelOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className={cn(
                  "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                  isBuilding ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
                )} />
                <span className="text-sm font-bold text-slate-700 truncate max-w-[120px] md:max-w-[200px]">
                  {isBuilding ? `G6 Deployment: ${buildProgress}%` : activeLaunch}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {['launches', 'code', 'creator', 'publish', 'directory', 'vm'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as TabId)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCommandCenterOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all"
              >
                <Sparkles size={14} className="text-emerald-400" />
                Command
              </button>
              <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsRightPanelOpen(true)}>
                <ActivityIcon size={20} />
              </button>
            </div>
          </div>

          {/* Studio Switcher Strip */}
          <div className="px-6 py-2 bg-slate-900 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Studios:</span>
            <button
              onClick={() => eventBus.emit('navigate:page', { page: 'deployment' })}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider shrink-0"
            >
              <Rocket size={10} /> Launch Pad
            </button>
            <div className="w-px h-4 bg-slate-700 shrink-0" />
            <button
              onClick={() => eventBus.emit('navigate:page', { page: 'code' })}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/80 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all shrink-0"
            >
              <Code size={10} /> Code Studio
            </button>
            <button
              onClick={() => eventBus.emit('navigate:page', { page: 'creators' })}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/80 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-rose-600 transition-all shrink-0"
            >
              <Palette size={10} /> Creator Studio
            </button>
            <div className="w-px h-4 bg-slate-700 shrink-0" />
            <button
              onClick={() => eventBus.emit('navigate:page', { page: 'vm' })}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/80 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-slate-600 transition-all shrink-0"
            >
              <Server size={10} /> VM
            </button>
            <button
              onClick={() => eventBus.emit('navigate:page', { page: 'memory' })}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/80 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-amber-600 transition-all shrink-0"
            >
              <Database size={10} /> Memory Lake
            </button>
            <div className="ml-auto shrink-0 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">All Studios Linked</span>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* --- LANE 3: INTELLIGENCE & REPORTS --- */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-80 bg-slate-50 border-l border-slate-200 z-[70] transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col overflow-hidden",
        isRightPanelOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Intelligence Center</span>
          <button className="lg:hidden ml-auto p-2 text-slate-400" onClick={() => setIsRightPanelOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          <IntelligenceFeed />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Memory Lake</span>
              <span className="text-[10px] font-mono text-slate-300">Z2_READ</span>
            </div>
            <Card className="bg-white p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-900">Sage Memory</div>
                  <div className="text-[9px] text-slate-400">Last snapshot: 12m ago</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-3/4" />
              </div>
              <button className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                Explore Archives
              </button>
            </Card>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shield Aegis</span>
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="text-[10px] font-bold text-emerald-700 mb-1">Zone Enforcement Active</div>
            <div className="text-[9px] text-emerald-600 leading-relaxed">All Z1_WRITE operations require explicit approval gates.</div>
          </div>
        </div>
      </aside>

      {/* --- NEW LAUNCH TEMPLATE SHEET --- */}
      {showNewLaunch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900">New Launch</h2>
                <p className="text-sm text-slate-500 mt-1">Select a template to get started</p>
              </div>
              <button onClick={() => setShowNewLaunch(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Marketing Site', icon: Layout, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Digital Product', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Full-Stack App', icon: Code, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { label: 'Social Campaign', icon: Send, color: 'text-pink-500', bg: 'bg-pink-50' },
                { label: 'SEO Boost', icon: Search, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Music Drop', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
              ].map(t => (
                <button key={t.label} className="flex flex-col items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all group text-left">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", t.bg)}>
                    <t.icon size={24} className={t.color} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">{t.label}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Ready to deploy</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewLaunch(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => setShowNewLaunch(false)}>Continue</Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Global Overlay: Subtle Texture --- */}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}} />
    </div>
  );
}
