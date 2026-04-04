'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ChatMessage,
  McqOption,
  QuestionMetadata,
  BotResponse,
} from '@/src/types/chat';
import MessageList from './MessageList';
import McqOptions from './McqOptions';
import ChatInput from './ChatInput';
import ProgressBar from './ProgressBar';
import CompletionBanner from './CompletionBanner';
import ChatSkeleton from './ChatSkeleton';

import { API_BASE } from '@/lib/api';

const STORAGE_KEY_PREFIX = 'chat_session_';
const SLOW_RESPONSE_MS = 10_000;
const MAX_RETRIES = 2;

interface HybridChatProps {
  assignmentId: string;
}

interface PersistedSession {
  sessionId: string;
  progress: number;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
}

function getStorageKey(assignmentId: string): string {
  return `${STORAGE_KEY_PREFIX}${assignmentId}`;
}

function loadPersistedSession(assignmentId: string): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(assignmentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (parsed.sessionId) return parsed;
    return null;
  } catch {
    return null;
  }
}

function savePersistedSession(assignmentId: string, sessionId: string, progress: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      getStorageKey(assignmentId),
      JSON.stringify({ sessionId, progress })
    );
  } catch {
    // storage quota exceeded
  }
}

function clearPersistedSession(assignmentId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey(assignmentId));
}

export default function HybridChat({ assignmentId }: HybridChatProps) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<{
    type: 'mcq_choice' | 'free_text';
    content: string;
    choiceValue?: string;
  } | null>(null);

  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'system',
      message_type: 'system_message',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const startSlowResponseTimer = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        addSystemMessage('Taking a moment... please wait.');
      }
    }, SLOW_RESPONSE_MS);
  }, [addSystemMessage]);

  const clearSlowResponseTimer = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let active = true;

    async function restoreExistingSession(existingSessionId: string): Promise<boolean> {
      try {
        const token = getAuthToken();
        if (!token) return false;

        const response = await axios.get(
          `${API_BASE}/hybrid-chat/sessions/${existingSessionId}`,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );

        if (!active) return false;

        const data = response.data;
        setSessionId(existingSessionId);

        if (data.messages && Array.isArray(data.messages)) {
          const restored: ChatMessage[] = data.messages.map(
            (m: Record<string, unknown>, idx: number) => ({
              id: (m.id as string) || `restored-${idx}`,
              role: m.role as ChatMessage['role'],
              message_type: (m.message_type as ChatMessage['message_type']) || 'text',
              content: m.content as string,
              metadata: m.metadata as QuestionMetadata | undefined,
              timestamp: (m.timestamp as string) || new Date().toISOString(),
            })
          );
          setMessages(restored);

          const lastBotWithMeta = [...restored]
            .reverse()
            .find((m) => m.role === 'bot' && m.metadata?.options);
          if (lastBotWithMeta?.metadata) {
            setCurrentQuestion(lastBotWithMeta.metadata);
          }
        }

        setProgress(data.progress_percentage || 0);
        if (data.status === 'completed') setIsCompleted(true);

        return true;
      } catch {
        return false;
      }
    }

    async function createNewSession(): Promise<void> {
      try {
        const token = getAuthToken();
        if (!token) {
          addSystemMessage('Please log in to start the assessment.');
          return;
        }

        const response = await axios.post(
          `${API_BASE}/hybrid-chat/start`,
          { assignment_id: assignmentId, flow_type: 'parent_assessment_v1' },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
        );

        if (!active) return;

        const data = response.data;
        setSessionId(data.session_id);

        if (data.resumed && data.messages && Array.isArray(data.messages)) {
          // Existing session returned — restore messages like restoreExistingSession
          const restored: ChatMessage[] = data.messages.map(
            (m: Record<string, unknown>, idx: number) => ({
              id: (m.id as string) || `restored-${idx}`,
              role: m.role as ChatMessage['role'],
              message_type: (m.message_type as ChatMessage['message_type']) || 'text',
              content: m.content as string,
              metadata: m.metadata as QuestionMetadata | undefined,
              timestamp: (m.timestamp as string) || new Date().toISOString(),
            })
          );
          setMessages(restored);

          const lastBotWithMeta = [...restored]
            .reverse()
            .find((m) => m.role === 'bot' && m.metadata?.options);
          if (lastBotWithMeta?.metadata) {
            setCurrentQuestion(lastBotWithMeta.metadata);
          }

          setProgress(data.progress_percentage || 0);
          if (data.status === 'completed') setIsCompleted(true);
          savePersistedSession(assignmentId, data.session_id, data.progress_percentage || 0);
        } else if (data.bot_message) {
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            message_type: (data.bot_message.message_type || 'text') as ChatMessage['message_type'],
            content: data.bot_message.content,
            metadata: data.bot_message.metadata,
            timestamp: new Date().toISOString(),
          };
          setMessages([botMessage]);
          setCurrentQuestion(data.bot_message.metadata || null);
          savePersistedSession(assignmentId, data.session_id, 0);
        }
      } catch (err: unknown) {
        if (!active) return;
        addSystemMessage('Something went wrong. Please refresh the page to try again.');
      }
    }

    async function init() {
      try {
        const persisted = loadPersistedSession(assignmentId);

        if (persisted) {
          const restored = await restoreExistingSession(persisted.sessionId);
          if (!active) return;
          if (restored) return;
          clearPersistedSession(assignmentId);
        }

        if (!active) return;
        await createNewSession();
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    }

    init();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const completeAssessment = useCallback(
    async (sid: string) => {
      try {
        const token = getAuthToken();
        await axios.post(
          `${API_BASE}/hybrid-chat/sessions/${sid}/complete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // Non-critical
      }
      clearPersistedSession(assignmentId);
    },
    [assignmentId]
  );

  const sendMessage = useCallback(
    async (
      messageType: 'mcq_choice' | 'free_text',
      content: string,
      choiceValue?: string,
      retryAttempt: number = 0,
    ) => {
      if (!sessionId || loading) return;

      setLoading(true);
      setIsTyping(true);
      setInputFeedback(null);
      setLastFailedMessage(null);
      startSlowResponseTimer();

      // Add user message immediately (only on first attempt)
      if (retryAttempt === 0) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'user',
          message_type: messageType === 'mcq_choice' ? 'mcq_choice' : 'text',
          content,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }

      try {
        const token = getAuthToken();
        const response = await axios.post(
          `${API_BASE}/hybrid-chat/sessions/${sessionId}/message`,
          {
            message_type: messageType,
            content,
            choice_value: choiceValue,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!mountedRef.current) return;
        clearSlowResponseTimer();

        const data: BotResponse = response.data;

        // Handle input validation feedback
        if (data.input_feedback) {
          setInputFeedback(data.input_feedback);
        }

        if (data.bot_message) {
          const isValidation = data.bot_message.metadata?.validation === true;
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'bot',
            message_type: (data.bot_message.message_type || 'text') as ChatMessage['message_type'],
            content: data.bot_message.content,
            metadata: data.bot_message.metadata,
            timestamp: new Date().toISOString(),
            isValidationFeedback: isValidation,
          };
          setMessages((prev) => [...prev, botMessage]);
          setCurrentQuestion(data.bot_message.metadata || null);
        }

        const newProgress = data.progress_percentage || 0;
        setProgress(newProgress);

        if (data.current_category) {
          setCurrentCategory(data.current_category);
        }

        savePersistedSession(assignmentId, sessionId, newProgress);

        if (data.status === 'completed' || data.is_complete) {
          setIsCompleted(true);
          completeAssessment(sessionId);
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        clearSlowResponseTimer();

        // Auto-retry on failure (up to MAX_RETRIES)
        if (retryAttempt < MAX_RETRIES) {
          setTimeout(() => {
            sendMessage(messageType, content, choiceValue, retryAttempt + 1);
          }, 1000 * (retryAttempt + 1));
          return;
        }

        // After all retries exhausted, show retry button
        setLastFailedMessage({ type: messageType, content, choiceValue });
        addSystemMessage(
          'Having trouble connecting. Please check your internet and try again.'
        );
      } finally {
        if (mountedRef.current && retryAttempt >= MAX_RETRIES || retryAttempt === 0) {
          // Only stop loading after final attempt or if no retry needed
        }
        if (mountedRef.current) {
          setLoading(false);
          setIsTyping(false);
        }
      }
    },
    [
      sessionId,
      loading,
      assignmentId,
      startSlowResponseTimer,
      clearSlowResponseTimer,
      completeAssessment,
      addSystemMessage,
    ]
  );

  const handleMcqSelect = useCallback(
    (option: McqOption) => {
      setInputFeedback(null);
      sendMessage('mcq_choice', option.label, option.value);
    },
    [sendMessage]
  );

  const handleTextSend = useCallback(
    (text: string) => {
      setInputFeedback(null);
      sendMessage('free_text', text);
    },
    [sendMessage]
  );

  const handleRetry = useCallback(() => {
    if (lastFailedMessage) {
      sendMessage(
        lastFailedMessage.type,
        lastFailedMessage.content,
        lastFailedMessage.choiceValue
      );
    }
  }, [lastFailedMessage, sendMessage]);

  const handleNavigateDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleSaveAndExit = useCallback(() => {
    // Session is already persisted to DB on every message, so just navigate away
    if (sessionId) {
      savePersistedSession(assignmentId, sessionId, progress);
    }
    router.push('/dashboard');
  }, [router, sessionId, assignmentId, progress]);

  if (initializing) {
    return <ChatSkeleton />;
  }

  const showTextInput =
    !isCompleted && (currentQuestion?.allow_text || !currentQuestion?.options);

  const inputPlaceholder = currentQuestion?.text_prompt || 'Type your answer here...';

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 sm:px-6 sm:py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 20.97V18.5a48.648 48.648 0 0 1-1.087-.058C2.99 18.22 1.5 16.614 1.5 14.656V6.385c0-1.866 1.369-3.477 3.413-3.727ZM17.04 7.008a48.114 48.114 0 0 0-7.832 0C7.548 7.186 6.5 8.67 6.5 10.2v4.287c0 1.53 1.048 3.013 2.708 3.191a46.604 46.604 0 0 0 3.063.215l3.26 3.026a.75.75 0 0 0 1.27-.543v-2.323c1.66-.178 2.708-1.66 2.708-3.191V10.2c-.001-1.53-1.05-3.014-2.469-3.192Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Assessment Chat</h1>
            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">AI-powered educational psychology assessment</p>
          </div>
          {currentCategory && (
            <div className="hidden sm:block">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 capitalize">
                {currentCategory}
              </span>
            </div>
          )}
          {!isCompleted && (
            <button
              onClick={handleSaveAndExit}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z" />
              </svg>
              <span className="hidden sm:inline">Save & Exit</span>
              <span className="sm:hidden">Save</span>
            </button>
          )}
        </div>
      </div>

      <ProgressBar percentage={progress} currentCategory={currentCategory} />

      <MessageList messages={messages} isTyping={isTyping} />

      {/* Retry Button */}
      {lastFailedMessage && !loading && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm text-amber-700">Message failed to send</span>
            <button
              onClick={handleRetry}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {isCompleted ? (
        <CompletionBanner onNavigate={handleNavigateDashboard} />
      ) : (
        <>
          {currentQuestion?.options && currentQuestion.options.length > 0 && (
            <McqOptions
              options={currentQuestion.options}
              onSelect={handleMcqSelect}
              disabled={loading}
            />
          )}
          {showTextInput && (
            <ChatInput
              onSend={handleTextSend}
              disabled={loading || isCompleted}
              placeholder={inputPlaceholder}
              validationFeedback={inputFeedback}
            />
          )}
        </>
      )}
    </div>
  );
}
