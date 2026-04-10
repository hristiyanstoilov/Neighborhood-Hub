# Neighborhood Hub - QA Regression Pack

Version: 1.0  
Last updated: April 9, 2026  
Status: Active

---

## 1. Goal

Create a repeatable QA process that catches regressions before merge/deploy.

This pack is mandatory for production-polish and post-MVP maintenance work.

---

## 2. Scope

Included:

1. Auth: register, login, logout, protected redirects, rate-limit behavior.
2. Skills: list, filters, detail, create/edit, unverified restrictions.
3. Requests: lifecycle transitions, sent/received tabs, cancellation requirements, notifications.
4. Chat/AI: conversation CRUD, message send, recommendations, failure fallback.
5. Profile: view/edit/avatar flow and visibility behavior.
6. Admin access control: non-admin guard and admin route sanity checks.
7. Mobile parity: loading, error, empty states on key screens.

Excluded:

1. Performance/load benchmarking.
2. Security penetration testing.
3. New feature discovery outside approved scope.

---

## 3. Test Sets

### Smoke Set (10-15 minutes, every PR)

1. Build passes.
2. Auth happy path works.
3. Protected redirects work.
4. One core mutation flow works.
5. One negative-path error is handled correctly.

### Standard Set (25-40 minutes, every release)

Execute all critical flows by test ID (section 4).

### Deep Set (60+ minutes, large refactors)

1. Extended negative paths.
2. Role and permission edge cases.
3. Multi-step user journey continuity checks.

---

## 4. Regression Matrix (Canonical IDs)

### Auth

1. AUTH-01 Register happy path.
2. AUTH-02 Login with valid credentials.
3. AUTH-03 Invalid login error feedback.
4. AUTH-04 Logout + protected redirect.
5. AUTH-05 Rate limit handling (429).

### Skills

1. SKILL-01 Skills list + filters load.
2. SKILL-02 Skill detail load + CTA rules.
3. SKILL-03 Create skill as verified user.
4. SKILL-04 Create skill blocked for unverified user.

### Requests

1. REQ-01 My Requests sent/received tabs.
2. REQ-02 Valid status transition succeeds.
3. REQ-03 Invalid transition blocked with clear error.

### Chat/AI

1. CHAT-01 New conversation + send message.
2. CHAT-02 Delete conversation with confirmation.
3. CHAT-03 AI recommendations load in chat sidebar.

### Profile

1. PROF-01 Profile view/edit happy path.
2. PROF-02 Avatar upload validation and error handling.

### Admin

1. ADMIN-01 Non-admin denied access to admin routes.
2. ADMIN-02 Admin users/audit pages render (when admin credentials are available).

### Mobile

1. MOB-01 Skills tab loading/error/empty behavior.
2. MOB-02 My Requests loading/error/empty behavior.
3. MOB-03 Profile loading/error/empty behavior.

---

## 5. Test Data Requirements

1. One verified user account.
2. One unverified user account.
3. One admin account.
4. At least two skills in different categories/locations.
5. At least one request per key status where possible.
6. At least one existing AI conversation for delete tests.

---

## 6. Execution Protocol

1. Start with build check.
2. Execute by module order: Auth -> Skills -> Requests -> Chat -> Profile -> Admin -> Mobile.
3. Record each test ID as PASS / FAIL / BLOCKED.
4. For every FAIL: include exact reproduction steps and expected vs actual behavior.
5. End with Go/No-Go release decision.

---

## 7. Evidence Template (Required)

For each failed or blocked scenario, capture:

1. Test ID.
2. Environment (local/staging, branch, commit).
3. Preconditions.
4. Steps.
5. Expected.
6. Actual.
7. Status.
8. Owner + follow-up ticket ID.

---

## 8. Severity Policy

1. Critical: auth bypass, data loss, or broken core business flow.
2. High: major user journey blocked.
3. Medium: journey works with workaround.
4. Low: visual/copy issue with no functional impact.

---

## 9. Release Gate

Merge/deploy is allowed only when:

1. No open Critical/High issues.
2. Smoke set is fully PASS.
3. Standard set is executed for release candidates.
4. Build is green.
5. QA sign-off is present in the release note/PR summary.

---

## 10. Cadence

1. Every PR: Smoke set.
2. Every release: Standard set.
3. Major refactor: Deep set.
4. Monthly: review and update stale IDs and test data assumptions.

---

## 11. Suggested QA Sign-Off Text

"Regression pack executed for this change. Smoke set PASS. No open Critical/High issues. Release decision: GO."
