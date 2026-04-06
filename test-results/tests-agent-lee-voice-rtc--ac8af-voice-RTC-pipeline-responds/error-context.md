# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\agent-lee-voice-rtc.spec.ts >> Agent Lee voice/RTC pipeline responds
- Location: tests\agent-lee-voice-rtc.spec.ts:5:1

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('span.whitespace-pre-wrap') to be visible

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - heading "System Access" [level=2] [ref=e7]
    - paragraph [ref=e8]: Agent Lee requires authorization to access hardware subsystems for optimal performance.
  - generic [ref=e9]:
    - generic [ref=e10]:
      - img [ref=e12]
      - generic [ref=e15]: Camera Access
      - generic [ref=e18]: Required
    - generic [ref=e19]:
      - img [ref=e21]
      - generic [ref=e24]: Microphone Access
      - generic [ref=e27]: Required
    - generic [ref=e28]:
      - img [ref=e30]
      - generic [ref=e33]: Geolocation Access
      - generic [ref=e36]: Required
  - button "Authorize System" [ref=e37]
```