import React from 'react';
import { useRoom } from '../../hooks/useSocket.js';

const REACTIONS = ['🔥', '☕', '💪', '👏', '🚀'];

const ReactionBar = ({ roomCode, userId, userName }) => {
  const { sendReaction } = useRoom();
  const [showEmojis, setShowEmojis] = React.useState(false);

  const handleReaction = (emoji) => {
    sendReaction(roomCode, emoji, userId, userName);
    setShowEmojis(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        {showEmojis && (
          <div className="absolute bottom-16 right-0 bg-dark-tertiary border border-white/10 rounded-xl p-2 flex gap-1 backdrop-blur-xl">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="w-12 h-12 bg-gradient-to-r from-purple-accent to-teal-accent rounded-full flex items-center justify-center text-xl hover:shadow-lg transition-all"
        >
          😊
        </button>
      </div>
    </div>
  );
};

export default ReactionBar;
