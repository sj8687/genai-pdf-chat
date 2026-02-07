'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setMessage('');

    const res = await fetch(`http://localhost:8000/chat?message=${message}`);
    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: data?.message },
    ]);
  };

  return (
    <div className="flex flex-col h-screen p-4">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>


      <div className="flex gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
        />
        <Button onClick={handleSendChatMessage} disabled={!message.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatComponent;









// 'use client';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import * as React from 'react';

// interface Doc {
//   pageContent?: string;
//   metdata?: {
//     loc?: {
//       pageNumber?: number;
//     };
//     source?: string;
//   };
// }
// interface IMessage {
//   role: 'assistant' | 'user';
//   content?: string;
//   // documents?: Doc[];
// }

// const ChatComponent: React.FC = () => {
//   const [message, setMessage] = React.useState<string>('');
//   const [messages, setMessages] = React.useState<IMessage[]>([]);

//   console.log({ messages });

//   const handleSendChatMessage = async () => {
//     setMessages((prev) => [...prev, { role: 'user', content: message }]);
//     const res = await fetch(`http://localhost:8000/chat?message=${message}`);
//     const data = await res.json();
//     setMessages((prev) => [
//       ...prev,
//       {
//         role: 'assistant',
//         content: data?.message,
//         documents: data?.docs,
//       },
//     ]);
//   };

//   return (
//     <div className="p-4">
//       <div>
//         {messages.map((message, index) => (
//           <pre key={index}>{JSON.stringify(message, null, 2)}</pre>
//         ))}
//       </div>
//       <div className="fixed bottom-4 w-100 flex gap-3">
//         <Input
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Type your message here"
//         />
//         <Button onClick={handleSendChatMessage} disabled={!message.trim()}>
//           Send
//         </Button>
//       </div>
//     </div>
//   );
// };
// export default ChatComponent;