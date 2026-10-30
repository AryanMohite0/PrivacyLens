# Contributing to PRIVACYLENS

Thank you for your interest in contributing to PRIVACYLENS!

## Development Guidelines

1. **Deterministic Accuracy**:
   - Tracker matches must come from maintained, verified lists (e.g., Disconnect Tracking Protection, EasyPrivacy) or empirical domain verification.
   - Never replace deterministic network observation with an LLM estimate.

2. **Scoring Invariants**:
   - The risk engine uses $R = 0.35T + 0.25C + 0.15P + 0.25D$.
   - Any modifications to weights must be backed by labeled test cases in `datasets/evaluation_cases/`.

3. **Running Verification**:
   ```bash
   # Run TypeScript tests
   npm test

   # Run Python backend tests
   $env:PYTHONPATH="."; apps/api/.venv/Scripts/pytest apps/api/tests/ -v

   # Build extension
   npm --workspace=@privacylens/extension run build

   # Build dashboard
   npm --workspace=@privacylens/dashboard run build
   ```

4. **Pull Requests**:
   - Keep pull requests scoped.
   - Include unit tests for any new classifier rules or policy parsing regexes.
