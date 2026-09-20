# AGENTS.md

## STRICT RULE: MANDATORY ENFORCEMENT OF RULES.md

You must strictly adhere to and enforce [RULES.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/RULES.md) for **EVERY** prompt, task, code change, and interaction in this repository.

### Core Protocol Before Implementing Any Prompt:
1. **Always Read and Re-verify RULES.md**: Inspect [RULES.md](file:///c:/Users/sv369/OneDrive/Desktop/MUSA%20Project/RULES.md) before planning or executing any prompt.
2. **Mandatory Repository Inspection**: Never assume or guess. Inspect the codebase, existing patterns, utilities, schemas, and configurations first.
3. **Understand Before Implementing**: Follow the workflow:
   `UNDERSTAND -> INSPECT -> IDENTIFY EXISTING PATTERN -> PLAN MINIMAL CHANGE -> IMPLEMENT -> VERIFY -> REVIEW -> REPORT`
4. **Minimal Diff & No Over-Engineering**: Make the smallest reasonable, correct, and maintainable change. Do not add unnecessary abstractions or rewrite working code.
5. **No Hallucination or Fabrication**: Never invent files, functions, API responses, database fields, or test results. Mock data must be explicitly labeled.
6. **Mandatory Verification**: Always verify code (lint, types, syntax, build, tests) where the environment allows. Never claim a test or build passed unless actually executed.
7. **Task Execution Gate & Completion Gate**: Run through the checklist gates defined in Sections 41 & 42 of `RULES.md` before modifying code and before declaring completion.
