/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UTILS.IDLE.WATCHER
TAG: UTILS.IDLE.WATCHER.DETECTION

5WH:
WHAT = Idle detection watcher — monitors user activity and fires callbacks after 3 minutes of inactivity
WHY = Enables idle ambient audio and UI state without polling; resets instantly on any interaction
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = utils/idleWatcher.ts
WHEN = 2026
HOW = Attaches passive event listeners to window; uses a single clearable setTimeout

LICENSE:
MIT
*/

const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

let _idleTimer: ReturnType<typeof setTimeout> | null = null;
let _isIdle = false;
let _onIdleStart: () => void = () => {};
let _onIdleEnd:   () => void = () => {};
let _started = false;

const WATCHED_EVENTS: string[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

function resetIdleTimer() {
  if (_isIdle) {
    _isIdle = false;
    _onIdleEnd();
  }

  if (_idleTimer !== null) clearTimeout(_idleTimer);

  _idleTimer = setTimeout(() => {
    _isIdle = true;
    _onIdleStart();
  }, IDLE_TIMEOUT_MS);
}

export const idleWatcher = {
  /**
   * Start idle monitoring.
   * @param onStart – called when user has been idle for ≥3 minutes
   * @param onEnd   – called immediately when any interaction resets the timer
   * @returns cleanup function to remove all listeners and timers
   */
  start(onStart: () => void, onEnd: () => void): () => void {
    if (_started) this.stop();

    _onIdleStart = onStart;
    _onIdleEnd   = onEnd;
    _started     = true;

    WATCHED_EVENTS.forEach(evt =>
      window.addEventListener(evt, resetIdleTimer, { passive: true })
    );

    resetIdleTimer(); // kick off initial timer

    return () => this.stop();
  },

  /** Stop idle monitoring and clear all state. */
  stop() {
    WATCHED_EVENTS.forEach(evt =>
      window.removeEventListener(evt, resetIdleTimer)
    );
    if (_idleTimer !== null) {
      clearTimeout(_idleTimer);
      _idleTimer = null;
    }
    _started = false;
    _isIdle  = false;
  },

  /** Manually reset the idle timer (e.g. on programmatic voice activity). */
  reset() {
    if (_started) resetIdleTimer();
  },

  /** Returns true if the user is currently in an idle state. */
  get isIdle(): boolean {
    return _isIdle;
  },
};
