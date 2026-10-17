import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  PlusCircle,
  MessageSquare,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import { ApprovalCard } from '../components/agent/ApprovalCard';
import { PlanView } from '../components/agent/PlanView';
import { ToolCallTrace } from '../components/agent/ToolCallTrace';
import { api } from '../services/api';
import { Message, Conversation, Approval } from '../types';

export const Chat: React.FC = () => {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pendingApproval, setPendingApproval] = useState<Approval | null>(null);
  const [providerUsed, setProviderUsed] = useState<string>('deterministic_demo_provider');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    // Check if initial prompt was passed via navigation
    if (location.state?.initialPrompt) {
      handleSend(location.state.initialPrompt);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !conversationId) {
        setConversationId(data[0].id);
        const conv = await api.getConversation(data[0].id);
        setMessages(conv.messages || []);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setConversationId(id);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
      setPendingApproval(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setPendingApproval(null);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    // Append optimistic user message
    const tempUserMsg: Message = {
      id: Date.now(),
      conversation_id: conversationId || 'temp',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text, conversationId);
      setConversationId(response.conversation_id);
      setProviderUsed(response.provider_used);

      // Append assistant message
      setMessages((prev) => [...prev, response.message]);

      // Set pending approval if returned
      if (response.pending_approval) {
        setPendingApproval(response.pending_approval);
      } else {
        setPendingApproval(null);
      }

      loadConversations();
    } catch (err: any) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        conversation_id: conversationId || 'temp',
        role: 'assistant',
        content: `Error: ${err.message}. Please check your backend connection.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    'Show my pending tasks and prioritize them.',
    'Find two free hours tomorrow for project work.',
    'Plan my week around my exams.',
    'Turn my notes into a list of tasks.',
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-6">
      {/* Sidebar: Conversation History */}
      <div className="hidden lg:flex flex-col w-64 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Conversations
          </span>
          <button
            onClick={handleStartNewChat}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
            title="Start New Chat"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectConversation(c.id)}
              className={`w-full text-left p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 truncate transition-colors ${
                conversationId === c.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{c.title || 'Conversation'}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No past chats.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Indicator */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">LifePilot Agent Orchestrator</span>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {providerUsed === 'deterministic_demo_provider'
                ? 'Deterministic Demo Provider (Live DB)'
                : providerUsed}
            </span>
          </div>

          <button
            onClick={handleStartNewChat}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 lg:hidden"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                How can LifePilot AI assist you?
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Ask to prioritize tasks, find unconflicted free slots, plan exam study blocks, or extract tasks from your notes.
              </p>

              <div className="space-y-2">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs text-slate-700 transition-all font-medium"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const extra = msg.extra_data || {};

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 text-xs font-bold ${
                    isUser ? 'bg-slate-800' : 'bg-blue-600 shadow-sm'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white shadow-xs rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render Agent Plan Steps if present */}
                  {!isUser && extra.plan && <PlanView plan={extra.plan} />}

                  {/* Render Tool Call Trace if present */}
                  {!isUser && extra.tool_calls && <ToolCallTrace toolCalls={extra.tool_calls} />}

                  {/* Render Approval Card if attached to this message */}
                  {!isUser && pendingApproval && (
                    <ApprovalCard
                      approval={pendingApproval}
                      onActionComplete={(res) => {
                        // After approval, refresh conversation
                        if (conversationId) handleSelectConversation(conversationId);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>LifePilot Agent is analyzing intent and querying tools...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips above input */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] bg-slate-50/50">
          <span className="text-slate-400 font-semibold shrink-0">Suggestions:</span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              className="shrink-0 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 px-2.5 py-1 rounded-full transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <VoiceInputButton onTranscript={(txt) => setInputText(txt)} />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your instruction or choose a suggestion above..."
            className="flex-1 bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-xs md:text-sm border border-transparent focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
