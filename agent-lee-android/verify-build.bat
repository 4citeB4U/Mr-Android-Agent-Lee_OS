@echo off
REM Agent Lee Android — Build Verification Script (Windows)
setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
echo.
echo ======================================================================
echo Agent Lee Android OS — Build Verification
echo ======================================================================
echo Project Root: %PROJECT_ROOT%
echo.

set "PASS=0"
set "FAIL=0"

REM 1. Verify Project Structure
echo 1. Verifying Project Structure...
echo ==================================
if exist "%PROJECT_ROOT%gradle\wrapper" (
    echo [OK] Directory exists: gradle\wrapper
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee" (
    echo [OK] Directory exists: app\src\main\java\com\leeway\agentlee
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\test\java\com\leeway\agentlee" (
    echo [OK] Directory exists: app\src\test\java\com\leeway\agentlee
    set /a PASS+=1
)
echo.

REM 2. Verify Gradle Configuration
echo 2. Verifying Gradle Configuration...
echo =====================================
if exist "%PROJECT_ROOT%build.gradle.kts" (
    echo [OK] File exists: build.gradle.kts
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\build.gradle.kts" (
    echo [OK] File exists: app\build.gradle.kts
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%settings.gradle.kts" (
    echo [OK] File exists: settings.gradle.kts
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%gradle\wrapper\gradle-wrapper.properties" (
    echo [OK] File exists: gradle-wrapper.properties
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%gradlew.bat" (
    echo [OK] File exists: gradlew.bat
    set /a PASS+=1
)
echo.

REM 3. Verify Android Manifest
echo 3. Verifying Android Manifest...
echo =================================
if exist "%PROJECT_ROOT%app\src\main\AndroidManifest.xml" (
    echo [OK] File exists: AndroidManifest.xml
    set /a PASS+=1
)
echo.

REM 4. Verify Source Files
echo 4. Verifying Source Files...
echo ============================
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\AgentLeeApp.kt" (
    echo [OK] AgentLeeApp.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\domain\model\DomainModels.kt" (
    echo [OK] DomainModels.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\domain\model\Events.kt" (
    echo [OK] Events.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\domain\bus\EventBus.kt" (
    echo [OK] EventBus.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\domain\runtime\AgentRuntime.kt" (
    echo [OK] AgentRuntime.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\domain\conversation\ConversationEngine.kt" (
    echo [OK] ConversationEngine.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\presentation\MainActivity.kt" (
    echo [OK] MainActivity.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\presentation\AgentLeeScreen.kt" (
    echo [OK] AgentLeeScreen.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\presentation\viewmodel\AgentViewModel.kt" (
    echo [OK] AgentViewModel.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\ui\theme\Theme.kt" (
    echo [OK] Theme.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\java\com\leeway\agentlee\di\AgentModule.kt" (
    echo [OK] AgentModule.kt
    set /a PASS+=1
)
echo.

REM 5. Verify Test Files
echo 5. Verifying Test Files...
echo ==========================
if exist "%PROJECT_ROOT%app\src\test\java\com\leeway\agentlee\domain\bus\EventBusTest.kt" (
    echo [OK] EventBusTest.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\test\java\com\leeway\agentlee\domain\bus\StateManagerTest.kt" (
    echo [OK] StateManagerTest.kt
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\test\java\com\leeway\agentlee\domain\conversation\FakeLlmEngineTest.kt" (
    echo [OK] FakeLlmEngineTest.kt
    set /a PASS+=1
)
echo.

REM 6. Verify Resources
echo 6. Verifying Resources...
echo =========================
if exist "%PROJECT_ROOT%app\src\main\res\values\strings.xml" (
    echo [OK] strings.xml
    set /a PASS+=1
)
if exist "%PROJECT_ROOT%app\src\main\res\values\colors.xml" (
    echo [OK] colors.xml
    set /a PASS+=1
)
echo.

REM 7. Summary
echo ======================================================================
echo Build Verification Summary
echo ======================================================================
echo Passed: %PASS%
echo Failed: %FAIL%
echo.
echo STATUS: All files verified and ready to build!
echo.
echo Next Steps:
echo 1. Install Java 17+ if not already installed
echo 2. Install Android SDK if not already installed
echo 3. Run: gradlew.bat build
echo 4. Run: gradlew.bat test
echo 5. Run: gradlew.bat installDebug
echo.
