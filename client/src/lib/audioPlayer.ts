export interface AudioPlayerState {
  audio: HTMLAudioElement | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
}

export const createAudioPlayer = (audioUrl: string): AudioPlayerState => {
  const audio = new Audio(audioUrl);
  return {
    audio,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    volume: 1,
    playbackRate: 1,
    isMuted: false
  };
};

export const play = (state: AudioPlayerState): AudioPlayerState => {
  if (state.audio) {
    state.audio.play();
    return { ...state, isPlaying: true };
  }
  return state;
};

export const pause = (state: AudioPlayerState): AudioPlayerState => {
  if (state.audio) {
    state.audio.pause();
    return { ...state, isPlaying: false };
  }
  return state;
};

export const togglePlay = (state: AudioPlayerState): AudioPlayerState => {
  if (state.isPlaying) {
    return pause(state);
  } else {
    return play(state);
  }
};

export const setCurrentTime = (state: AudioPlayerState, time: number): AudioPlayerState => {
  if (state.audio) {
    state.audio.currentTime = time;
    return { ...state, currentTime: time };
  }
  return state;
};

export const setVolume = (state: AudioPlayerState, volume: number): AudioPlayerState => {
  if (state.audio) {
    state.audio.volume = volume;
    return { ...state, volume };
  }
  return state;
};

export const setPlaybackRate = (state: AudioPlayerState, rate: number): AudioPlayerState => {
  if (state.audio) {
    state.audio.playbackRate = rate;
    return { ...state, playbackRate: rate };
  }
  return state;
};

export const toggleMute = (state: AudioPlayerState): AudioPlayerState => {
  if (state.audio) {
    state.audio.muted = !state.audio.muted;
    return { ...state, isMuted: !state.isMuted };
  }
  return state;
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
