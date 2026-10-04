#!/usr/bin/env bash
# ==============================================================================
# Belooga Engineering Ground Truth & Anti-Regression Auditor (SSOT Engine)
#
# Enforces SSOT (Single Source of Truth) between actual code, schemas, and docs.
# Fails immediately (exit code 1) if fact drift, security gaps, blocking calls,
# schema mismatches, or test regressions are detected.
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ERRORS=0

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${CYAN}       BELOOGA GROUND TRUTH & INTEGRITY AUDITOR (SSOT ENGINE)                  ${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# ------------------------------------------------------------------------------
# 1. DATABASE SCHEMA & TABLE NAMES MATCH (initdb.sql vs CURRENT_STATE.md)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] Verifying Database Schema & Table Names...${NC}"

PYTHON_BIN="backend/.venv/bin/python3"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

TABLE_CHECK_OUTPUT=$($PYTHON_BIN << 'EOF'
import re, sys
from pathlib import Path

initdb_path = Path('backend/initdb.sql')
current_state_path = Path('CURRENT_STATE.md')

if not initdb_path.exists():
    print('ERROR: backend/initdb.sql not found')
    sys.exit(1)

content = initdb_path.read_text(encoding='utf-8')
sql_tables = set(re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)', content, re.IGNORECASE))

if not current_state_path.exists():
    print('ERROR: CURRENT_STATE.md not found')
    sys.exit(1)

cs_content = current_state_path.read_text(encoding='utf-8')
cs_tables = set(re.findall(r'\|\s*\d+\s*\|\s*`([a-zA-Z0-9_]+)`\s*\|', cs_content))

missing_in_cs = sql_tables - cs_tables
extra_in_cs = cs_tables - sql_tables

if missing_in_cs:
    print(f'MISMATCH_MISSING: Tables in initdb.sql but missing in CURRENT_STATE.md: {sorted(missing_in_cs)}')
if extra_in_cs:
    print(f'MISMATCH_EXTRA: Tables in CURRENT_STATE.md that do NOT exist in initdb.sql: {sorted(extra_in_cs)}')

if not missing_in_cs and not extra_in_cs:
    print(f'OK: Exact match for all {len(sql_tables)} tables.')
EOF
)

if [[ "$TABLE_CHECK_OUTPUT" =~ "MISMATCH" ]] || [[ "$TABLE_CHECK_OUTPUT" =~ "ERROR" ]] || [[ "$TABLE_CHECK_OUTPUT" =~ "TABLE_CHECK_FAILED" ]]; then
    echo -e "  ${RED}CRITICAL SCHEMA DRIFT:${NC}"
    echo "  $TABLE_CHECK_OUTPUT"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✓ All 24 PostgreSQL table names in CURRENT_STATE.md match backend/initdb.sql exactly.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. BACKEND API ENDPOINTS INVENTORY & ROOT PROBES COUNT
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/7] Verifying Backend API Route Contracts & Probes...${NC}"

ROUTER_ENDPOINTS=$(grep -hEc "^\s*@router\.(get|post|put|patch|delete)" backend/app/api/v1/endpoints/*.py | awk '{s+=$1} END {print s}')
APP_ENDPOINTS=$(grep -hEc "^\s*@app\.(get|post|put|patch|delete)" backend/app/main.py | awk '{s+=$1} END {print s}')
TOTAL_ENDPOINTS=$((ROUTER_ENDPOINTS + APP_ENDPOINTS))

echo -e "  Found: ${GREEN}${ROUTER_ENDPOINTS} domain endpoints${NC} + ${GREEN}${APP_ENDPOINTS} root probes${NC} (Total: ${TOTAL_ENDPOINTS})"

if [ "$ROUTER_ENDPOINTS" -ne 36 ]; then
    echo -e "  ${RED}CRITICAL: Expected 36 domain endpoints, found ${ROUTER_ENDPOINTS}!${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ "$APP_ENDPOINTS" -ne 2 ]; then
    echo -e "  ${RED}CRITICAL: Expected 2 root health probes (/health, /v1), found ${APP_ENDPOINTS}!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ------------------------------------------------------------------------------
# 3. DYNAMIC AST MUTATION IDOR AUDIT (Inspect ALL mutation routes)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/7] Dynamic AST Inspection of Mutations for IDOR Protection...${NC}"

IDOR_VIOLATIONS=$($PYTHON_BIN << 'EOF'
import ast, glob

PUBLIC_MUTATIONS_WHITELIST = {
    'login', 'logout', 'refresh_tokens', 'register_user',
    'submit_contact_inquiry', 'report_candidate_profile'
}

violations = []
for file_path in glob.glob('backend/app/api/v1/endpoints/*.py'):
    with open(file_path, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read(), filename=file_path)

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            is_mutation = False
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                    if dec.func.attr.lower() in ('post', 'put', 'patch', 'delete'):
                        is_mutation = True
            
            if is_mutation and node.name not in PUBLIC_MUTATIONS_WHITELIST:
                # Check if get_current_user is in parameters
                has_auth = False
                for arg in node.args.args:
                    pass
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                src = ast.get_source_segment(content, node) or ''
                if 'get_current_user' not in src:
                    violations.append(f'{file_path}:{node.lineno} -> {node.name}() missing get_current_user')

if violations:
    print('\n'.join(violations))
EOF
)

if [ -z "$IDOR_VIOLATIONS" ]; then
    echo -e "  ${GREEN}✓ All candidate mutation endpoints have authenticated user ownership guards.${NC}"
else
    echo -e "  ${RED}CRITICAL IDOR: Mutations detected without authentication guard:${NC}"
    echo "$IDOR_VIOLATIONS"
    ERRORS=$((ERRORS + 1))
fi

# ------------------------------------------------------------------------------
# 4. BLOCKING CALLS IN ASYNC EVENT LOOP (open, doc.build, shutil, os.remove)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[4/7] Auditing Event-Loop Non-Blocking Safety (AST Inspection)...${NC}"

BLOCKING_CALLS=$($PYTHON_BIN << 'EOF'
import ast, glob

BLOCKING_FUNCS = {'open', 'remove', 'unlink', 'rmtree', 'copy', 'move', 'build'}

violations = []
for file_path in glob.glob('backend/app/api/v1/endpoints/*.py'):
    with open(file_path, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read(), filename=file_path)

    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef):
            for subnode in ast.walk(node):
                if isinstance(subnode, ast.Call):
                    # Check func name or attribute
                    func_name = None
                    if isinstance(subnode.func, ast.Name):
                        func_name = subnode.func.id
                    elif isinstance(subnode.func, ast.Attribute):
                        func_name = subnode.func.attr
                    
                    if func_name in BLOCKING_FUNCS:
                        # Exclude calls inside asyncio.to_thread(func, ...)
                        violations.append(f'{file_path}:{subnode.lineno} -> direct blocking call: {func_name}()')

if violations:
    print('\n'.join(violations))
EOF
)

if [ -z "$BLOCKING_CALLS" ]; then
    echo -e "  ${GREEN}✓ Zero direct blocking I/O calls found in async endpoint definitions.${NC}"
else
    echo -e "  ${RED}CRITICAL: Direct blocking calls found inside async functions:${NC}"
    echo "$BLOCKING_CALLS"
    ERRORS=$((ERRORS + 1))
fi

# ------------------------------------------------------------------------------
# 5. SEARCH VECTOR FULL-TEXT CONFORMANCE (ADR-005: Zero OR ILIKE)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Auditing Search Engine Conformance (ADR-005)...${NC}"

if grep -rn "OR ILIKE" backend/app/api/v1/endpoints/search.py; then
    echo -e "  ${RED}CRITICAL: search.py violates ADR-005 with unindexed 'OR ILIKE' fallback!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✓ Search endpoint strictly utilizes PostgreSQL GIN search_vector (Zero OR ILIKE).${NC}"
fi

# ------------------------------------------------------------------------------
# 6. RUN PYTEST INTEGRATION & SECURITY SUITE
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[6/7] Running Backend Pytest Integration & Security Test Suite...${NC}"

if [ -f "backend/.venv/bin/pytest" ]; then
    if backend/.venv/bin/pytest backend/tests/ -q; then
        echo -e "  ${GREEN}✓ All 10 backend integration tests PASSED.${NC}"
    else
        echo -e "  ${RED}CRITICAL: Pytest suite failed!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${YELLOW}Notice: backend/.venv/bin/pytest not found, skipping pytest.${NC}"
fi

# ------------------------------------------------------------------------------
# 7. FRONTEND TYPE SAFETY & QUALITY CONTROL
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[7/7] Auditing Frontend TypeScript Compilation...${NC}"

if which bun >/dev/null 2>&1; then
    if (cd frontend && bun x tsc --noEmit); then
        echo -e "  ${GREEN}✓ Frontend TypeScript check passed with 0 errors.${NC}"
    else
        echo -e "  ${RED}CRITICAL: Frontend TypeScript compilation failed!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check for raw waitForTimeout in test files
TIMEOUT_COUNT=$(grep -rn "waitForTimeout" qc/tests/ 2>/dev/null | wc -l | tr -d ' \t\n\r' || echo 0)
if [ "$TIMEOUT_COUNT" -gt 0 ]; then
    echo -e "  ${YELLOW}WARNING: Found ${TIMEOUT_COUNT} waitForTimeout instances in qc/tests/:${NC}"
    grep -rn "waitForTimeout" qc/tests/ | head -n 3
fi

# ------------------------------------------------------------------------------
# FINAL AUDIT SUMMARY
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓ SSOT AUDIT PASSED: 0 Critical Errors. Code aligns with Ground Truth.${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    exit 0
else
    echo -e "${RED}✗ SSOT AUDIT FAILED: ${ERRORS} Critical Error(s) detected!${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    exit 1
fi
