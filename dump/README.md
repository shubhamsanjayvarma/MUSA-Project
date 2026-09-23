# Knowledge & Reference Dump Inbox (`dump/`)

> **Purpose:** This folder is a transient intake zone for external files, reference `AGENTS.md` rules, architectural snippets, and engineering playbooks gathered from other projects.
> **Lifecycle:** The agent monitors this folder, reads incoming files, and executes the **Surgical Knowledge Merge Protocol** into the repository's permanent specifications and rules.

---

## The Surgical Knowledge Merge Protocol

Whenever you drop a file (e.g. `dump/external_agents.md`, `dump/snippets.md`, `dump/architecture_guide.md`) into this folder, the agent must follow these strict operational laws before integrating anything:

### 1. Zero Direct Overwrite & Preservation Invariant
- **Existing Rules & Specs Are Sacred:** Never overwrite, delete, or rewrite existing rules in `.agents/AGENTS.md`, `.agents/rules/CONTEXT.md`, or `spec_universal/`.
- **Existing numbering and contracts must remain completely intact.**

### 2. Forensic Deduplication & Overlap Detection
- Before considering any snippet or rule from `dump/`, check whether the concept is already covered in:
  - `spec_universal/` (7 System Design layers, Playbooks, Templates)
  - `.agents/AGENTS.md` (Rules 1 through 37)
  - `.agents/rules/CONTEXT.md` (Operational invariants & DNA)
- **Strict Anti-Repetition:** If a rule or concept already exists (e.g. TDD, pre-commit hooks, zero-trust, git PR workflows), **REJECT** the duplicate. Do not rephrase or create redundant rules.

### 3. Extraction of High-Value Differentials Only
Only extract items that represent a **genuine capability or architectural gap**:
- A novel security attack vector or evasion guard.
- A concrete performance formula or caching policy not yet codified.
- An edge-case debugging insight or parser pitfall.
- A battle-tested workflow pattern that genuinely elevates engineering velocity.

### 4. Deterministic Destination Routing
When a beneficial item is verified as novel:
- **Universal Architecture or Engineering Guideline?** $\to$ Append surgically as an addendum to the designated `spec_universal/` document (or reference matrix).
- **Core Agent Behavioral Constraint or Safety Hook?** $\to$ Incrementally append as a new numbered rule in `.agents/AGENTS.md`.
- **Project DNA, Tooling Caveat, or Mistake Guardrail?** $\to$ Append to `.agents/rules/CONTEXT.md`.

### 5. Automatic Cleanup
- Once a file in `dump/` has been fully analyzed and its beneficial differentials merged, the agent should report what was merged vs. what was rejected (and why), and offer to clear or archive the dump file so the inbox remains clean.
