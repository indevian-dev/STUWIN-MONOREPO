import React from 'react';

interface StudentTypingIndicatorWidgetProps {
  isTyping: boolean;
  userName?: string;
}

// app/[locale]/dashboard/chats/(widgets)/typingIndicator.jsx
export function StudentTypingIndicatorWidget({ isTyping, userName }: StudentTypingIndicatorWidgetProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{userName || 'Someone'} is typing...</span>
    </div>
  );
}
