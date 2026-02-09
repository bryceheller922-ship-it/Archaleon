import { useState, useRef, useEffect, useSyncExternalStore, useCallback } from 'react';
import { store } from '../store';
import { ChatConversation } from '../types';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { formatDate, formatTime } from '../utils/format';

interface ChatPanelProps {
  conversations: ChatConversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function ChatPanel({ conversations, selectedConversation, onSelectConversation }: ChatPanelProps) {
  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), []);
  const getVersion = useCallback(() => store.getVersion(), []);
  useSyncExternalStore(subscribe, getVersion);

  const activeConv = selectedConversation ? store.getConversation(selectedConversation) : undefined;
  const user = store.getUser();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  const handleSend = () => {
    if (!message.trim() || !selectedConversation) return;
    store.sendMessage(selectedConversation, message.trim());
    setMessage('');
  };

  if (conversations.length === 0 && !selectedConversation) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
        <h3 className="font-roman text-lg text-neutral-400 mb-2 tracking-wide">NO CONVERSATIONS</h3>
        <p className="text-neutral-600 text-sm font-inter">Start a conversation by messaging from a listing or inquiry.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-neutral-900/60 rounded-2xl border border-neutral-800/50 overflow-hidden">
      {/* Conversation List */}
      <div className={`w-full sm:w-80 border-r border-neutral-800/50 flex flex-col ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-neutral-800/50">
          <h3 className="font-roman text-lg tracking-wide">MESSAGES</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const otherParticipant = conv.participants.find((p) => p.id !== user?.uid);
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-4 text-left border-b border-neutral-800/30 hover:bg-neutral-800/40 transition-colors ${
                  selectedConversation === conv.id ? 'bg-neutral-800/60 border-l-2 border-l-emerald-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{otherParticipant?.role === 'company' ? '🏢' : '🏛️'}</span>
                    <span className="font-inter font-medium text-sm text-white">{otherParticipant?.name}</span>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-[10px] font-bold flex items-center justify-center">{conv.unread}</span>
                  )}
                </div>
                {conv.listingName && (
                  <p className="text-xs text-emerald-500 mb-1 ml-8 font-inter">Re: {conv.listingName}</p>
                )}
                {conv.lastMessage && (
                  <p className="text-xs text-neutral-600 truncate ml-8 font-inter">{conv.lastMessage}</p>
                )}
                {conv.lastMessageTime && (
                  <p className="text-[10px] text-neutral-700 ml-8 mt-1 font-inter">{formatDate(conv.lastMessageTime)}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            <div className="p-4 border-b border-neutral-800/50 flex items-center gap-3">
              <button
                onClick={() => onSelectConversation(null)}
                className="sm:hidden p-1 text-neutral-500 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-lg">{activeConv.participants.find((p) => p.id !== user?.uid)?.role === 'company' ? '🏢' : '🏛️'}</span>
              <div>
                <h4 className="font-roman text-sm tracking-wide text-white">{activeConv.participants.find((p) => p.id !== user?.uid)?.name}</h4>
                {activeConv.listingName && <p className="text-xs text-emerald-500 font-inter">Re: {activeConv.listingName}</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-neutral-600 text-sm font-inter italic">Begin your conversation...</p>
                </div>
              )}
              {activeConv.messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm font-inter ${
                        isMe
                          ? 'bg-emerald-700 text-white rounded-br-md'
                          : 'bg-neutral-800 text-neutral-200 rounded-bl-md border border-neutral-700/30'
                      }`}>
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-neutral-700 mt-1 font-inter ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-neutral-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700/50 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-inter"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className={`px-4 py-2.5 rounded-xl transition-all ${
                    message.trim()
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white glow-green-sm'
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-600">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
              <p className="text-sm font-inter">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
