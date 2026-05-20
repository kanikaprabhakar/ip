import React, { useState } from 'react';
import * as api from '../../services/api.js';

const StudyBuddy = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.chatWithAI(input);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {isOpen && (
        <div className="mb-4 w-80 max-h-96 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-purple-accent/20 to-teal-accent/20 p-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Study Buddy 🤖</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-white/40 text-sm">Ask me about your studies!</p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-accent/40 text-white'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white/80 px-3 py-2 rounded-lg text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-white/10 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-accent outline-none transition disabled:opacity-50"
              placeholder="Ask something..."
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 bg-teal-accent text-dark-bg rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-r from-teal-accent to-purple-accent rounded-full flex items-center justify-center text-xl hover:shadow-lg transition-all"
      >
        🤖
      </button>
    </div>
  );
};

export default StudyBuddy;
