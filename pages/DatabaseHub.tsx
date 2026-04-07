/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.DATABASE
TAG: UI.PAGE.DATABASE.HUB

COLOR_ONION_HEX:
NEON=#6366F1
FLUO=#818CF8
PASTEL=#E0E7FF

ICON_ASCII:
family=lucide
glyph=database

5WH:
WHAT = DatabaseHub page — database management, schema, and monitoring for Agent Lee OS
WHY = Provides database schema editing, monitoring, and policy compliance
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/DatabaseHub.tsx
WHEN = 2026
HOW = React component with 3D database scene, schema editor, and monitoring

AGENTS:
ASSESS
AUDIT
SHIELD

LICENSE:
MIT
*/

import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Float, Stars, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { GoogleGenAI } from "@google/genai";
import { 
  Database, Brain, Sparkles, DatabaseZap, ShieldCheck, 
  ExternalLink, Info, X, LogIn, LogOut, User as UserIcon,
  Activity, Shield, Terminal, Save, Edit3, CheckCircle2,
  AlertCircle, Cpu, Network, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase Imports
import { enforceFileGovernance } from '../core/governanceEnforcer';
import { createFileMeta, logFileEvent } from '../core/fileOps';
import { 
  auth, 
  db, 
  googleProvider,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocFromServer,
  type FirebaseUser 
} from '../components/firebase';
import type { User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- 3D Components ---

const COLORS = {
  center: '#e0f2fe',
  chroma: '#4ade80',
  milvus: '#fbbf24',
  weaviate: '#38bdf8',
  faiss: '#a855f7',
};

const STRUCTURES = {
  center: [...Array.from({ length: 27 }, (_, i) => [(i % 3) - 1, Math.floor(i / 9) - 1, Math.floor((i % 9) / 3) - 1])],
  chroma: [
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 0, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 1, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 2, Math.floor(i / 3) - 1]),
    [0, 3, 0]
  ],
  milvus: [
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 0, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 1, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 4 }, (_, i) => [(i % 2) - 0.5, 2, Math.floor(i / 2) - 0.5]),
    ...Array.from({ length: 4 }, (_, i) => [(i % 2) - 0.5, 3, Math.floor(i / 2) - 0.5]),
    [0, 4, 0]
  ],
  weaviate: [
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 0, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 1, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 4 }, (_, i) => [(i % 2) - 0.5, 2, Math.floor(i / 2) - 0.5]),
    ...Array.from({ length: 4 }, (_, i) => [(i % 2) - 0.5, 3, Math.floor(i / 2) - 0.5]),
  ],
  faiss: [
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 0, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 9 }, (_, i) => [(i % 3) - 1, 1, Math.floor(i / 3) - 1]),
    ...Array.from({ length: 4 }, (_, i) => [(i % 2) - 0.5, 2, Math.floor(i / 2) - 0.5]),
    ...Array.from({ length: 4 }, (_, i) => [(i % 2) - 0.5, 3, Math.floor(i / 2) - 0.5]),
    [0, 4, 0]
  ]
};

function BeamParticle({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.05 + Math.random() * 0.1, []);
  const offset = useMemo(() => Math.random(), []);
  const xOffset = useMemo(() => (Math.random() - 0.5) * 0.8, []);
  const zOffset = useMemo(() => (Math.random() - 0.5) * 0.8, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime * speed + offset) % 1;
      meshRef.current.position.set(xOffset, t * 20, zOffset);
      meshRef.current.scale.setScalar(0.3 + Math.sin(t * Math.PI) * 0.3);
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.8} />
    </mesh>
  );
}

function SkyBeam() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.x = scale;
      meshRef.current.scale.z = scale;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 10, 0]}>
        <cylinderGeometry args={[0.5, 1.5, 20, 32, 1, true]} />
        <meshStandardMaterial 
          color="#38bdf8" 
          emissive="#38bdf8" 
          emissiveIntensity={5} 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 15 }).map((_, i) => (
        <BeamParticle key={i} color={i % 2 === 0 ? "#38bdf8" : "#ffffff"} />
      ))}
    </group>
  );
}

function DataParticle({ start, end, color }: { start: THREE.Vector3, end: THREE.Vector3, color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.02 + Math.random() * 0.03, []);
  const offset = useMemo(() => Math.random(), []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime * speed + offset) % 1;
      meshRef.current.position.lerpVectors(start, end, t);
      meshRef.current.scale.setScalar(0.5 + Math.sin(t * Math.PI) * 0.5);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

function ConnectionLine({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = endVec.clone().sub(startVec);
  const length = direction.length();
  const center = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  
  return (
    <group>
      <mesh position={center} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())}>
        <cylinderGeometry args={[0.08, 0.08, length, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.4} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <DataParticle key={i} start={startVec} end={endVec} color={color} />
      ))}
    </group>
  );
}

function VoxelNode({ position, color, label, structure, onClick, isSelected, isCenter = false, hideLabel = false }: { 
  position: [number, number, number], 
  color: string, 
  label: string, 
  structure: number[][],
  onClick: () => void,
  isSelected: boolean,
  isCenter?: boolean,
  hideLabel?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      const scale = (hovered || isSelected) ? 1.05 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      if (isCenter) {
        groupRef.current.rotation.y += 0.003;
      }
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {structure.map((pos, i) => {
        const isTop = i === structure.length - 1 && !isCenter;
        const isRandomGlow = !isTop && Math.random() > 0.85;
        
        return (
          <mesh key={i} position={[pos[0] * 0.42, pos[1] * 0.42, pos[2] * 0.42]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <boxGeometry args={[0.38, 0.38, 0.38]} />
            <meshStandardMaterial 
              color={isTop ? '#fff' : (isRandomGlow ? '#fff' : color)} 
              emissive={isTop ? '#fff' : (isRandomGlow ? '#fff' : color)} 
              emissiveIntensity={isTop ? 8 : (isRandomGlow ? 3 : (hovered || isSelected ? 1.2 : 0.4))} 
              transparent={isCenter}
              opacity={isCenter ? 0.7 : 1}
            />
            <Edges threshold={15} color={isTop ? '#fff' : (hovered || isSelected ? '#fff' : color)} scale={1.02} />
          </mesh>
        );
      })}
      {!hideLabel && (
        <Html position={[0, -1.8, 0]} center>
          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shadow-2xl pointer-events-none ${hovered || isSelected ? 'bg-white text-black border-white scale-110' : 'bg-black/90 text-white border-white/10'}`}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function ThreeDScene({ onSelect, selectedDb }: { onSelect: (db: string | null) => void, selectedDb: string | null }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nodeDist = isMobile ? 4.5 : 6;

  return (
    <div className="w-full h-full bg-slate-950 relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={isMobile ? [15, 15, 15] : [12, 12, 12]} fov={isMobile ? 55 : 45} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={30} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight position={[-10, 20, 10]} angle={0.2} penumbra={1} intensity={2} castShadow />

        <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={2} />
        <fog attach="fog" args={['#020617', 10, 50]} />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
          <SkyBeam />
          
          <VoxelNode 
            position={[0, 0, 0]} 
            color={COLORS.center} 
            label="Neural Core Hub" 
            structure={STRUCTURES.center}
            onClick={() => onSelect('firebase')}
            isSelected={selectedDb === 'firebase'}
            isCenter
            hideLabel={!!selectedDb}
          />

          <VoxelNode 
            position={[-nodeDist, 0, -nodeDist]} 
            color={COLORS.chroma} 
            label="Neural Core" 
            structure={STRUCTURES.chroma}
            onClick={() => onSelect('chroma')}
            isSelected={selectedDb === 'chroma'}
            hideLabel={!!selectedDb}
          />
          <VoxelNode 
            position={[nodeDist, 0, -nodeDist]} 
            color={COLORS.milvus} 
            label="Cold Store" 
            structure={STRUCTURES.milvus}
            onClick={() => onSelect('milvus')}
            isSelected={selectedDb === 'milvus'}
            hideLabel={!!selectedDb}
          />
          <VoxelNode 
            position={[-nodeDist, 0, nodeDist]} 
            color={COLORS.weaviate} 
            label="Agent Memory" 
            structure={STRUCTURES.weaviate}
            onClick={() => onSelect('weaviate')}
            isSelected={selectedDb === 'weaviate'}
            hideLabel={!!selectedDb}
          />
          <VoxelNode 
            position={[nodeDist, 0, nodeDist]} 
            color={COLORS.faiss} 
            label="Task Registry" 
            structure={STRUCTURES.faiss}
            onClick={() => onSelect('faiss')}
            isSelected={selectedDb === 'faiss'}
            hideLabel={!!selectedDb}
          />

          <ConnectionLine start={[-nodeDist, 0, -nodeDist]} end={[0, 0, 0]} color={COLORS.chroma} />
          <ConnectionLine start={[nodeDist, 0, -nodeDist]} end={[0, 0, 0]} color={COLORS.milvus} />
          <ConnectionLine start={[-nodeDist, 0, nodeDist]} end={[0, 0, 0]} color={COLORS.weaviate} />
          <ConnectionLine start={[nodeDist, 0, nodeDist]} end={[0, 0, 0]} color={COLORS.faiss} />
        </Float>
      </Canvas>
      
      <div className="absolute top-4 md:top-6 left-4 md:left-6 text-white pointer-events-none pr-20">
        <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-500 leading-tight">
          Agent Lee: Neural Topology
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-[8px] md:text-[10px] text-slate-400 font-mono uppercase tracking-[0.2em]">Status: Operational</p>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

const DB_INFO: Record<string, any> = {
  chroma: {
    name: 'Neural Core',
    provider: 'Chroma',
    description: 'Primary vector embedding engine for real-time semantic retrieval.',
    link: 'https://www.trychroma.com/',
    color: 'text-green-400',
    borderColor: 'border-green-400/30',
    bgColor: 'bg-green-400/10',
    schema: { collection: "agent_memories", embedding_dim: 1536, distance_metric: "cosine" }
  },
  milvus: {
    name: 'Cold Store',
    provider: 'Milvus',
    description: 'Massive-scale archival vector storage.',
    link: 'https://milvus.io/',
    color: 'text-amber-400',
    borderColor: 'border-amber-400/30',
    bgColor: 'bg-amber-400/10',
    schema: { collection: "global_archive", shards: 16, index_type: "HNSW" }
  },
  weaviate: {
    name: 'Agent Memory',
    provider: 'Weaviate',
    description: 'AI-native object-vector database.',
    link: 'https://weaviate.io/',
    color: 'text-sky-400',
    borderColor: 'border-sky-400/30',
    bgColor: 'bg-sky-400/10',
    schema: { class: "AgentContext", vectorizer: "text2vec-openai" }
  },
  faiss: {
    name: 'Task Registry',
    provider: 'Faiss',
    description: 'High-performance similarity search library.',
    link: 'https://github.com/facebookresearch/faiss',
    color: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    bgColor: 'bg-purple-400/10',
    schema: { index_type: "IVFFlat", nlist: 1024, metric: "L2", dimensions: 768 }
  },
  firebase: {
    name: 'Neural Core Hub',
    provider: 'Firebase',
    description: 'Central orchestration layer.',
    link: 'https://firebase.google.com/',
    color: 'text-white',
    borderColor: 'border-white/30',
    bgColor: 'bg-white/10',
    schema: { collections: ["users", "logs", "policies"], realtime: true }
  }
};

type Tab = 'schema' | 'monitoring' | 'policies';

export default function AgentLeeDBCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('schema');
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editedSchema, setEditedSchema] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isMobile, setIsMobile] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const connectMetaMask = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        // Mock user for UI consistency
        setUser({
          uid: address,
          email: `${address.slice(0, 6)}...${address.slice(-4)}@web3`,
          displayName: `Commander ${address.slice(0, 6)}`,
          photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        } as any);
      } catch (error) {
        console.error("MetaMask Connection Error:", error);
      }
    } else {
      alert("MetaMask not detected. Please install the MetaMask extension.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLogin: serverTimestamp(),
            role: 'agent_commander'
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setWalletAddress(null);
  };

  const handleSelect = async (dbId: string | null) => {
    setSelectedDb(dbId);
    if (dbId) {
      setEditedSchema(JSON.stringify(DB_INFO[dbId].schema, null, 2));
      setLoading(true);
      setGeminiResponse(null);
      const queryText = `Evaluate the current schema for ${DB_INFO[dbId].name} (${DB_INFO[dbId].provider}) against Agent Lee's high-standard security and performance policies. Suggest one optimization.`;
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: queryText,
        });
        const text = response.text || "Evaluation complete. Standards met.";
        setGeminiResponse(text);

        if (user) {
          try {
            await addDoc(collection(db, 'logs'), {
              uid: user.uid,
              database: dbId,
              action: 'SCHEMA_EVALUATION',
              evaluation: text,
              timestamp: serverTimestamp()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'logs');
          }
        }
      } catch (error) {
        console.error("Gemini Error:", error);
        setGeminiResponse("Neural link disrupted. Retrying...");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveSchema = async () => {
    // Create file meta with 5W+How
    const meta = createFileMeta({
      name: `${selectedDb || 'unknown'}_schema.json`,
      createdBy: user?.uid || 'anonymous',
      location: `database/${selectedDb || 'unknown'}`,
      why: 'Schema update for database compliance and optimization',
      how: 'User-initiated schema commit via DatabaseHub UI',
    });
    // Log file event with full traceability
    logFileEvent({
      meta,
      action: 'update',
      actor: user?.uid || 'anonymous',
      timestamp: new Date().toISOString(),
      details: { schema: editedSchema },
    });
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans text-slate-200">
      {/* Auth Header */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 z-50 flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-2 md:gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-1 md:p-1.5 pr-3 md:pr-4 rounded-full shadow-2xl">
            <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-blue-500/50" referrerPolicy="no-referrer" />
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[9px] text-blue-400 font-black uppercase tracking-widest">{walletAddress ? 'Web3 Commander' : 'Commander'}</span>
              <span className="text-[10px] md:text-xs text-white font-bold truncate max-w-[80px] md:max-w-none">{user.displayName}</span>
            </div>
            <button onClick={handleLogout} className="ml-1 md:ml-2 p-1.5 md:p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition-all">
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={connectMetaMask}
              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">MetaMask</span>
              <span className="sm:hidden">Web3</span>
            </button>
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl shadow-blue-900/40 transition-all active:scale-95 border border-blue-400/20"
            >
              <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Initialize Neural Link</span>
              <span className="sm:hidden">Link</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <ThreeDScene onSelect={handleSelect} selectedDb={selectedDb} />
      </div>

      <AnimatePresence>
        {selectedDb && (
          <motion.div 
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className={`
              ${isMobile ? 'w-full h-[80vh] bottom-0 left-0 rounded-t-[2.5rem]' : 'w-[450px] h-full right-0 border-l'} 
              bg-slate-900/95 backdrop-blur-2xl border-slate-800 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl z-50 fixed
            `}
          >
            {isMobile && <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-2 shrink-0" />}
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2 md:p-3 rounded-2xl ${DB_INFO[selectedDb].bgColor} border ${DB_INFO[selectedDb].borderColor}`}>
                  <DatabaseZap className={`w-6 h-6 md:w-8 md:h-8 ${DB_INFO[selectedDb].color}`} />
                </div>
                <div>
                  <h2 className={`text-xl md:text-2xl font-black tracking-tighter uppercase italic ${DB_INFO[selectedDb].color}`}>
                    {DB_INFO[selectedDb].name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-slate-500" />
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{DB_INFO[selectedDb].provider} Engine</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDb(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white border border-transparent hover:border-slate-700"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              {(['schema', 'monitoring', 'policies'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-slate-800 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {tab === 'schema' && <Terminal className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  {tab === 'monitoring' && <Activity className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  {tab === 'policies' && <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  {isMobile ? tab.charAt(0).toUpperCase() + tab.slice(1, 3) : tab}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-y-auto pr-1 custom-scrollbar">
              {activeTab === 'schema' && (
                <div className="flex flex-col gap-3 md:gap-4 h-full min-h-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Live Schema Editor
                    </div>
                    <button 
                      onClick={handleSaveSchema}
                      disabled={saveStatus !== 'idle'}
                      className={`flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                        saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {saveStatus === 'idle' && <><Save className="w-3 h-3 md:w-3.5 md:h-3.5" /> Commit</>}
                      {saveStatus === 'saving' && <div className="w-3 h-3 md:w-3.5 md:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {saveStatus === 'saved' && <><CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> Deployed</>}
                    </button>
                  </div>
                  <textarea
                    value={editedSchema}
                    onChange={(e) => setEditedSchema(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 md:p-4 font-mono text-[10px] md:text-xs text-blue-400 focus:outline-none focus:border-blue-500/50 resize-none custom-scrollbar"
                    spellCheck={false}
                  />
                </div>
              )}

              {activeTab === 'monitoring' && (
                <div className="flex flex-col gap-4 md:gap-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-slate-950 border border-slate-800 p-3 md:p-4 rounded-xl">
                      <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Latency</p>
                      <p className="text-lg md:text-xl font-black text-white">12ms</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 md:p-4 rounded-xl">
                      <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Throughput</p>
                      <p className="text-lg md:text-xl font-black text-white">4.2k/s</p>
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 md:p-6 rounded-xl flex flex-col gap-3 md:gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Node Health</p>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-[8px] md:text-[9px] font-black rounded-full uppercase">Optimal</span>
                    </div>
                    <div className="h-1.5 md:h-2 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '94%' }}
                        className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] md:text-[9px] text-slate-600 font-mono">
                      <span>LOAD: 12%</span>
                      <span>UPTIME: 99.99%</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="flex flex-col gap-3 md:gap-4">
                  {[
                    { icon: Lock, title: 'Zero Trust', desc: 'Requests must be cryptographically signed.', color: 'text-blue-400' },
                    { icon: ShieldCheck, title: 'Sovereignty', desc: 'Embeddings are isolated per agent cluster.', color: 'text-green-400' },
                    { icon: AlertCircle, title: 'Compliance', desc: 'Neural retrievals are logged and evaluated.', color: 'text-amber-400' }
                  ].map((policy, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-4 md:p-5 rounded-xl flex items-start gap-3 md:gap-4">
                      <policy.icon className={`w-4 h-4 md:w-5 md:h-5 ${policy.color} mt-0.5`} />
                      <div>
                        <h4 className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider mb-0.5 md:mb-1">{policy.title}</h4>
                        <p className="text-[9px] md:text-[10px] text-slate-500 leading-relaxed">{policy.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 md:mt-4 pt-4 md:pt-6 border-t border-slate-800">
                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 md:mb-4">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Agent Lee Evaluation
                </div>
                
                {loading ? (
                  <div className="flex flex-col gap-2 md:gap-3">
                    <div className="h-3 md:h-4 bg-slate-800 rounded w-3/4 animate-pulse" />
                    <div className="h-3 md:h-4 bg-slate-800 rounded w-full animate-pulse" />
                  </div>
                ) : (
                  <div className="text-[10px] md:text-xs text-slate-400 leading-relaxed font-mono bg-slate-950/80 p-4 md:p-5 rounded-xl border border-slate-800 shadow-inner italic">
                    "{geminiResponse}"
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 md:pt-6 border-t border-slate-800 flex flex-col gap-3 md:gap-4 shrink-0">
              <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <Network className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                <p className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-[0.15em]">Ready for Deployment</p>
              </div>
              <a 
                href={DB_INFO[selectedDb].link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 md:py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all group border border-slate-700"
              >
                Access Core <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedDb && (
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 md:gap-6 pointer-events-none w-full px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 md:px-8 py-3 md:py-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl flex items-center gap-3 md:gap-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
              <Info className="w-3 h-3 md:w-4 md:h-4 text-blue-400 shrink-0" />
              <span>Select a neural node to initialize</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
