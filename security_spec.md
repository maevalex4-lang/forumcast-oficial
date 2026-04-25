# Security Specification for LuminaChat

## Data Invariants
1. A message cannot exist without a valid chat ID.
2. A user can only read/write chats where their UID is in the `members` map.
3. Users can only modify their own user profile (except for status which might be updated by presence triggers).
4. Messages cannot be edited once sent (except for deletion/self-destruct).
5. All sensitive message content MUST be encrypted client-side.

## The Dirty Dozen Payloads (Target: PERMISSION_DENIED)

1. **Identity Spoofing**: Attempt to create a message with a `senderId` that doesn't match `auth.uid`.
   ```json
   { "senderId": "someone_else_id", "content": "hi", "chatId": "chat123", "type": "text" }
   ```
2. **Unauthorized Read**: Attempt to read `/chats/private_chat_abc` where the user is NOT a member.
3. **Cross-Chat Injection**: Attempt to write a message to `/chats/chatA/messages/msg1` but with `chatId: "chatB"`.
4. **Member Escalation**: Attempt to update `/chats/chat123` to add self as "admin" when currently a "member".
5. **PII Scraping**: Attempt to list all users in `/users` collection without filtering by specific UID or involvement.
6. **Self-Verified 2FA**: Attempt to update profile to set `twoFactorEnabled: true` without server-side verification (though here we handle it in rules as immutable or restricted).
7. **Shadow Field Injection**: Attempt to update user profile with `isAdmin: true`.
8. **Orphaned Contact**: Attempt to add a contact for a non-existent user.
9. **Message Mutation**: Attempt to update the `content` of an existing message.
10. **Global Search Scraping**: Attempt to query all messages across all chats.
11. **ID Poisoning**: Attempt to create a chat with a 1MB string as the ID.
12. **Timestamp Fraud**: Attempt to set `createdAt` to a future date instead of `request.time`.

## Test Runner (Mock)
- `tests/firestore.rules.test.ts` will verify these cases.
