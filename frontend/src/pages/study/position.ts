// Remembers where you stopped in each video, per browser.
const key = (videoId: string) => `focustube:pos:${videoId}`;

export function readPosition(videoId: string): number {
  try {
    const value = Number(localStorage.getItem(key(videoId)));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function savePosition(videoId: string, seconds: number) {
  try {
    localStorage.setItem(key(videoId), String(Math.floor(seconds)));
  } catch {
    // Storage can be blocked (private mode); resuming is a nicety only.
  }
}

export function clearPosition(videoId: string) {
  try {
    localStorage.removeItem(key(videoId));
  } catch {
    // ignore
  }
}
