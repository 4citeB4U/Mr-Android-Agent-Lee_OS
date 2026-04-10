# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agentlee-mic-morph.spec.ts >> Agent Lee Mic >> should render and morph through all forms
- Location: docs\tests\agentlee-mic-morph.spec.ts:6:3

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> C:\Users\leota\AppData\Local\ms-playwright\webkit-2272\Playwright.exe --inspector-pipe --disable-accelerated-compositing --headless --no-startup-window
<launched> pid=24448
Call log:
  - <launching> C:\Users\leota\AppData\Local\ms-playwright\webkit-2272\Playwright.exe --inspector-pipe --disable-accelerated-compositing --headless --no-startup-window
  - <launched> pid=24448
  - [pid=24448] <gracefully close start>
  2 × [pid=24448] <kill>
    - [pid=24448] <will force kill>
    - [pid=24448] taskkill stderr: ERROR: This operation returned because the timeout period expired.
  - [pid=24448] <process did exit: exitCode=3221225501, signal=null>
  - [pid=24448] starting temporary directories cleanup
  - [pid=24448] finished temporary directories cleanup
  - [pid=24448] <gracefully close end>

```