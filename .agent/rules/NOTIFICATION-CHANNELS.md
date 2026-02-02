# Notification Channels

## 1. Overview
The Notification System is a **Multi-Channel Dispatcher**. It decouples the "Trigger" (e.g., Action Completed) from the "Delivery" (Email, Push, In-App). This allows users to configure *how* they receive updates without changing business logic.

## 2. Key Directories & Files
- **Service Core:** `frameworks/next/lib/app-core-modules/notifications/` (Manager & Dispatcher).
- **Channel Adapters:** `frameworks/next/lib/app-infrastructure/notificators/` (EmailNotificator, PushNotificator).
- **API Endpoint:** `frameworks/next/app/api/workspaces/dashboard/notifications/` (For In-App fetching).
- **Templates:** `frameworks/next/lib/app-core-modules/content/email-templates/` (React Email or HTML strings).

## 3. Architecture & Patterns

### The Dispatcher Flow
1.  **Event:** A Business Service calls `NotificationService.send({ type: 'ACTION_COMPLETED', ... })`.
2.  ** Preference Check:** Service checks User Settings (DB) to see enabled channels for this event type.
3.  **Dispatch:**
    - If `EMAIL_ENABLED`: Calls `EmailNotificator.send(...)`.
    - If `PUSH_ENABLED`: Calls `PushNotificator.send(...)`.
    - Always: Creates `NotificationLog` (In-App).

### In-App State
- Notifications have `isRead` and `isSeen` states.
- The Topbar "Bell" widget polls the API for `count(isRead: false)`.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** route notifications through `NotificationService`. Never call `sendgrid` or `expo-push` directly from a business service.
- **ALWAYS** create a fallback. If Push fails, logging should capture it, but the operation shouldn't crash the request.
- **NEVER** spam. Implement "Debounce" or "Daily Digest" logic for high-frequency events (e.g., "5 new messages" instead of 5 notifications).
- **DO** use the `NotificationType` enum to categorize alerts (Info, Success, Warning, Error).
- **DO** ensure templates are localized based on the *Recipient's* language preference, not the *Sender's*.
