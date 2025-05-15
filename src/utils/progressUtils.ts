
import { PROGRESS_STEPS } from '../constants/fileStorage';

export type ProgressCallback = (progress: number, status: string) => void;

export class ProgressTracker {
  private currentProgress: number = 0;
  private callback: ProgressCallback;
  private statusMessage: string = '';
  
  constructor(callback: ProgressCallback) {
    this.callback = callback;
  }
  
  setProgress(step: keyof typeof PROGRESS_STEPS, statusMessage?: string): void {
    this.currentProgress = PROGRESS_STEPS[step];
    if (statusMessage) {
      this.statusMessage = statusMessage;
    }
    this.notifyProgress();
  }
  
  incrementProgress(amount: number, statusMessage?: string): void {
    this.currentProgress = Math.min(99, this.currentProgress + amount);
    if (statusMessage) {
      this.statusMessage = statusMessage;
    }
    this.notifyProgress();
  }
  
  complete(statusMessage: string = 'Abgeschlossen'): void {
    this.currentProgress = 100;
    this.statusMessage = statusMessage;
    this.notifyProgress();
  }
  
  private notifyProgress(): void {
    this.callback(this.currentProgress, this.statusMessage);
  }
}

