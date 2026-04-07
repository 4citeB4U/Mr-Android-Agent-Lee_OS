/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.WIDGET.POPUP
TAG: UI.COMPONENT.WIDGET.AGENTLEE.MINIMIZED

COLOR_ONION_HEX:
NEON=#FFD700
FLUO=#FFF176
PASTEL=#FFF9C4

ICON_ASCII:
family=lucide
glyph=radio-tower

5WH:
WHAT = Minimized popup widget for Agent Lee - operates independently when app is closed
WHY = Allows user to interact with Agent Lee via floating popup even when main app is minimized
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AgentLeeWidget.tsx
WHEN = 2026
HOW = Compact chat interface with voice input, text messaging, and background task dispatching

AGENTS:
ASSESS
ECHO
ROUTER

LICENSE:
MIT
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Mic, Send, X, Settings } from 'lucide-react';
import { eventBus } from '../core/EventBus';
import { FirebaseService } from '../core/FirebaseService';
import { WidgetCommandController } from '../core/WidgetCommandController';
import { v4 as uuidv4 } from 'uuid';

interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AgentLeeWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AgentLeeWidget: React.FC<AgentLeeWidgetProps> = ({ isOpen = false, onClose }) => {
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firebase = FirebaseService.getInstance();
  const widgetController = WidgetCommandController.getInstance();

  // Set up auth listener
  useEffect(() => {
    const currentUser = firebase.getCurrentUser();
    if (currentUser) {
      setUserId(currentUser.uid);
    }

    const unsubSignIn = eventBus.on('firebase:signed-in', (data: any) => {
      if (data.user) {
        setUserId(data.user.uid);
      }
    });

    const unsubAuthChange = eventBus.on('firebase:auth-change', (data: any) => {
      setUserId(data.user?.uid || null);
    });

    return () => {
      unsubSignIn();
      unsubAuthChange();
    };
  }, []);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg: Partial<WidgetMessage>) => {
    const newMessage: WidgetMessage = {
      id: uuidv4(),
      role: msg.role || 'user',
      content: msg.content || '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // Listen for background task responses
  useEffect(() => {
    const unsubCompleted = eventBus.on('backgroundTask:completed', (data: any) => {
      const { result } = data;
      if (result) {
        addMessage({
          role: 'assistant',
          content: result,
        });
      }
    });

    const unsubFailed = eventBus.on('backgroundTask:failed', (data: any) => {
      const { error } = data;
      addMessage({
        role: 'assistant',
        content: `I encountered an error: ${error}`,
      });
    });

    return () => {
      unsubCompleted();
      unsubFailed();
    };
  }, [addMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !userId) {
      alert('Please authenticate first');
      return;
    }

    // Add user message
    addMessage({
      role: 'user',
      content: inputValue,
    });

    // Send to background task controller
    try {
      eventBus.emit('widget:message', {
        message: inputValue,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[AgentLeeWidget] Failed to send message:', error);
      addMessage({
        role: 'assistant',
        content: 'Failed to process your message. Please try again.',
      });
    }

    setInputValue('');
  }, [inputValue, userId, addMessage]);

  const handleVoiceInput = useCallback(async () => {
    if (!userId) {
      alert('Please authenticate first');
      return;
    }

    setIsListening(true);

    try {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();

      if (!recognition) {
        addMessage({
          role: 'assistant',
          content: 'Voice recognition is not supported in your browser.',
        });
        setIsListening(false);
        return;
      }

      recognition.onstart = () => {
        console.log('[AgentLeeWidget] Voice listening started');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }

        if (transcript.trim()) {
          addMessage({
            role: 'user',
            content: transcript,
          });

          eventBus.emit('widget:message', {
            message: transcript,
            userId,
            timestamp: new Date().toISOString(),
            source: 'voice',
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[AgentLeeWidget] Voice recognition error:', event.error);
        addMessage({
          role: 'assistant',
          content: `Voice error: ${event.error}`,
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('[AgentLeeWidget] Voice listening ended');
      };

      recognition.start();
    } catch (error) {
      console.error('[AgentLeeWidget] Voice input error:', error);
      addMessage({
        role: 'assistant',
        content: 'Voice input is not available.',
      });
      setIsListening(false);
    }
  }, [userId, addMessage]);

  if (!isOpen && !isExpanded) {
    return (
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-[999]"
        title="Open Agent Lee Widget"
      >
        <MessageCircle size={24} />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[999]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-white">Agent Lee</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-white/40">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs">Start a conversation with Agent Lee</p>
              <p className="text-[10px] mt-2">Use text or voice input</p>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                        : 'bg-slate-700/40 text-white border border-white/10'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-3 bg-slate-850/80 rounded-b-2xl space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-grow px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>

        <button
          onClick={handleVoiceInput}
          disabled={isListening}
          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            isListening
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-slate-700/40 text-white/70 hover:bg-slate-700/60 border border-white/5'
          }`}
        >
          <Mic size={16} />
          {isListening ? 'Listening...' : 'Voice'}
        </button>
      </div>
    </motion.div>
  );
};

export default AgentLeeWidget;
