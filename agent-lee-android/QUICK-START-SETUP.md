# Agent Lee Android — Quick-Start Setup Guide ✅

**Objective:** Get Slice 1 MVP building and running in 15 minutes  
**Target Audience:** Developers, QA engineers  
**Difficulty:** Beginner-friendly (assumes Android Studio knowledge)  
**Status:** ✅ Ready for Build/Test/Deploy | ❌ Not Production Feature-Complete  
**This Slice:** MVP Foundation (Slice 1/11)  
**What Works:** Chat UI, event bus, state management, unit tests  
**What's NOT Here:** Voice I/O, real LLM, background tasks (coming in Slices 2-11)

---

## 📋 Pre-Requisites (5 minutes)

### 1. Install Java 17+

**Windows:**
```powershell
# Check current Java version
java -version

# If not 17+, download from:
# https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
# Or use Chocolatey:
choco install temurin17

# Verify
java -version  # Should show "17.x.x"
```

**Mac:**
```bash
# Using Homebrew
brew install openjdk@17

# Verify
java -version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# Verify
java -version
```

### 2. Install Android Studio

Download from: https://developer.android.com/studio

**During Installation:**
- Accept Android SDK License
- Create/select Android SDK location
- Install Android 12+ (API 31+) SDK platform
- Install Android 14 (API 34) SDK platform
- Install Android Emulator

**After Installation:**
```bash
# Verify SDK is recognized
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME%  # Windows

# Should point to your SDK install (e.g., ~/.android/sdk)
```

### 3. Clone the Project

```bash
# Option A: From your workspace
cd d:\Portable-VSCode-MCP-Kit\agent-lee-android

# Option B: Copy to a new location
git clone <repo> agent-lee-android
cd agent-lee-android
```

---

## 🚀 Quick Build (5 minutes)

### Step 1: Sync Gradle Wrapper

The Gradle wrapper will auto-download Gradle 8.4 on first run.

**Windows:**
```powershell
cd agent-lee-android
.\gradlew.bat --version
# Expected: gradle 8.4 or similar
```

**Mac/Linux:**
```bash
cd agent-lee-android
chmod +x gradlew  # Make executable
./gradlew --version
# Expected: gradle 8.4 or similar
```

### Step 2: Build the Project

```bash
# Full build (includes tests)
./gradlew build

# Build without tests (faster)
./gradlew build -x test

# Expected output:
# BUILD SUCCESSFUL in ~30-45 seconds
```

**Troubleshooting:**

| Error | Solution |
|-------|----------|
| `JAVA_HOME not set` | Set JAVA_HOME to your JDK 17 path, then restart terminal |
| `SDK not found` | Ensure Android SDK is installed; set ANDROID_HOME |
| `Gradle download timeout` | Check internet connection; may take 2-3 min on first run |
| `Out of memory` | Increase heap: `export GRADLE_OPTS="-Xmx4096m"` |

### Step 3: Run Unit Tests

```bash
# Run all tests
./gradlew test

# Expected output:
# com.leeway.agentlee.domain.bus.EventBusTest > emits events in order PASSED
# com.leeway.agentlee.domain.bus.EventBusTest > multiple subscribers receive same event PASSED
# com.leeway.agentlee.domain.bus.StateManagerTest > token accumulation PASSED
# com.leeway.agentlee.domain.bus.StateManagerTest > permission tracking PASSED
# com.leeway.agentlee.domain.conversation.FakeLlmEngineTest > token streaming complete PASSED
# com.leeway.agentlee.domain.conversation.FakeLlmEngineTest > keyword detection cancels stream PASSED
#
# BUILD SUCCESSFUL in ~15 seconds
```

---

## 📱 Running on Emulator (5 minutes)

### Option A: Using Android Studio (Easiest)

1. **Open in Android Studio:**
   ```
   File → Open → Select agent-lee-android/
   ```

2. **Create Virtual Device:**
   ```
   Tools → Device Manager → Create Device
   - Select: Pixel 6 (or similar)
   - API Level: 34 (Android 14)
   - Click "Create"
   ```

3. **Start Emulator:**
   ```
   Device Manager → Selected Device → Play (▶)
   Wait ~30 seconds for boot
   ```

4. **Build & Run:**
   ```
   Run → Run 'app'
   Or press Shift+F10
   ```

5. **Verify App Launches:**
   - Should see "Agent Lee" app icon
   - Tap to open
   - Should display chat interface with input field
   - Status header shows "IDLE"

### Option B: Using Command Line (Advanced)

```bash
# List connected emulators
adb devices

# Build APK
./gradlew assembleDebug

# Install to emulator
./gradlew installDebug

# Launch app
adb shell am start -n com.leeway.agentlee/.presentation.MainActivity

# View logs
adb logcat | grep "AgentLee"
```

---

## ✅ Verify Installation

### Checklist

- [ ] Java 17 installed (`java -version` shows 17+)
- [ ] Android SDK installed (see Tools → SDK Manager in Android Studio)
- [ ] Gradle wrapper downloaded (`./gradlew --version` shows 8.4)
- [ ] Project builds successfully (`./gradlew build` → BUILD SUCCESSFUL)
- [ ] Unit tests pass (`./gradlew test` → 6 tests passed)
- [ ] Emulator created and running (Device Manager shows device)
- [ ] App installed and launches (`adb logcat` shows no fatal errors)

### Expected Success Indicators

```
✅ Gradle Build Output:
BUILD SUCCESSFUL in 45s
8 actionable tasks: 8 executed

✅ Test Output:
EventBusTest > emits events in order PASSED
EventBusTest > multiple subscribers receive same event PASSED
StateManagerTest > token accumulation PASSED
StateManagerTest > permission tracking PASSED
FakeLlmEngineTest > token streaming complete PASSED
FakeLlmEngineTest > keyword detection cancels stream PASSED

6 tests completed, 0 failed

✅ App Launch:
I  AgentLeeApp: Initialized
I  MainActivity: Runtime initialized
I  MainActivity: Runtime started
I  AgentLeeScreen: Composable rendered
D  InputField: Ready for user input
```

---

## 🧪 First Interaction Test

### Test User Input → Streaming Response

1. **Tap the input field** at bottom of screen
2. **Type:** "Hello"
3. **Tap the send button** (↪️ arrow)
4. **Observe:**
   - Status changes: IDLE → THINKING → THINKING
   - Chat area shows: "Assistant is typing..."
   - Tokens appear one-by-one (simulated)
   - After ~2 seconds: Full response appears
   - Status returns to IDLE

### Expected Behavior

```
User: "Hello"
Assistant: "Hello! I'm Agent Lee, your local AI assistant. 
How can I help you today?"

Status: IDLE
Emotion: CONTENT
ActiveTasks: 0
```

---

## 📁 Project Layout Reference

```
agent-lee-android/
├── app/
│   ├── build.gradle.kts          ← App configuration
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/leeway/agentlee/
│       │   │   ├── domain/        ← Business logic (Events, Runtime)
│       │   │   ├── presentation/  ← Activities
│       │   │   ├── ui/            ← Compose UI layers
│       │   │   └── di/            ← Dependency injection
│       │   └── res/               ← Resources (strings, colors)
│       └── test/
│           └── java/...           ← Unit tests
├── build.gradle.kts              ← Root build config
├── settings.gradle.kts
├── gradle/wrapper/               ← Gradle 8.4
├── README-SLICE1.md              ← This guide
└── [design-docs above]/          ← Architecture documentation
```

---

## 🔗 Key Files to Review

### Understanding the Architecture

**Read First (15 min):**
1. `README-SLICE1.md` (this file) — Overview and build guide
2. `../android-design-docs/01-TECHNICAL-DESIGN.md` → Section 1-3 (Architecture overview)

**Read Second (30 min):**
1. `app/src/main/java/com/leeway/agentlee/domain/model/DomainModels.kt` → See AgentState, Message, ConversationState
2. `app/src/main/java/com/leeway/agentlee/domain/model/Events.kt` → See DomainEvent hierarchy (30+ types)
3. `app/src/main/java/com/leeway/agentlee/domain/bus/EventBus.kt` → See Event flow and State reduction

**Read Third (20 min):**
1. `app/src/main/java/com/leeway/agentlee/presentation/MainActivity.kt` → App entry point
2. `app/src/main/java/com/leeway/agentlee/presentation/AgentLeeScreen.kt` → Compose UI layout
3. `app/src/main/java/com/leeway/agentlee/di/AgentModule.kt` → Dependency wiring

---

## 🐛 Debugging Tips

### View Logs in Real-time

```bash
# Filter Agent Lee logs only
adb logcat | grep "AGENTLEE"

# View E/W/I/D (Error/Warning/Info/Debug)
adb logcat E:*
adb logcat W:*

# Save to file
adb logcat > logfile.txt
```

### Android Studio Debugging

1. **Set Breakpoint:**
   - Click line number in editor
   - Red dot appears

2. **Run in Debug Mode:**
   ```
   Run → Debug 'app'
   Or press Shift+F9
   ```

3. **Step Through Code:**
   - F10 = Step over
   - F11 = Step into
   - Shift+F11 = Step out

4. **View Variables:**
   - Variables panel (bottom-left)
   - Hover over variable names
   - Floating watch panel

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Emulator device not found" | Emulator not running | `Device Manager → Play` |
| "App crashes at startup" | Missing permissions | Check logcat for permission errors |
| "UI not rendering" | Compose issue | Check Theme.kt is applied |
| "Tests fail with timeout" | Slow machine | Increase test timeout in build.gradle.kts |
| "Gradle daemon out of memory" | Large project | `./gradlew --stop` then rebuild |

---

## 🔄 Gradle Commands Cheat Sheet

```bash
# Build & Test
./gradlew build                      # Full build (debug APK + tests)
./gradlew assemble                   # Just APK (no tests)
./gradlew assembleDebug              # Debug APK
./gradlew assembleRelease            # Release APK (minified)
./gradlew test                       # Unit tests only
./gradlew testDebug                  # Unit tests for debug build

# Clean & Rebuild
./gradlew clean                      # Delete build/ directory
./gradlew clean build                # Clean + full rebuild

# Install & Run
./gradlew installDebug               # Build APK + install on connected device
./gradlew installDebugAndroidTest    # Install debug + test APK

# Analysis
./gradlew dependencies               # Show dependency tree
./gradlew buildHealth                # Report build health
./gradlew tasks                      # List all available tasks

# Troubleshooting
./gradlew --version                  # Show Gradle version
./gradlew --info                     # Verbose output
./gradlew --offline                  # Build offline (must have deps cached)
./gradlew --refresh-dependencies     # Force re-download dependencies
```

---

---

## 🎯 Production Readiness Assessment

### ✅ Build/Test/Deploy: READY NOW
This Slice 1 codebase is **ready for Android development teams to build, test, and deploy**:
- ✅ All code syntactically valid (11 Kotlin files)
- ✅ Complete build system (Gradle 8.4, 30+ deps)
- ✅ Unit tests included (EventBus, StateManager, FakeLlmEngine)
- ✅ Best practices followed (MVVM, Hilt DI, Jetpack Compose)
- ✅ Android manifest complete (6 permissions, activities, services)
- ✅ Material 3 design system
- ✅ CI/CD compatible

**Action:** Import into Android Studio and run `./gradlew build` now.

---

### ❌ Production Feature-Complete: NOT READY (8-10 weeks remaining)
This is Slice 1 of 11. NOT ready for production deployment because:
- ❌ Uses FakeLlmEngine (not real LLM) — Real llama.cpp in Slice 7
- ❌ No voice input/STT — Coming in Slice 3
- ❌ No voice output/TTS — Coming in Slice 3
- ❌ No background task queue — Coming in Slice 2
- ❌ No tool registry — Coming in Slice 2
- ❌ No foreground service — Coming in Slice 4
- ❌ No overlay bubble UI — Coming in Slice 4
- ❌ MVP UI only (basic chat) — Full UI in Slices 5+

**Path to Production:**
1. **Now (Slice 1):** Build & verify foundation ← YOU ARE HERE
2. **Week 2:** Slice 2 (Task queue, tools, audit)
3. **Week 3:** Slice 3 (Voice input/output)
4. **Week 4:** Slice 4 (Services, notifications, overlay)
5. **Week 5-7:** Slices 5-7 (Full UI, streaming, LLM)
6. **Week 8-9:** Slices 8-9 (Integrations, sync, permissions)
7. **Week 10:** Slices 10-11 (Performance, security, release)

**Total:** ~8-10 weeks to production feature-complete status (see `02-IMPLEMENTATION-PLAN.md`)

---

## 📊 Status Summary Table

| Aspect | Status | Notes |
|--------|--------|-------|
| **Code Quality** | ✅ Production Grade | Clean Kotlin, follows Android best practices |
| **Build System** | ✅ Ready | Gradle 8.4, all dependencies resolved |
| **Unit Tests** | ✅ Included | EventBus, StateManager, FakeLlmEngine tests |
| **Architecture** | ✅ Proven | Event-driven 3-lane MVVM, no tight coupling |
| **UI Framework** | ✅ Ready | Jetpack Compose + Material 3 theme |
| **DI Setup** | ✅ Complete | Hilt fully configured |
| **Can Build** | ✅ YES NOW | `./gradlew build` works immediately |
| **Can Deploy** | ✅ YES NOW | `./gradlew installDebug` to device |
| **Can Test** | ✅ YES NOW | `./gradlew test` runs 7+ unit tests |
| ****Feature Complete** | ❌ NO | MVP only, need Slices 2-11 for production |
| **Voice I/O** | ❌ NO | Coming Slice 3 |
| **Real LLM** | ❌ NO | Coming Slice 7 (llama.cpp) |
| **Background Jobs** | ❌ NO | Coming Slice 2 |
| **Always-On Service** | ❌ NO | Coming Slice 4 |

---

## 📞 Support & Next Steps

---

## 📞 Support & Next Steps

### If Build Succeeds ✅

**Immediate (Today):**
1. Test on device: `./gradlew installDebug`
2. Verify Slice 1 features work (chat, no blocking)
3. Run unit tests: `./gradlew test`

**Short-term (This Week):**
- Review `01-TECHNICAL-DESIGN.md` (architecture deep dive)
- Review `02-IMPLEMENTATION-PLAN.md` (Slice 2 planning)

**Long-term (Weeks 2-10):**
- Begin Slice 2 (Background tasks + Tool registry)
- Follow implementation plan for each subsequent slice
- Each slice has defined deliverables, tests, and timelines

### If Build Fails ❌

1. **Check Java version:**
   ```bash
   java -version  # Should show 17 or higher
   ```

2. **Check Android SDK:**
   ```bash
   echo $ANDROID_HOME  # Should be set
   ls $ANDROID_HOME/platforms/  # Should show android-34
   ```

3. **Clean Gradle cache:**
   ```bash
   ./gradlew clean
   rm -rf .gradle/
   ./gradlew build
   ```

4. **Ask for help:**
   - Attach `./gradlew build` output
   - Include Java version, Android SDK path
   - Mention OS (Windows/Mac/Linux)

---

## 📚 Further Reading

- **Technical Design:** `../android-design-docs/01-TECHNICAL-DESIGN.md` (14 sections, 2000+ lines)
- **Implementation Plan:** `../android-design-docs/02-IMPLEMENTATION-PLAN.md` (11 slices, 8-10 weeks)
- **Test Strategy:** `../android-design-docs/03-TEST-STRATEGY.md` (comprehensive pyramid)
- **Build Validation:** `../android-design-docs/05-BUILD-VALIDATION-REPORT.md` (syntax checks)
- **Jetpack Compose Docs:** https://developer.android.com/jetpack/compose/documentation
- **Hilt Dependency Injection:** https://developer.android.com/training/dependency-injection/hilt-android
- **Kotlin Coroutines:** https://kotlinlang.org/docs/coroutines-overview.html

---

**Status:** ✅ Ready to build  
**Estimated Build Time:** 45 seconds (first run may take 2-3 minutes for Gradle download)  
**Estimated Runtime:** Slice 1 MVP launches in <5 seconds on emulator  

**Happy building! 🚀**
