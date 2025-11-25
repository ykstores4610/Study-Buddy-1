export type AppPhase = 'SETUP' | 'PLANNING' | 'TRACKING';
export type SoundType = 'classic' | 'bell' | 'digital' | 'buzzer' | 'custom';

export interface StudySession {
  id: string;
  topic: string;
  completed: boolean;
}

export interface Kid {
  id: string;
  name: string;
  sessions: StudySession[];
}

export interface Config {
  numKids: number;
  numSessions: number;
  studyDurationMinutes: number;
  breakDurationMinutes: number;
  soundType: SoundType;
  customSoundData?: string; // Base64 string for custom audio
}

export interface TimerState {
  mode: 'STUDY' | 'BREAK';
  secondsLeft: number;
  isRunning: boolean;
  currentSessionIndex: number;
  isSessionFinished: boolean; // True when all sessions for the day are done
}