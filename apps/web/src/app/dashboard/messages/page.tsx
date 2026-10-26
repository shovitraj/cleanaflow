"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function CustomerMessagesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cleaner Messages</h1>
        <p className="text-xs text-slate-500 mt-1">Direct messaging with your assigned cleaning professional</p>
      </div>
      <ChatInterface />
    </div>
  );
}
