# Security Specification for EduGestão MINEDH (Firebase / Firestore)

## 1. Data Invariants
- `users`: Every user document must match `request.auth.uid` or be accessible by authenticated users with role validation.
- `schools`, `students`, `evaluations`, `classTasks`, `petitions`: Must require authentication for reads and writes.
- `evaluations` & `classTasks`: Must enforce valid titles, dates, and mandatory fields to prevent malicious payload injections.
- User identity: User roles cannot be modified directly by non-privileged client requests.

## 2. Dirty Dozen Security Test Payloads
1. Spoofed Owner Payload (`ownerId: "attacker_id"`)
2. Malicious Unbounded String Injection (>10,000 chars)
3. Shadow Field Injection (`isSuperAdmin: true`)
4. Null Pointer Exception Attack (`request.resource` in read block)
5. Denial of Wallet Array Attack (>5,000 items)
6. Non-Verified Email Admin Privilege Escalation
7. Unauthenticated Collection Scraping
8. ID Poisoning (Injection of forbidden characters in ID paths)
9. Status Terminal State Lock Overwrite
10. System Field Mutation (`aiVerified: true` from client)
11. Client-Side Timestamp Spoofing (not matching server time when required)
12. Relational Orphan Write (Writing child without existing parent)

## 3. Test Runner
Security rules enforced and validated via `firestore.rules`.
