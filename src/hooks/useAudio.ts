import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { audioSystem } from '../systems/audioSystem';
import type { SoundEffect } from '../systems/audioSystem';

export const useAudio = () => {
  const { muted, volume } = useGameStore(state => state.audio);

  const playSound = useCallback((effect: SoundEffect) => {
    audioSystem.play(effect, volume, muted);
  }, [muted, volume]);

  return { playSound };
};