# Agent Lee Android Port — Complete Deliverables Index

**Project Status:** ✅ Ready for Implementation  
**Date:** 2026-03-28  
**Scope:** Full technical design + 11-slice implementation plan + comprehensive test strategy + Slice 1 MVP scaffold

---

## 📚 Document Navigation

### Phase 0: Understanding the Scope
**Start here** if you're new to the project.

1. **[00-DELIVERY-SUMMARY.md](./00-DELIVERY-SUMMARY.md)** (5 min read)
   - Overview of what's been delivered
   - Technology decisions locked in
   - Next steps + timeline
   - Key takeaways

### Phase 1: Architecture & Design
**For architects and senior engineers.**

2. **[01-TECHNICAL-DESIGN.md](./01-TECHNICAL-DESIGN.md)** (30 min read)
   - Complete system architecture (14 sections)
   - 3-lane runtime model (Conversation, Tasks, Voice)
   - Event bus + state store pattern
   - Android-specific bindings (Foreground Service, Overlay Bubble)
   - Integration points (llama.cpp JNI, Vosk STT, Android TTS)
   - Threat model + safety tiers (A/B/C)
   - Performance budgets + offline/online matrix
   - Dependency injection setup (Hilt)
   - Known constraints + Phase-2 enhancements

**Key decisions:** llama.cpp (LLM), Vosk (STT), Android TTS, Hilt DI, event-driven runtime

### Phase 2: Implementation Roadmap
**For project managers and sprint planners.**

3. **[02-IMPLEMENTATION-PLAN.md](./02-IMPLEMENTATION-PLAN.md)** (45 min read)
   - 11 slices phased over 8–10 weeks
   - Each slice with:
     - Clear deliverables (what code ships)
     - Acceptance criteria (must-pass tests)
     - Effort estimate (days/weeks)
     - Key files to create
     - Dependencies on prior slices
   - Slice breakdown:
     - **Slice 1** (Week 1–2): Runtime foundation + streaming chat
     - **Slice 2** (Week 3–4): Background tasks + tools + audit
     - **Slice 3** (Week 5–6): Voice I/O (STT+TTS)
     - **Slice 4** (Week 7–8): Overlay bubble + always-on
     - **Slice 5** (Week 9): Wake word detection
     - **Slice 6** (Week 10): Persona + emotion system
     - **Slice 7+** (Weeks 11+): Real LLM, accessibility, memory, testing
   - Timeline summary table
   - Success criteria (final acceptance)

**Key insight:** Each slice unblocks the next; realistic timeline with team capacity accounted for.

### Phase 3: Testing & Quality
**For QA, test engineers, and CI/CD leads.**

4. **[03-TEST-STRATEGY.md](./03-TEST-STRATEGY.md)** (45 min read)
   - Test pyramid: Unit → Integration → Instrumentation → E2E → Soak
   - Unit tests (JUnit + Kotlin, no device needed)
     - EventBus, StateManager, Conversation, JobQueue, Tools, Emotion
   - Integration tests (multi-component, no framework)
     - Concurrent conversation + tasks
     - Voice + chat interaction
     - Offline memory persistence
   - Instrumentation tests (Android-specific, requires device)
     - Foreground Service, Overlay Bubble, Permissions, Onboarding
   - E2E scenarios (realistic workflows)
     - Offline conversation, voice barge-in, accessibility automation
   - Soak tests (24–72 hours)
     - Conversation loop reliability
     - Concurrent task reliability
     - Accessibility automation safe operation
   - Performance benchmarks
     - LLM token latency, STT latency, TTS speed, memory growth
   - Test data + fixtures
   - CI/CD setup (GitHub Actions optional)
   - Test reporting template

**Key metrics:** ~1.5 hours full test suite execution (excluding soak); 80%+ domain coverage

### Phase 4: Getting Started (Slice 1)
**For developers building Slice 1 right now.**

5. **[agent-lee-android/README-SLICE1.md](../agent-lee-android/README-SLICE1.md)** (15 min read)
   - Project structure (organized layers)
   - Features implemented in Slice 1
   - Build & run instructions (Android Studio + CLI)
   - Usage demo (type messages, see streaming)
   - Architecture highlights (event flow, no blocking)
   - Code snippets (input, streaming, UI)
   - Testing commands
   - Known limitations (what's in Slice 2+)
   - Acceptance criteria checklist
   - Troubleshooting tips
   - Performance metrics (baseline)

**Quick start:**
```bash
cd agent-lee-android
./gradlew assembleDebug          # Build
./gradlew installDebug           # Install to device
./gradlew test                   # Run unit tests
```

---

## 🗂️ Project Structure

```
d:\Portable-VSCode-MCP-Kit\
├── android-design-docs/
│   ├── 00-DELIVERY-SUMMARY.md              ← Start here for overview
│   ├── 01-TECHNICAL-DESIGN.md              ← Architecture review
│   ├── 02-IMPLEMENTATION-PLAN.md           ← Sprint planning
│   └── 03-TEST-STRATEGY.md                 ← QA planning
│
└── agent-lee-android/                      ← Complete Android project
    ├── build.gradle.kts
    ├── settings.gradle.kts
    ├── README-SLICE1.md                    ← Build & run guide
    ├── app/
    │   ├── build.gradle.kts                ← 30+ dependencies defined
    │   └── src/
    │       ├── main/
    │       │   ├── AndroidManifest.xml     ← Services + permissions
    │       │   ├── java/com/leeway/agentlee/
    │       │   │   ├── AgentLeeApp.kt      ← @HiltAndroidApp
    │       │   │   ├── di/
    │       │   │   │   └── AgentModule.kt  ← Hilt DI
    │       │   │   ├── domain/
    │       │   │   │   ├── model/
    │       │   │   │   │   ├── DomainModels.kt  ← Core data (IDs, states, events)
    │       │   │   │   │   └── Events.kt       ← 30+ DomainEvent subtypes
    │       │   │   │   ├── bus/
    │       │   │   │   │   └── EventBus.kt     ← Event bus + state manager
    │       │   │   │   ├── conversation/
    │       │   │   │   │   └── ConversationEngine.kt  ← LLM interface + fake impl
    │       │   │   │   └── runtime/
    │       │   │   │       └── AgentRuntime.kt       ← Main orchestrator
    │       │   │   ├── presentation/
    │       │   │   │   ├── MainActivity.kt            ← Activity
    │       │   │   │   ├── AgentLeeScreen.kt         ← Compose UI
    │       │   │   │   └── viewmodel/
    │       │   │   │       └── AgentViewModel.kt     ← MVVM ViewModel
    │       │   │   └── ui/
    │       │   │       └── theme/
    │       │   │           └── Theme.kt              ← Material 3 theme
    │       │   └── res/
    │       │       └── values/
    │       │           ├── strings.xml
    │       │           └── colors.xml
    │       └── test/
    │           └── java/com/leeway/agentlee/
    │               ├── domain/bus/
    │               │   ├── EventBusTest.kt
    │               │   └── StateManagerTest.kt
    │               └── domain/conversation/
    │                   └── FakeLlmEngineTest.kt
```

---

## 🎯 Quick Decision Reference

| Question | Answer | Source |
|----------|--------|--------|
| **What's the main LLM?** | llama.cpp (GGUF) via JNI | Tech Design §7, Plan Slice 7 |
| **How does voice work?** | Vosk (STT) + Android TTS (baseline) + optional Gemini TTS | Tech Design §4–5 |
| **Is it offline?** | 100% offline core; cloud optional for premium voice | Tech Design §8, Plan §1.2 |
| **When does voice come?** | Slice 3 (Week 5–6) | Plan Slice 3 |
| **How do background tasks work?** | JobQueue with configurable concurrency (default 2 workers) | Plan Slice 2 |
| **Is conversation non-blocking?** | Yes; 3-lane event-driven runtime | Tech Design §3, MVP proven in Slice 1 |
| **How are sensitive actions protected?** | Risk tiers A/B/C with approval + audit log | Tech Design §6 |
| **When is always-on bubble ready?** | Slice 4 (Week 7–8) | Plan Slice 4 |
| **How long to production MVP?** | 8–10 weeks with phased slices | Plan Timeline Summary |
| **What's the architecture pattern?** | Event-driven MVVM + DI (Hilt) | Tech Design §3, Slice 1 |

---

## 📋 Pre-Implementation Checklist

Before starting Slice 1, verify:

- [ ] Android Studio 2023.2+ installed
- [ ] Java 17+ JDK available
- [ ] Android SDK API 31+ downloaded
- [ ] Gradle 8.2+ configured
- [ ] Team has read 00-DELIVERY-SUMMARY.md
- [ ] Architects approved 01-TECHNICAL-DESIGN.md
- [ ] PM has reviewed 02-IMPLEMENTATION-PLAN.md + timeline
- [ ] QA lead reviewed 03-TEST-STRATEGY.md
- [ ] Developers ready to start agent-lee-android/README-SLICE1.md workflow

---

## 🚀 Getting Started (Immediate Next Steps)

### For the Team Lead / Architect
1. Read [00-DELIVERY-SUMMARY.md](./00-DELIVERY-SUMMARY.md) (5 min)
2. Review [01-TECHNICAL-DESIGN.md](./01-TECHNICAL-DESIGN.md) (30 min)
3. Approve technology selections (locked: llama.cpp, Vosk, Android TTS)
4. Review 3-lane architecture + event flow
5. Sign off on threat model + performance budgets

### For Sprint Planners / PMs
1. Read [02-IMPLEMENTATION-PLAN.md](./02-IMPLEMENTATION-PLAN.md) (45 min)
2. Map slices to sprints (each slice ≈ 2 weeks)
3. Identify dependencies + blockers
4. Allocate dev team by specialty (domain logic, UI, infra, testing)
5. Set up backlog (11 slices as epics)

### For QA / Test Engineers
1. Read [03-TEST-STRATEGY.md](./03-TEST-STRATEGY.md) (45 min)
2. Set up CI/CD (GitHub Actions template provided)
3. Procure device fleet (for instrumentation tests)
4. Define test pass/fail criteria
5. Plan 72-hour soak test infrastructure

### For Developers Starting Slice 1
1. Read [agent-lee-android/README-SLICE1.md](../agent-lee-android/README-SLICE1.md) (15 min)
2. Clone/copy [agent-lee-android](../agent-lee-android) to your workspace
3. Run `./gradlew build` + `./gradlew test` (verify setup)
4. Open in Android Studio
5. Build + install to emulator or device
6. Launch app, test chat streaming
7. Proceed with Slice 2 once Slice 1 tests pass

---

## 📞 FAQ

### Q: Can we start on Slice 2 (tasks) before finishing Slice 1?
**A:** Not recommended. Slice 1 establishes the event bus + state manager, which Slice 2 depends on. Slice 1 should take 1–2 weeks to stabilize.

### Q: Is the fake LLM (FakeLlmEngine) good enough for early demos?
**A:** Yes! It's deterministic, offline, and proves the streaming architecture. Replace with llama.cpp in Slice 7.

### Q: When can we test voice?
**A:** Slice 3 (Week 5–6). Until then, use text input only.

### Q: Can accessibility (Slice 8) be moved earlier?
**A:** Technically yes, but it introduces risk (user permissions, UI fragility). Recommend finishing core (Slices 1–5) first, then tackle Slice 8.

### Q: Do we need Gemini?
**A:** No. Optional for premium voice (TTS only). Never for reasoning. All core features work offline.

### Q: How is memory persistence handled?
**A:** Room database (Slice 9). Until then, messages are lost on restart.

### Q: Is the bubble service essential?
**A:** Yes, for always-on behavior (Slice 4). Until then, app only runs while in foreground.

---

## 📖 How to Read These Documents

### If you have 15 minutes
→ Read **00-DELIVERY-SUMMARY.md** + **README-SLICE1.md**  
You'll understand what was built and how to run it.

### If you have 1 hour
→ Read **00-DELIVERY-SUMMARY.md** + **01-TECHNICAL-DESIGN.md (sections 1–4)**  
You'll understand the architecture and event flow.

### If you have 2–3 hours
→ Read all 4 design docs + README-SLICE1.md  
You'll be ready to lead implementation.

### If you have a day
→ Read all docs + clone agent-lee-android + run Slice 1  
You'll be ready to ship Slice 1 and plan Slice 2.

---

## ✨ What You Have

This is a **production-ready design** for Agent Lee on Android:

✅ **Complete architecture** — 14 sections, 1000+ lines  
✅ **11-slice roadmap** — 8–10 weeks to MVP, clear phasing  
✅ **Comprehensive testing** — Unit + integration + E2E + soak + performance  
✅ **Working scaffold** — Compiles, runs, tests pass  
✅ **Decision-locked** — Tech choices documented with rationale  
✅ **Offline-first** — No cloud dependencies for core features  
✅ **Safety-by-design** — Approvals, audit log, threat model  
✅ **Scalable** — 11 slices ready for parallel teams  

---

## 🎓 Key Principles

1. **Events first** — Everything flows through EventBus → StateManager → UI
2. **Non-blocking** — Conversation never waits for tasks or voice
3. **Local-first** — Offline core; cloud optional for premium features
4. **Safe by default** — Risk tiers, approvals, and audit logs from day 1
5. **Test-driven** — 80%+ unit coverage, comprehensive E2E scenarios
6. **Phased delivery** — 11 independent slices, each shippable
7. **Android-native** — Jetpack, coroutines, Material 3, Hilt

---

## 📅 Timeline at a Glance

| Weeks | Slices | Milestone |
|-------|--------|-----------|
| 1–2 | 1 | ✅ Runtime foundation + streaming chat |
| 3–4 | 2 | Background tasks + tools + audit |
| 5–6 | 3 | Voice I/O (STT + TTS) |
| 7–8 | 4 | Overlay bubble + always-on |
| 9 | 5 | Wake word detection |
| 10 | 6 | Persona + emotion |
| 11 | 7 | Real llama.cpp LLM |
| 12 | 8 | Accessibility automation |
| 13 | 9 | Memory system + sync |
| 14 | 10 | Settings + diagnostics + onboarding |
| 15+ | 11 | Integration testing + soak + polish |

**Total: 8–10 weeks for MVP to production-ready**

---

## 🎯 Success Criteria

Agent Lee Android is done when:

✅ **Offline:** Conversation, voice, tasks, memory all work in airplane mode  
✅ **Non-blocking:** Chat responds in < 2 sec even during long tasks  
✅ **Always-on:** Bubble persists when app backgrounded  
✅ **Safe:** Sensitive actions require confirmation + audit log tracks everything  
✅ **Voice works:** Wake word → listen → transcribe → think → speak (< 5 sec end-to-end)  
✅ **Stable:** 72-hour soak shows < 50 MB heap growth/hour, 0 crashes  
✅ **Persona-aware:** Agent's responses reflect selected persona + emotion  

---

## 🔗 Related Agent Lee Docs

In your workspace, also see:
- `AGENT_LEE_BIBLE.md` — Agent Lee's core identity + values
- `AGENT_LEE_OS_SCHEMA.md` — Operating system architecture
- `AGENT_LEE_PERSONA.md` — Persona register definitions
- `AGENT_LEE_VALUES.json` — Value system + emotional engine
- `MCP-INTEGRATION-README.md` — Model Context Protocol integration (desktop reference)

---

## 📝 Notes for Implementation

### Gotchas to Watch
1. **JNI complexity** — llama.cpp JNI binding takes time; start early (Slice 7)
2. **Device variation** — Android OEMs heavily customize; test on real devices early
3. **Battery drain** — Always-on listening is power-hungry; document constraints
4. **Accessibility stability** — UI changes can break automation; whitelist conservatively
5. **Permission fatigue** — Request permissions in logical groups, not all at once

### Optimization Opportunities
1. **Token caching** — Cache LLM responses for repeated queries
2. **Model quantization** — Use smaller GGUF models if needed (2B instead of 7B)
3. **Adaptive listening** — Reduce mic polling when battery is low
4. **Memory archival** — Move old episodes to encrypted storage
5. **Parallel inference** — Use multiple worker threads for LLM if device supports

---

**Ready to build! Questions? See FAQ or refer back to specific design docs. 🚀**

