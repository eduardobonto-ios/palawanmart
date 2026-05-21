/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Message } from '../types';

export default function ChatPopup() {
  const { 
    currentUser, 
    isChatOpen, 
    setIsChatOpen, 
    messages: allMessages, 
    sendChatMessage,
    markMessagesAsRead,
    activeChatReceiverId,
    setActiveChatReceiverId,
    profiles,
    selectedProductId
  } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [view, setView] = useState<'list' | 'thread'>('list');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages for current conversation
  const currentConversationMessages = allMessages.filter(m => 
    (m.senderId === currentUser?.id && m.receiverId === activeChatReceiverId) ||
    (m.senderId === activeChatReceiverId && m.receiverId === currentUser?.id)
  );

  // Mark as read when conversation opens or new messages arrive
  useEffect(() => {
    if (activeChatReceiverId) {
      if (view !== 'thread') setView('thread');
      
      const hasUnread = currentConversationMessages.some(m => m.receiverId === currentUser?.id && !m.isRead);
      if (hasUnread) {
        markMessagesAsRead(activeChatReceiverId);
      }
    }
  }, [activeChatReceiverId, currentConversationMessages, view]);

  // Identify all unique users chatted with
  const conversations = Array.from(new Set(allMessages.flatMap(m => [m.senderId, m.receiverId])))
    .filter(id => id !== currentUser?.id)
    .map(userId => {
      const userProfile = profiles.find(p => p.id === userId);
      const userMessages = allMessages.filter(m => m.senderId === userId || m.receiverId === userId);
      const lastMessage = userMessages[userMessages.length - 1];
      const unreadFromUser = userMessages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;
      return {
        userId,
        profile: userProfile,
        lastMessage,
        unreadCount: unreadFromUser
      };
    })
    .sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const totalUnreadCount = allMessages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;

  const receiverProfile = profiles.find(p => p.id === activeChatReceiverId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversationMessages, view]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUser || !activeChatReceiverId) return;

    const content = inputValue;
    setInputValue('');

    try {
      await sendChatMessage(activeChatReceiverId, content, selectedProductId || undefined);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputValue(content);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {!isChatOpen ? (
          <motion.button
            layoutId="chat-box"
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all relative"
          >
            <MessageCircle size={28} />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            )}
          </motion.button>
        ) : (
          <motion.div
            layoutId="chat-box"
            className="w-[320px] md:w-[400px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex items-center justify-between">
              {view === 'thread' && activeChatReceiverId ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                        setView('list');
                        setActiveChatReceiverId(null);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-all mr-1"
                  >
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    {receiverProfile?.photo_url ? (
                      <img src={receiverProfile.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm truncate">{receiverProfile?.display_name || 'Chat'}</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <MessageCircle size={24} />
                  <h4 className="font-black text-sm uppercase tracking-widest">Messages</h4>
                </div>
              )}
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {view === 'list' ? (
                /* Conversation List */
                <div className="flex-grow overflow-y-auto no-scrollbar bg-white">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-300 mb-4">
                                <MessageCircle size={32} />
                            </div>
                            <h5 className="font-black text-emerald-900 mb-1">No messages yet</h5>
                            <p className="text-xs text-emerald-900/40 font-medium">Browse products and message sellers to start a chat!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-emerald-50">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.userId}
                                    onClick={() => {
                                        setActiveChatReceiverId(conv.userId);
                                        setView('thread');
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-emerald-50/50 transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-50">
                                        {conv.profile?.photo_url ? (
                                            <img src={conv.profile.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-emerald-300" />
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h5 className="font-bold text-emerald-900 truncate">{conv.profile?.display_name || 'Anonymous'}</h5>
                                            {conv.lastMessage && (
                                                <span className={`text-[10px] font-bold ${conv.unreadCount > 0 ? 'text-primary' : 'text-emerald-300'}`}>
                                                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs truncate font-medium flex-grow ${conv.unreadCount > 0 ? 'text-emerald-900 font-bold' : 'text-emerald-600/60'}`}>
                                                {conv.lastMessage?.senderId === currentUser.id ? 'You: ' : ''}
                                                {conv.lastMessage?.content}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-emerald-200" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Chat Thread */
                <>
                    <div 
                        ref={scrollRef}
                        className="flex-grow p-6 overflow-y-auto space-y-4 no-scrollbar bg-emerald-50/20"
                    >
                        {currentConversationMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-primary mb-4">
                                    <MessageCircle size={32} />
                                </div>
                                <h5 className="font-black text-emerald-900 mb-1">Start a conversation</h5>
                                <p className="text-xs text-emerald-900/40 font-medium italic">Your chat history with {receiverProfile?.display_name || 'this user'} will appear here.</p>
                            </div>
                        ) : (
                            currentConversationMessages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium ${
                                        msg.senderId === currentUser.id 
                                            ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20' 
                                            : 'bg-white text-emerald-900 border border-emerald-100 rounded-bl-none shadow-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form 
                        onSubmit={handleSendMessage}
                        className="p-4 bg-white border-t border-emerald-50"
                    >
                        <div className="relative">
                            <input 
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-emerald-50 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-bold text-emerald-900 outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                            <button 
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="absolute right-1.5 top-1.5 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
