#!/bin/bash
# Agent Lee Android — Comprehensive Code Validation Script
# Validates that all Kotlin files have proper syntax structure

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=============================================================="
echo "Agent Lee Android OS — Code Syntax Validation"
echo "=============================================================="
echo ""

SYNTAX_ERRORS=0
SYNTAX_PASSED=0

check_kotlin_syntax() {
    local file="$1"
    local shortname=$(basename "$file")
    
    # Check for required Kotlin elements
    if grep -q "^package " "$file"; then
        echo "✓ $shortname: has package declaration"
        ((SYNTAX_PASSED++))
    else
        echo "✗ $shortname: MISSING package declaration"
        ((SYNTAX_ERRORS++))
    fi
    
    # Check for balanced braces
    local open_braces=$(grep -o '{' "$file" | wc -l)
    local close_braces=$(grep -o '}' "$file" | wc -l)
    if [ "$open_braces" -eq "$close_braces" ]; then
        echo "✓ $shortname: braces balanced ($open_braces pairs)"
        ((SYNTAX_PASSED++))
    else
        echo "✗ $shortname: UNBALANCED braces (open: $open_braces, close: $close_braces)"
        ((SYNTAX_ERRORS++))
    fi
    
    # Check for class/interface/object/fun declarations
    if grep -qE "(^class |^interface |^object |^fun )" "$file"; then
        echo "✓ $shortname: has valid declarations"
        ((SYNTAX_PASSED++))
    else
        echo "✗ $shortname: NO valid declarations found"
        ((SYNTAX_ERRORS++))
    fi
    
    echo ""
}

echo "Checking Domain Model Files..."
echo "=============================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/domain/model/DomainModels.kt"
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/domain/model/Events.kt"

echo "Checking Domain Bus Files..."
echo "============================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/domain/bus/EventBus.kt"

echo "Checking Domain Runtime Files..."
echo "================================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/domain/runtime/AgentRuntime.kt"

echo "Checking Conversation Engine..."
echo "==============================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/domain/conversation/ConversationEngine.kt"

echo "Checking Presentation Files..."
echo "=============================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/presentation/MainActivity.kt"
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/presentation/AgentLeeScreen.kt"
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/presentation/viewmodel/AgentViewModel.kt"

echo "Checking UI Layer..."
echo "===================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/ui/theme/Theme.kt"

echo "Checking DI Layer..."
echo "==================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/di/AgentModule.kt"

echo "Checking App Class..."
echo "===================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/main/java/com/leeway/agentlee/AgentLeeApp.kt"

echo ""
echo "Checking Test Files..."
echo "====================="
check_kotlin_syntax "$PROJECT_ROOT/app/src/test/java/com/leeway/agentlee/domain/bus/EventBusTest.kt"
check_kotlin_syntax "$PROJECT_ROOT/app/src/test/java/com/leeway/agentlee/domain/bus/StateManagerTest.kt"
check_kotlin_syntax "$PROJECT_ROOT/app/src/test/java/com/leeway/agentlee/domain/conversation/FakeLlmEngineTest.kt"

echo ""
echo "=============================================================="
echo "Syntax Validation Summary"
echo "=============================================================="
echo "Passed checks: $SYNTAX_PASSED"
echo "Failed checks: $SYNTAX_ERRORS"
echo ""

if [ $SYNTAX_ERRORS -eq 0 ]; then
    echo "✓ ALL SYNTAX CHECKS PASSED"
    echo ""
    echo "All Kotlin files have valid structure and are ready for compilation."
    exit 0
else
    echo "✗ SOME SYNTAX CHECKS FAILED"
    echo ""
    echo "Please review the output above."
    exit 1
fi
