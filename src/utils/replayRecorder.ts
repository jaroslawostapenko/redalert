import type { GameStateData } from '../models/types';
import { saveGameState } from './saveManager';

export interface ReplayCommand {
  frame: number;
  action: 'commandUnits' | 'queueBuild' | 'spawnUnit' | 'spawnBuilding' | 'spawnResource';
  payload: any;
}

export interface ReplayData {
  initialState: string; // JSON string of GameStateData
  commands: ReplayCommand[];
}

class ReplayRecorder {
  private isRecording: boolean = false;
  private currentReplay: ReplayData | null = null;
  private currentFrame: number = 0;

  // Playback state
  private isPlaying: boolean = false;
  private playData: ReplayData | null = null;
  private playFrame: number = 0;

  startRecording(initialState: GameStateData) {
    this.isRecording = true;
    this.currentFrame = 0;
    this.currentReplay = {
      initialState: saveGameState(initialState),
      commands: [],
    };
    console.log('Started recording replay');
  }

  stopRecording(): string | null {
    if (!this.isRecording || !this.currentReplay) return null;
    this.isRecording = false;
    const replayString = JSON.stringify(this.currentReplay);
    console.log('Stopped recording replay');
    return replayString;
  }

  recordAction(action: ReplayCommand['action'], payload: any) {
    if (!this.isRecording || !this.currentReplay) return;
    this.currentReplay.commands.push({
      frame: this.currentFrame,
      action,
      payload,
    });
  }

  tick() {
    if (this.isRecording) {
      this.currentFrame++;
    }
    if (this.isPlaying && this.playData) {
      this.playFrame++;
    }
  }

  startPlayback(data: ReplayData) {
    this.isPlaying = true;
    this.playData = data;
    this.playFrame = 0;
    console.log('Started replay playback');
  }

  stopPlayback() {
    this.isPlaying = false;
    this.playData = null;
    this.playFrame = 0;
    console.log('Stopped replay playback');
  }

  getCommandsForCurrentFrame(): ReplayCommand[] {
    if (!this.isPlaying || !this.playData) return [];
    return this.playData.commands.filter((cmd) => cmd.frame === this.playFrame);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  saveReplayToLocalStorage(slot: string = 'replay_1') {
    const data = this.stopRecording();
    if (data) {
      localStorage.setItem(`my_rts_${slot}`, data);
      console.log(`Saved replay to ${slot}`);
    }
  }

  loadReplayFromLocalStorage(slot: string = 'replay_1'): ReplayData | null {
    const data = localStorage.getItem(`my_rts_${slot}`);
    if (data) {
      try {
        return JSON.parse(data) as ReplayData;
      } catch (e) {
        console.error('Failed to parse replay:', e);
      }
    }
    return null;
  }
}

export const replayRecorder = new ReplayRecorder();
