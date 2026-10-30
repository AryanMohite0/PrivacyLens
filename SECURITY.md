# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Privacy-Preserving Architecture

PRIVACYLENS is built around strict data minimization invariants:
1. **No Request/Response Payload Interception**: Only HTTP destination domain metadata, resource categories, and high-level timing are captured.
2. **Query Parameter Scrubbing**: Sensitive authentication parameters (`token`, `api_key`, `secret`, `jwt`, `email`, `session`) and high-entropy hash strings are redacted prior to memory storage or API transmission.
3. **Local-First Default**: By default, no network traces leave the browser's local sandbox without user consent.

## Reporting a Vulnerability

If you discover a security or privacy vulnerability in PRIVACYLENS, please send an email to security@privacylens.org rather than filing a public issue. We will respond within 48 hours.
