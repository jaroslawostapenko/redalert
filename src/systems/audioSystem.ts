export type SoundEffect = 'acknowledge' | 'moving' | 'building_complete' | 'attack';

class AudioSystem {
  private lastPlayed: Record<SoundEffect, number> = {
    acknowledge: 0,
    moving: 0,
    building_complete: 0,
    attack: 0
  };

  // Cooldown in ms to prevent audio spam
  private throttleTimes: Record<SoundEffect, number> = {
    acknowledge: 1000,
    moving: 1500,
    building_complete: 500,
    attack: 200
  };

  public play(effect: SoundEffect, volume: number, muted: boolean) {
    if (muted || volume <= 0) return;

    const now = performance.now();
    const last = this.lastPlayed[effect];
    const throttle = this.throttleTimes[effect];

    if (now - last < throttle) {
      return; // Throttled
    }

    this.lastPlayed[effect] = now;

    // Simulate playing audio by logging for now, since we don't have actual asset files
    console.log(`[AudioSystem] Playing: ${effect} at volume ${volume}`);

    // Example of actual implementation:
    // const audio = new Audio(`/assets/sounds/${effect}.mp3`);
    // audio.volume = volume;
    // audio.play().catch(e => console.warn('Audio play failed:', e));
  }
}

export const audioSystem = new AudioSystem();