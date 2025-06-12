#!/bin/bash

# ============================================================================
# local_ci.sh - BreakdownLogger Local CI
#
# Purpose:
#   Run all checks for the BreakdownLogger project before commit/push
#
# Usage:
#   bash scripts/local_ci.sh
#   DEBUG=true bash scripts/local_ci.sh  # for detailed output
# ============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Function to handle errors
handle_error() {
    local step=$1
    local message=$2
    
    echo -e "\n${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}ERROR: $step failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "$message"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
}

# Check if DEBUG mode is enabled
DEBUG_MODE=${DEBUG:-false}

if [ "$DEBUG_MODE" = "true" ]; then
    print_warning "Debug mode enabled"
    set -x
fi

# ============================================================================
# 1. Dependencies and Lock File
# ============================================================================

print_step "Refreshing dependencies"

# Remove and regenerate lock file
rm -f deno.lock
if ! deno cache --reload mod.ts 2>&1; then
    handle_error "Dependencies" "Failed to cache dependencies"
fi
print_success "Dependencies cached"

# ============================================================================
# 2. Type Checking
# ============================================================================

print_step "Running type checks"

# Check main entry point
if ! deno check mod.ts 2>&1; then
    handle_error "Type Check" "Type errors in mod.ts"
fi

# Check source files
for file in src/*.ts; do
    if [ -f "$file" ]; then
        if ! deno check "$file" 2>&1; then
            handle_error "Type Check" "Type errors in $file"
        fi
    fi
done

print_success "Type checks passed"

# ============================================================================
# 3. Tests
# ============================================================================

print_step "Running tests"

# Run tests with appropriate permissions
TEST_PERMISSIONS="--allow-env --allow-read"
TEST_ENV=""

if [ "$DEBUG_MODE" = "true" ]; then
    TEST_ENV="LOG_LEVEL=debug"
fi

# Run all tests in tests directory
if ! $TEST_ENV deno test $TEST_PERMISSIONS tests/ 2>&1; then
    if [ "$DEBUG_MODE" != "true" ]; then
        print_warning "Tests failed. Retrying with debug mode..."
        if ! LOG_LEVEL=debug deno test $TEST_PERMISSIONS tests/ 2>&1; then
            handle_error "Tests" "Tests failed. Run with DEBUG=true for more details"
        fi
    else
        handle_error "Tests" "Tests failed"
    fi
fi

print_success "All tests passed"

# ============================================================================
# 4. JSR Publish Check
# ============================================================================

print_step "Checking JSR publish readiness"

if ! deno publish --dry-run --allow-dirty 2>&1; then
    handle_error "JSR Check" "JSR publish check failed. Check deno.json configuration"
fi

print_success "JSR publish check passed"

# ============================================================================
# 5. Format Check
# ============================================================================

print_step "Checking code formatting"

if ! deno fmt --check 2>&1; then
    print_error "Format check failed"
    echo -e "\nRun ${YELLOW}deno fmt${NC} to fix formatting issues"
    exit 1
fi

print_success "Format check passed"

# ============================================================================
# 6. Lint Check
# ============================================================================

print_step "Running linter"

if ! deno lint 2>&1; then
    handle_error "Lint" "Linting errors found"
fi

print_success "Lint check passed"

# ============================================================================
# Success
# ============================================================================

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All checks passed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"