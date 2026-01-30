
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string | number;
  content: string;
  createdAt: string | Date;
  senderId?: string;
}

interface StudentMessageBubbleWidgetProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string | null;
}

export function StudentMessageBubbleWidget({
  message,
  isOwnMessage,
  senderName
}: StudentMessageBubbleWidgetProps) {
  const formatTime = (timestamp: string | Date): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
          ? 'bg-blue-500 text-white rounded-br-none'
          : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}>
        {!isOwnMessage && senderName && (
          <div className="text-xs text-gray-600 mb-1 font-medium">
            {senderName}
          </div>
        )}
        <div className="text-sm wrap-break-word">
          {message.content}
        </div>
        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
