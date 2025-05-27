import { useCallback, useRef, useEffect } from 'react';

interface AudioSettings {
  beepEnabled: boolean;
  volume: number;
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Precarica l'audio
    audioRef.current = new Audio('/beep.wav');
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playBeep = useCallback(() => {
    // Controlla le impostazioni audio dal localStorage
    const audioSettings = getAudioSettings();
    
    if (!audioSettings.beepEnabled || !audioRef.current) {
      return;
    }

    try {
      audioRef.current.volume = audioSettings.volume;
      audioRef.current.currentTime = 0; // Reset per permettere suoni consecutivi
      audioRef.current.play().catch(error => {
        console.warn('Impossibile riprodurre il suono:', error);
      });
    } catch (error) {
      console.warn('Errore riproduzione audio:', error);
    }
  }, []);

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
