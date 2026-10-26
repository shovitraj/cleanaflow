"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Send, MessageSquare, User, Loader2, Sparkles, CheckCheck } from "lucide-react";

export function ChatInterface() {
  const { session } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch user's conversations
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConversationId) {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Fetch active conversation messages
  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);

      if (socket) {
        socket.emit("join_conversation", activeConversationId);
      }
    }

    return () => {
      if (socket && activeConversationId) {
        socket.emit("leave_conversation", activeConversationId);
      }
    };
  }, [activeConversationId, socket]);

  // 3. Listen for socket incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage: any) => {
      if (newMessage.conversationId === activeConversationId) {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      }
    };

    socket.on("message_received", handleMessageReceived);

    return () => {
      socket.off("message_received", handleMessageReceived);
    };
  }, [socket, activeConversationId]);

  // 4. Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversationId || !session?.user?.id) return;

    const text = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    if (socket && isConnected) {
      socket.emit("send_message", {
        conversationId: activeConversationId,
        senderId: session.user.id,
        body: text
      });
      setSending(false);
    } else {
      // Fallback to REST API
      try {
        const res = await fetch(`/api/messages/${activeConversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text })
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, data.message]);
          scrollToBottom();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSending(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[75vh]">
      {/* Sidebar: Conversations List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Direct Messages</h2>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-amber-400"
            }`}
            title={isConnected ? "Socket connected (live)" : "Connecting..."}
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center">No active chats yet.</p>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`p-4 cursor-pointer transition flex items-center gap-3 ${
                    isSelected ? "bg-white border-l-4 border-teal-600 shadow-sm" : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                    {c.otherUser?.name?.[0] || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {c.otherUser?.name || "Participant"}
                      </h4>
                      {c.lastMessage && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.lastMessage ? c.lastMessage.body : "Start conversation..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                  {(session?.user?.id === activeConversation.customerId
                    ? activeConversation.cleaner?.name?.[0]
                    : activeConversation.customer?.name?.[0]) || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {session?.user?.id === activeConversation.customerId
                      ? activeConversation.cleaner?.name
                      : activeConversation.customer?.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 block">
                    {session?.user?.id === activeConversation.customerId ? "Assigned Cleaner" : "Customer"}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.senderId === session?.user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${
                        isMine
                          ? "bg-teal-600 text-white rounded-br-none shadow-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-none"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.body}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-teal-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-300 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">Select a Conversation</h3>
            <p className="text-xs text-slate-400 mt-1">Choose a participant on the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
