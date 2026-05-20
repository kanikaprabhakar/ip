import React from 'react';
import { Howler, Howl } from 'howler';

const AUDIO_TRACKS = [
  { id: 'lofi', name: 'Lo-fi Music', emoji: '🎵', url: 'https://assets.mixkit.co/music/preview/mixkit-lo-fi-chillwave-4.mp3' },
  { id: 'rain', name: 'Rain', emoji: '🌧️', url: 'https://assets.mixkit.co/music/preview/mixkit-light-rain-and-thunder-1047.mp3' },
  { id: 'cafe', name: 'Café Noise', emoji: '☕', url: 'https://assets.mixkit.co/music/preview/mixkit-coffee-shop-chatter-1.mp3' },
  { id: 'white', name: 'White Noise', emoji: '❄️', url: 'https://assets.mixkit.co/music/preview/mixkit-white-noise-226.mp3' }
];

const AmbientPlayer = () => {
  const [sounds, setSounds] = React.useState({});
  const [volumes, setVolumes] = React.useState({ lofi: 0.5, rain: 0, cafe: 0, white: 0 });
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const newSounds = {};
    AUDIO_TRACKS.forEach((track) => {
      newSounds[track.id] = new Howl({
        src: [track.url],
        loop: true,
        volume: volumes[track.id]
      });
    });
    setSounds(newSounds);

    return () => {
      Object.values(newSounds).forEach(sound => sound.unload());
    };
  }, []);

  const handlePlayToggle = (trackId) => {
    if (sounds[trackId]) {
      if (sounds[trackId].playing()) {
        sounds[trackId].pause();
      } else {
        sounds[trackId].play();
      }
    }
  };

  const handleVolumeChange = (trackId, newVolume) => {
    setVolumes(prev => ({ ...prev, [trackId]: newVolume }));
    if (sounds[trackId]) {
      sounds[trackId].volume(newVolume);
    }
  };

  const toggleAllAudio = () => {
    if (isPlaying) {
      Object.values(sounds).forEach(s => s.pause());
    } else {
      Object.entries(sounds).forEach(([id, s]) => {
        if (volumes[id] > 0) s.play();
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed top-6 right-6 z-40">
      {isOpen && (
        <div className="mb-4 w-72 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-4">Ambient Sounds</h3>
          <div className="space-y-3">
            {AUDIO_TRACKS.map((track) => (
              <div key={track.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">
                    {track.emoji} {track.name}
                  </span>
                  <button
                    onClick={() => handlePlayToggle(track.id)}
                    className="text-xs px-2 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition"
                  >
                    {sounds[track.id]?.playing() ? '⏸' : '▶'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volumes[track.id]}
                  onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-accent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-r from-purple-accent to-teal-accent rounded-full flex items-center justify-center text-xl hover:shadow-lg transition-all"
      >
        🎵
      </button>
    </div>
  );
};

export default AmbientPlayer;
