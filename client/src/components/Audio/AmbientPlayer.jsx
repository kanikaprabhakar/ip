import React from 'react';
import { Howl, Howler } from 'howler';

const AUDIO_TRACKS = [
  { id: 'lofi', name: 'Lo-fi Music', emoji: '🎵', url: 'https://assets.mixkit.co/music/preview/mixkit-lo-fi-chillwave-4.mp3' },
  { id: 'rain', name: 'Rain', emoji: '🌧️', url: 'https://assets.mixkit.co/music/preview/mixkit-light-rain-and-thunder-1047.mp3' },
  { id: 'cafe', name: 'Café Noise', emoji: '☕', url: 'https://assets.mixkit.co/music/preview/mixkit-coffee-shop-chatter-1.mp3' },
  { id: 'white', name: 'White Noise', emoji: '❄️', url: 'https://assets.mixkit.co/music/preview/mixkit-white-noise-226.mp3' }
];

const INITIAL_VOLUMES = { lofi: 0.5, rain: 0, cafe: 0, white: 0 };

const AmbientPlayer = () => {
  const soundsRef = React.useRef({});
  const availabilityRef = React.useRef({});
  const [volumes, setVolumes] = React.useState(INITIAL_VOLUMES);
  const [playingTracks, setPlayingTracks] = React.useState({ lofi: false, rain: false, cafe: false, white: false });
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Lazy-create Howl instances to avoid exhausting the HTML5 audio pool
  const getSound = (trackId) => {
    if (!soundsRef.current[trackId]) {
      // Check availability once (HEAD request) to avoid creating Howl for 403 responses
      if (availabilityRef.current[trackId] === undefined) {
        const track = AUDIO_TRACKS.find(t => t.id === trackId);
        if (track) {
          fetch(track.url, { method: 'HEAD', mode: 'cors' })
            .then((res) => {
              availabilityRef.current[trackId] = res.ok;
            })
            .catch(() => {
              availabilityRef.current[trackId] = false;
            });
        } else {
          availabilityRef.current[trackId] = false;
        }
      }
      // If explicitly unavailable, skip creating the Howl
      if (availabilityRef.current[trackId] === false) return null;
      const track = AUDIO_TRACKS.find(t => t.id === trackId);
      if (!track) return null;

      // Use WebAudio by default (html5: false) and don't preload until play
      const howl = new Howl({
        src: [track.url],
        loop: true,
        html5: false,
        preload: false,
        volume: INITIAL_VOLUMES[trackId]
      });

      soundsRef.current[trackId] = howl;
    }
    return soundsRef.current[trackId];
  };

  React.useEffect(() => {
    Object.entries(volumes).forEach(([trackId, volume]) => {
      if (soundsRef.current[trackId]) {
        soundsRef.current[trackId].volume(volume);
      }
    });
  }, [volumes]);

  const handlePlayToggle = (trackId) => {
    if (availabilityRef.current[trackId] === false) {
      console.warn('Track unavailable or blocked by CORS:', trackId);
      return;
    }
    // Ensure AudioContext resumed on first user gesture
    try {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
    } catch (e) {
      // ignore
    }

    const sound = getSound(trackId);
    if (!sound) return;

    if (sound.playing && sound.playing()) {
      sound.pause();
      setPlayingTracks((prev) => ({ ...prev, [trackId]: false }));
    } else {
      // load before playing if not loaded
      if (!sound.state || sound.state() !== 'loaded') {
        sound.load();
      }
      sound.play();
      setPlayingTracks((prev) => ({ ...prev, [trackId]: true }));
    }
  };

  const handleVolumeChange = (trackId, newVolume) => {
    setVolumes(prev => ({ ...prev, [trackId]: newVolume }));
  };

  const toggleAllAudio = () => {
    if (isPlaying) {
      Object.values(soundsRef.current).forEach((sound) => sound && sound.pause && sound.pause());
      setPlayingTracks({ lofi: false, rain: false, cafe: false, white: false });
    } else {
      // resume audio context on explicit user gesture
      try { if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume(); } catch (e) {}

      Object.entries(volumes).forEach(([trackId, vol]) => {
        if (vol > 0 && availabilityRef.current[trackId] !== false) {
          const sound = getSound(trackId);
          if (sound && !(sound.playing && sound.playing())) {
            if (!sound.state || sound.state() !== 'loaded') sound.load();
            sound.play();
          }
        }
      });
      setPlayingTracks((prev) => {
        const nextState = { ...prev };
        Object.entries(volumes).forEach(([trackId, volume]) => {
          nextState[trackId] = volume > 0;
        });
        return nextState;
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      Object.values(soundsRef.current).forEach((s) => {
        try { s.unload && s.unload(); } catch (e) {}
      });
      soundsRef.current = {};
    };
  }, []);

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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayToggle(track.id)}
                          disabled={availabilityRef.current[track.id] === false}
                          title={availabilityRef.current[track.id] === false ? 'Source unavailable' : ''}
                          className={`text-xs px-2 py-1 ${availabilityRef.current[track.id] === false ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'} rounded transition`}
                        >
                          {playingTracks[track.id] ? '⏸' : '▶'}
                        </button>
                        {availabilityRef.current[track.id] === false && (
                          <span className="text-xs text-yellow-300">Unavailable</span>
                        )}
                      </div>
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
          <button
            onClick={toggleAllAudio}
            className="mt-4 w-full bg-gradient-to-r from-purple-accent to-teal-accent text-white font-semibold py-2 rounded-full"
          >
            {isPlaying ? 'Pause all' : 'Play active tracks'}
          </button>
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
