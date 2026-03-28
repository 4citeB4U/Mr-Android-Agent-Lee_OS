/\*
LEEWAY HEADER — DO NOT REMOVE

REGION: DOCS
TAG: DOCS.TEST.STEP6_VERIFICATION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Step 6 End-to-End Verification Guide
WHY = Confirm TaskManager is wired to floating computer card
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\_\_tests\_\_\step6-verification.md
WHEN = 2026
HOW = Manual verification of data flow

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
\*/

# Step 6 End-to-End Verification Guide

## Overview

Step 6 wiring is complete. TaskManager is now integrated with WorkstationContext and the floating computer card displays real task progress, terminal output, and auto-show/collapse behavior.

## Data Flow Architecture

```
globalTaskManager
    ↓
useTaskManagerSync hook (in AppContentAdapter)
    ↓
TaskManager output → workstation.appendTerminal()
TaskManager stats  → context.setBuildProgress()
    ↓
WorkstationContext (state.buildProgress, state.terminalOutput)
    ↓
AgentLeeComputerCard.v2
    - Progress rail reads state.buildProgress
    - Terminal shows state.terminalOutput
    - Task count from state.tasks.length
    - Auto-show based on taskCount > 0
```

## Test Scenario 1: Single Task Submission

### Setup

1. Navigate to app
2. Ensure floating card is not visible (no active tasks)

### Expected Behavior Timeline

**T=0s: Submit task**

```
User submits: "npm run build" in footer
OR: globalTaskManager.submitTask("build", "complex", async (task) => {...})
```

**T=0.1s: Card appears**

- ✅ Floating card appears at top-left (not collapsed at bottom-right)
- ✅ Card is in expanded state (height=540px)
- ✅ Task count badge shows: "1 task"

**T=0.2s: Terminal output begins**

- ✅ Shell tab shows: "[TASK START] build (...)\n"
- ✅ Terminal bubble shows same output
- ✅ Output scrolls automatically

**T=0.5-5s: Progress updates**

- ✅ Progress rail starts at 10% baseline (active work indication)
- ✅ Progress rail animates smoothly via Framer Motion
- ✅ Progress percentage displays (10%, 15%, 20%, etc.)
- ✅ Task name shows in progress bar: "build (10%)"

**T=5-20s: Task processing**

- ✅ Output continues streaming to terminal
- ✅ Desktop tab shows live screenshot updates every 1200ms
- ✅ Files tab allows file browsing during execution
- ✅ Studio tab allows file editing during execution

**T=20s: Task completes**

- ✅ Task status changes to "completed"
- ✅ Progress rail reaches 100%
- ✅ Terminal shows: "[TASK COMPLETE] build (20.45s)\n"
- ✅ Task count decrements: "0 tasks"

**T=20.1s: Card collapses**

- ✅ Card animates from expanded (540px) to collapsed (280px)
- OR: Card disappears entirely and returns to collapsed button
- ✅ No manual interaction needed

### Verification Checklist

- [ ] Card appears at top-left when task starts
- [ ] Task count badge shows correct number
- [ ] Progress rail starts at non-zero baseline
- [ ] Progress bar updates every 500ms
- [ ] Task name appears in progress bar
- [ ] Terminal output streams in real-time
- [ ] Terminal bubble mirrors Shell tab output
- [ ] Desktop feed updates every 1200ms
- [ ] Files tab is responsive during task
- [ ] Studio tab allows editing during task
- [ ] Card collapses when task completes
- [ ] No TypeScript errors in browser console
- [ ] No network errors in DevTools Network tab

---

## Test Scenario 2: Multiple Tasks (Parallelism)

### Setup

1. Open browser DevTools console
2. Have task execution endpoint ready

### Test Command Sequence

```javascript
// In browser console:
const { globalTaskManager } =
  await import("./.Agent_Lee_OS/utils/TaskManager.ts");

// Submit 3 tasks simultaneously
globalTaskManager.submitTask("Task 1", "complex", async (task) => {
  for (let i = 0; i <= 100; i += 20) {
    await new Promise((r) => setTimeout(r, 500));
    globalTaskManager.updateTaskProgress(task.id, i);
  }
});

globalTaskManager.submitTask("Task 2", "small", async (task) => {
  for (let i = 0; i <= 100; i += 33) {
    await new Promise((r) => setTimeout(r, 300));
    globalTaskManager.updateTaskProgress(task.id, i);
  }
});

globalTaskManager.submitTask("Task 3", "complex", async (task) => {
  for (let i = 0; i <= 100; i += 25) {
    await new Promise((r) => setTimeout(r, 400));
    globalTaskManager.updateTaskProgress(task.id, i);
  }
});
```

### Expected Behavior

**T=0s: All tasks submitted**

- ✅ Card appears
- ✅ Badge shows: "3 tasks"
- ✅ First task name in progress bar

**T=0-1s: Task queue processing**

- ✅ Manager runs up to 3 complex + 6 small concurrently
- ✅ Task 1 starts immediately (complex slot 1)
- ✅ Task 2 starts immediately (small slot 1)
- ✅ Task 3 starts immediately (complex slot 2)
- ✅ Terminal output shows all 3 starting:
  ```
  [TASK START] Task 1
  [TASK START] Task 2
  [TASK START] Task 3
  ```

**T=1-3s: Progress updates**

- ✅ Progress rail calculation: (completed / total) \* 100
- ✅ Progress bar updates are smooth
- ✅ Shows average progress of all tasks

**T=3-5s: Tasks finish**

- ✅ Task 2 completes first (0%, 33%, 66%, 100%)
- ✅ Badge updates to "2 tasks"
- ✅ Task 1 and 3 continue running
- ✅ Terminal shows completion for Task 2

**T=5-7s: Final tasks complete**

- ✅ All tasks reach 100%
- ✅ Progress rail reaches 100%
- ✅ Badge shows "0 tasks"
- ✅ Card collapses

### Verification Checklist

- [ ] All 3 tasks start (not queued)
- [ ] Task count badge updates correctly
- [ ] Progress bar reflects combined progress
- [ ] Terminal shows correct output for all 3
- [ ] Task completion order is correct
- [ ] Badge decrements as tasks finish
- [ ] No task deadlocks
- [ ] No progress calculation errors
- [ ] Card stays visible while any task running
- [ ] Card collapses only when ALL complete

---

## Test Scenario 3: Error Handling

### Setup

1. Create a task that fails

### Test Code

```javascript
globalTaskManager.submitTask("Failing Task", "complex", async (task) => {
  globalTaskManager.updateTaskProgress(task.id, 50);
  throw new Error("Test failure");
});
```

### Expected Behavior

- ✅ Card appears
- ✅ Progress shows 50%
- ✅ Terminal shows:
  ```
  [TASK START] Failing Task
  [TASK ERROR] Failing Task: Test failure
  ```
- ✅ Task status becomes "failed"
- ✅ Progress calculation doesn't crash
- ✅ Card still collapses when complete

### Verification Checklist

- [ ] Error message appears in terminal
- [ ] Progress doesn't get stuck
- [ ] Task count decrements
- [ ] No uncaught exceptions
- [ ] Card behavior unaffected

---

## Test Scenario 4: Terminal Output Sync

### Verify all channels integrate

### Expected Output Destinations

1. **Shell Tab** - Terminal content from terminal websocket
2. **Terminal Bubble** - Same terminal content (floating preview)
3. **Task Output** - Output from TaskManager callbacks
4. **Studio Terminal** - If switching to Code Studio, maintains output

### Test Code

```javascript
globalTaskManager.submitTask("Output Test", "complex", async (task) => {
  for (let i = 0; i <= 3; i++) {
    globalTaskManager.updateTaskProgress(task.id, i * 25);
    // Also invoke onOutput manually to test
    // In real usage, executor would call task callbacks
  }
});
```

### Verification Checklist

- [ ] Output appears in Shell tab
- [ ] Same output in Terminal bubble
- [ ] Output scrolls to bottom automatically
- [ ] No duplicate output
- [ ] No missing output
- [ ] Formatting preserved (colors via ANSI stripping)

---

## Browser DevTools Checks

### Console Output

- No TypeScript errors
- Match:
  ```
  [AppContentAdapter] TaskManager sync working
  [useTaskManagerSync] Subscribed to TaskManager
  ```

### Network Tab

- No failed requests to:
  - `/api/terminal/session` (POST)
  - `/api/terminal/ws` (WebSocket)
  - `/api/device/screenshot` (GET)
  - `/api/vm/vfs` (GET)
  - `/api/vm/vfs/read` (GET)
  - `/api/vm/vfs/write` (POST)

### React DevTools (if installed)

- WorkstationContext state updates every 500ms
- buildProgress changes smoothly
- terminalOutput appends correctly
- tasks array reflects actual counts

---

## Visual Verification Checklist

### Card Position

- [ ] Floating at top-left when tasks active
- [ ] Smooth animation from collapsed to floating
- [ ] Smooth animation back to collapsed
- [ ] Down arrow button (-bottom-8) visible and functional

### Progress Rail

- [ ] Smooth progress animation (500ms easing)
- [ ] Percentage updates every 500ms
- [ ] Progress bar is cyan/blue gradient
- [ ] No flicker or jank

### Terminal

- [ ] Output has monospace font (11px)
- [ ] Lines wrap correctly
- [ ] Scrolls to bottom automatically
- [ ] Dark background, light text

### Task Badge

- [ ] Shows correct count
- [ ] Amber/yellow color
- [ ] Updates when tasks finish

### Tabs (Desktop / Shell / Code / Files)

- [ ] All remain responsive during task
- [ ] Tab switching doesn't break progress
- [ ] Each tab shows correct content

---

## Performance Checks

### During Single Task

- CPU: < 15% (polling every 500ms)
- Memory: No growth > 5MB over 10 tasks
- Smooth 60fps animations

### During 3 Concurrent Tasks

- CPU: < 25% (Task Manager parallelism)
- Memory: Stable
- No UI lag
- Progress updates remain smooth

---

## Sign-Off Criteria

All Step 6 implementation is **COMPLETE** when:

✅ Data Flow:

- [ ] TaskManager → useTaskManagerSync → Context → UI
- [ ] Unidirectional, no circular dependencies

✅ Progress Rail:

- [ ] Uses real buildProgress from context
- [ ] Smooth animation every 500ms
- [ ] Correctly calculates (completed / total) \* 100
- [ ] Shows task name and percentage

✅ Terminal:

- [ ] All output routes through single terminal stream
- [ ] Appears in Shell tab, bubble, and stored in context
- [ ] Real-time with no delays

✅ Auto-Show/Collapse:

- [ ] Card appears when taskCount > 0
- [ ] Card collapses when taskCount === 0
- [ ] Respects manual open state

✅ Parallelism:

- [ ] Multiple tasks run concurrently
- [ ] Counts stay accurate
- [ ] Progress reflects combined state

✅ Error Handling:

- [ ] Failed tasks don't crash UI
- [ ] Errors appear in terminal
- [ ] Counts update correctly

✅ No Regressions:

- [ ] Desktop, Files, Code Studio still work
- [ ] Chat input still works
- [ ] No TypeScript errors
- [ ] No console exceptions

---

## If Tests Fail

### Debugging Checklist

1. Check console for errors:

   ```
   Error in useTaskManagerSync?
   Error in AppContentAdapter?
   Error in AgentLeeComputerCard?
   ```

2. Check context state updating:

   ```javascript
   // In DevTools console:
   document.querySelector('[data-testid="workstation-state"]')?.innerHTML;
   // Should show updates every 500ms
   ```

3. Check TaskManager subscriptions active:

   ```javascript
   globalTaskManager.getStats();
   // Should show correct counts
   ```

4. Check progress sync:
   ```javascript
   // In React DevTools:
   // WorkstationContext.state.buildProgress
   // Should match globalTaskManager progress
   ```

---

## Next Steps After Verification

Once all checks pass:

1. ✅ Phase 3 complete (all 6 steps wired)
2. Run full system integration test
3. Verify all 5 data sources work together:
   - Terminal websocket
   - Screenshot polling
   - VFS navigation
   - File I/O
   - Progress tracking
4. Begin Phase 4: Stabilization and optimization
