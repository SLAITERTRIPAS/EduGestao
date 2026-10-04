# Security Specification - Firestore Rules

## Data Invariants
1.  **Users**: A user document must have a valid email and role. Only the user themselves or an admin can update their profile.
2.  **Employees**: An employee must belong to a school.
3.  **Classes**: A class must belong to a school.
4.  **Students**: A student must belong to a school.

## The "Dirty Dozen" Payloads
1.  **Identity Spoofing**: Attempting to create a user profile with a different UID.
2.  **Privilege Escalation**: A teacher attempting to change their role to 'admin'.
3.  **Ghost Fields**: Adding an `isAdmin: true` field to a student document.
4.  **Resource Poisoning**: Injecting a 1MB string into a class name.
5.  **Unauthorized Access**: A student attempting to read another student's full profile (including PII if any).
6.  **Orphaned Records**: Creating a student record for a non-existent school.
7.  **Timestamp Spoofing**: Providing a manual `createdAt` value instead of `request.time`.
8.  **ID Injection**: Using a very long or invalid string as a document ID.
9.  **Cross-Tenant Write**: A user from School A attempting to create a class in School B.
10. **Shadow Update**: Updating whitelisted fields while secretly sneaking in a role change.
11. **Mass Deletion**: Attempting to delete the entire `users` collection.
12. **Recursive List**: Querying `users` without filtering by `schoolId`.

## The Test Runner (Plan)
The tests will verify that:
-   `create` / `update` fail if schema is violated.
-   `create` / `update` fail if identity doesn't match `request.auth.uid` where applicable.
-   `list` fails if not filtered by relevant relational IDs.
