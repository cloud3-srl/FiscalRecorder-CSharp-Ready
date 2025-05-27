import { useCallback, useRef, useEffect } from 'react';

interface AudioSettings {
  beepEnabled: boolean;
  volume: number;
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  
  useEffect(() => {
    // Inizializza il sistema audio
    initializeAudio();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      // Metodo 1: HTML Audio Element
      audioRef.current = new Audio('/beep.wav');
      audioRef.current.preload = 'auto';
      
      // Metodo 2: Web Audio API (fallback)
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        const AudioCtx = AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        
        try {
          const response = await fetch('/beep.wav');
          const arrayBuffer = await response.arrayBuffer();
          audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
        } catch (error) {
          console.warn('Errore caricamento audio buffer:', error);
        }
      }
    } catch (error) {
      console.warn('Errore inizializzazione audio:', error);
    }
  };

  const playWithWebAudio = useCallback((volume: number) => {
    if (!audioContextRef.current || !audioBufferRef.current) {
      return false;
    }

    try {
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = audioBufferRef.current;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start();
      return true;
    } catch (error) {
      console.warn('Errore Web Audio API:', error);
      return false;
    }
  }, []);

  const playWithHtmlAudio = useCallback((volume: number) => {
    if (!audioRef.current) {
      return false;
    }

    try {
      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Errore HTML Audio:', error);
        });
      }
      return true;
    } catch (error) {
      console.warn('Errore HTML Audio:', error);
      return false;
    }
  }, []);

  const playBeep = useCallback(() => {
    const audioSettings = getAudioSettings();
    
    if (!audioSettings.beepEnabled) {
      return;
    }

    // Prova prima con HTML Audio, poi con Web Audio API
    if (!playWithHtmlAudio(audioSettings.volume)) {
      if (!playWithWebAudio(audioSettings.volume)) {
        // Fallback: suono di sistema (se disponibile)
        try {
          if ('beep' in navigator) {
            (navigator as any).beep();
          }
        } catch (error) {
          console.warn('Nessun metodo audio disponibile');
        }
      }
    }
  }, [playWithHtmlAudio, playWithWebAudio]);

  return { playBeep };
}

// Funzioni per gestire le impostazioni audio
export function getAudioSettings(): AudioSettings {
  try {
    const settings = localStorage.getItem('fiscalrecorder.audioSettings');
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.warn('Errore caricamento impostazioni audio:', error);
  }
  
  // Impostazioni predefinite
  return {
    beepEnabled: true,
    volume: 0.5
  };
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem('fiscalrecorder.audioSettings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Errore salvataggio impostazioni audio:', error);
  }
}

export function updateAudioSetting(key: keyof AudioSettings, value: boolean | number): void {
  const currentSettings = getAudioSettings();
  const newSettings = { ...currentSettings, [key]: value };
  saveAudioSettings(newSettings);
}

// Funzione di test audio migliorata
export async function testAudio(volume: number = 0.5): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio('/beep.wav');
      audio.volume = volume;
      
      audio.addEventListener('canplaythrough', () => {
        audio.play()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }, { once: true });
      
      audio.addEventListener('error', () => resolve(false), { once: true });
      
      audio.load();
    } catch (error) {
      resolve(false);
    }
  });
}
