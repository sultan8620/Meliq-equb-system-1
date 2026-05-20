# Security Specification - Meliq Ekub Management System

## 1. Data Invariants
- **Identity Integrity**: A user document must have a `uid` that strictly matches `request.auth.uid`.
- **Relational Consistency**: Payments, Loans, and Payouts must be linked to an existing User and/or Group.
- **Role Lockdown**: Only the system or a super-admin can grant 'admin' status. Users cannot self-promote.
- **Immutable History**: `createdAt` timestamps cannot be modified after creation.
- **State Flow**: User `status` transitions (Pending -> Active) can only be performed by Admins.

## 2. The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Spoofing**: `{ "uid": "victim_uid", "fullName": "Attacker" }` -> DENY (UID mismatch)
2. **Privilege Escalation**: `{ "role": "admin" }` -> DENY (Only admins can set roles)
3. **State Hijacking**: `{ "status": "active" }` -> DENY (Only admins can approve members)
4. **Data Poisoning**: `{ "fullName": "A".repeat(2000) }` -> DENY (String size limit)
5. **Relational Orphanage**: Creating a payment for a non-existent groupId -> DENY (exists check)
6. **Temporal Fraud**: `{ "createdAt": "2000-01-01T00:00:00Z" }` -> DENY (Must use request.time)
7. **Shadow Updates**: `{ "isVerified": true, "extraField": "ghost" }` -> DENY (AffectedKeys hasOnly)
8. **PII Peeking**: `list /users` as a regular user -> DENY (Users can only read their own profile or specific public fields)
9. **Financial Forgery**: Creating a payment doc with `userId` of another user -> DENY (Identity check)
10. **Notification Spam**: Sending system notifications to all users -> DENY (RecipientId check)
11. **Outcome Manipulation**: Changing a game/draw winner manually -> DENY (Outcome lock)
12. **Status Shortcutting**: Reopening a 'closed' group -> DENY (Admin only or terminal state lock)

## 3. Test Runner Design
The tests will verify that:
- Users can ONLY read and write their own documents.
- Sensitive fields (role, status, points) are blocked from user updates.
- All writes are validated for type and size.
- Admins have full (but audited) access.
