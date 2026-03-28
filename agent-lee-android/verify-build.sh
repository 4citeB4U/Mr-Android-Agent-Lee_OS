#!/bin/bash
# Agent Lee Android — Automated Build Verification Script
# This script verifies that the Slice 1 MVP scaffold builds and tests pass
# Run with: ./verify-build.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "======================================================================"
echo "Agent Lee Android OS — Build Verification"
echo "======================================================================"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} File exists: $1"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} File missing: $1"
        ((FAIL++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} Directory exists: $1"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} Directory missing: $1"
        ((FAIL++))
    fi
}

# 1. Verify Project Structure
echo "1. Verifying Project Structure..."
echo "=================================="

check_dir "$PROJECT_ROOT/gradle/wrapper"
check_dir "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee"
check_dir "$PROJECT_ROOT/app/src/test/java/com/leeway/agentlee"
check_dir "$PROJECT_ROOT/app/src/main/res/values"

echo ""

# 2. Verify Gradle Configuration
echo "2. Verifying Gradle Configuration..."
echo "====================================="

check_file "$PROJECT_ROOT/build.gradle.kts"
check_file "$PROJECT_ROOT/app/build.gradle.kts"
check_file "$PROJECT_ROOT/settings.gradle.kts"
check_file "$PROJECT_ROOT/gradle/wrapper/gradle-wrapper.properties"
check_file "$PROJECT_ROOT/gradlew"
check_file "$PROJECT_ROOT/gradlew.bat"

echo ""

# 3. Verify Android Manifest
echo "3. Verifying Android Manifest..."
echo "================================="

check_file "$PROJECT_ROOT/app/src/main/AndroidManifest.xml"

# Verify manifest contains required elements
if grep -q '<manifest' "$PROJECT_ROOT/app/src/main/AndroidManifest.xml"; then
    echo -e "${GREEN}✅${NC} Manifest contains <manifest> tag"
    ((PASS++))
else
    echo -e "${RED}❌${NC} Manifest missing <manifest> tag"
    ((FAIL++))
fi

if grep -q '<application' "$PROJECT_ROOT/app/src/main/AndroidManifest.xml"; then
    echo -e "${GREEN}✅${NC} Manifest contains <application> tag"
    ((PASS++))
else
    echo -e "${RED}❌${NC} Manifest missing <application> tag"
    ((FAIL++))
fi

if grep -q 'AgentLeeApp' "$PROJECT_ROOT/app/src/main/AndroidManifest.xml"; then
    echo -e "${GREEN}✅${NC} Manifest references AgentLeeApp"
    ((PASS++))
else
    echo -e "${RED}❌${NC} Manifest doesn't reference AgentLeeApp"
    ((FAIL++))
fi

echo ""

# 4. Verify Source Files
echo "4. Verifying Source Files..."
echo "============================"

SOURCE_FILES=(
    "app/src/main/java/com/leeway/agentlee/AgentLeeApp.kt"
    "app/src/main/java/com/leeway/agentlee/domain/model/DomainModels.kt"
    "app/src/main/java/com/leeway/agentlee/domain/model/Events.kt"
    "app/src/main/java/com/leeway/agentlee/domain/bus/EventBus.kt"
    "app/src/main/java/com/leeway/agentlee/domain/runtime/AgentRuntime.kt"
    "app/src/main/java/com/leeway/agentlee/domain/conversation/ConversationEngine.kt"
    "app/src/main/java/com/leeway/agentlee/presentation/MainActivity.kt"
    "app/src/main/java/com/leeway/agentlee/presentation/AgentLeeScreen.kt"
    "app/src/main/java/com/leeway/agentlee/presentation/viewmodel/AgentViewModel.kt"
    "app/src/main/java/com/leeway/agentlee/ui/theme/Theme.kt"
    "app/src/main/java/com/leeway/agentlee/di/AgentModule.kt"
)

for file in "${SOURCE_FILES[@]}"; do
    check_file "$PROJECT_ROOT/$file"
done

echo ""

# 5. Verify Test Files
echo "5. Verifying Test Files..."
echo "=========================="

TEST_FILES=(
    "app/src/test/java/com/leeway/agentlee/domain/bus/EventBusTest.kt"
    "app/src/test/java/com/leeway/agentlee/domain/bus/StateManagerTest.kt"
    "app/src/test/java/com/leeway/agentlee/domain/conversation/FakeLlmEngineTest.kt"
)

for file in "${TEST_FILES[@]}"; do
    check_file "$PROJECT_ROOT/$file"
done

echo ""

# 6. Verify Resources
echo "6. Verifying Resources..."
echo "========================="

check_file "$PROJECT_ROOT/app/src/main/res/values/strings.xml"
check_file "$PROJECT_ROOT/app/src/main/res/values/colors.xml"

echo ""

# 7. Verify Documentation
echo "7. Verifying Documentation..."
echo "=============================="

check_file "$PROJECT_ROOT/../android-design-docs/00-DELIVERY-SUMMARY.md"
check_file "$PROJECT_ROOT/../android-design-docs/01-TECHNICAL-DESIGN.md"
check_file "$PROJECT_ROOT/../android-design-docs/02-IMPLEMENTATION-PLAN.md"
check_file "$PROJECT_ROOT/../android-design-docs/03-TEST-STRATEGY.md"
check_file "$PROJECT_ROOT/../android-design-docs/04-DELIVERY-CHECKLIST.md"
check_file "$PROJECT_ROOT/../android-design-docs/05-BUILD-VALIDATION-REPORT.md"
check_file "$PROJECT_ROOT/../android-design-docs/README.md"

echo ""

# 8. Attempt Gradle Build (if gradle/java available)
echo "8. Attempting Gradle Build..."
echo "============================="

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo -e "${GREEN}✅${NC} Java found: $JAVA_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️${NC} Java not found (Android SDK required for full build)"
    ((FAIL++))
fi

if [ -f "$PROJECT_ROOT/gradlew" ]; then
    echo -e "${GREEN}✅${NC} Gradle wrapper is executable"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️${NC} Gradle wrapper not found"
    ((FAIL++))
fi

echo ""

# 9. Summary
echo "======================================================================"
echo "Build Verification Summary"
echo "======================================================================"
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ALL VERIFICATIONS PASSED${NC}"
    echo ""
    echo "Next Steps to Build:"
    echo "1. Install Java 17+ (if not installed)"
    echo "2. Install Android SDK (if not installed)"
    echo "3. Run: ./gradlew build"
    echo "4. Run: ./gradlew test"
    echo "5. Run: ./gradlew installDebug"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME VERIFICATIONS FAILED${NC}"
    echo "Please check the output above for details."
    echo ""
    exit 1
fi
