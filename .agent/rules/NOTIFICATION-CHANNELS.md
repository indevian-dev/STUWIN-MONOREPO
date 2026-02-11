# Notification Channels

## Key Files
| File | Definition |
|---|---|
| `next/lib/notifications/mail.service.ts` | `MailService` — email sending logic |
| `next/lib/notifications/mail.templates.ts` | HTML email template builders |
| `next/lib/notifications/sms.service.ts` | `SmsService` — SMS sending logic |
| `next/lib/notifications/sms.templates.ts` | SMS text template builders |
| `next/lib/notifications/push.service.ts` | `PushService` — push notification logic |
| `next/lib/notifications/notification.types.ts` | Notification channel types |
| `next/lib/notifications/index.ts` | Barrel export |

## Integration Clients
| File | Definition |
|---|---|
| `next/lib/integrations/notifications/mail.client.ts` | Email provider client (SendGrid) |
| `next/lib/integrations/notifications/sms.client.ts` | SMS provider client |

## Factory Access
| Getter | Service | Purpose |
|---|---|---|
| `module.mail` | `MailService` | Send transactional emails |
| `module.sms` | `SmsService` | Send SMS messages |
| `module.push` | `PushService` | Send push notifications |

## Dispatcher Flow
1. Business service calls `module.mail.send(...)` or `module.sms.send(...)`
2. Service selects template from `*.templates.ts`
3. Template renders with user data + locale
4. Integration client delivers via external provider

## Rules
- **ALWAYS** route notifications through notification services — never call provider clients directly
- **ALWAYS** create a fallback — if delivery fails, log but don't crash the request
- **ALWAYS** localize templates based on the **recipient's** language, not the sender's
- **NEVER** call notification services synchronously in the request path — use fire-and-forget with `.catch()`
