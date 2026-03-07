# Notifications

The dedicated `/notifications` page is the delivery inbox for runtime alerts.

## What it supports

- listing notifications across all channels
- filtering by channel and status
- creating notifications manually for local validation
- marking notifications as `delivered` or `failed`
- settings-aware delivery decisions via the notification worker

## Backend contracts

- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/:id/status`

This page is separate from the Operations page, which still focuses on paused sessions and the broader event stream.

## Worker behavior

The `notifications` worker now reads persisted settings such as:

- `dashboard_enabled`
- `email_enabled`
- `telegram_enabled`
- `whatsapp_enabled`

If a channel is disabled, the worker marks the notification as `failed` and records a `notification.delivery_blocked` event.

If a channel is enabled but the transport is not configured, the worker marks the notification as `failed` and records a `notification.delivery_blocked` event with `reason: transport_unconfigured`.

If delivery throws during transport execution, the worker marks the notification as `failed` and records a `notification.delivery_failed` event.

Current transport behavior:

- `dashboard`: local simulated delivery
- `telegram`: real Telegram Bot API delivery when `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are present
- `email`: webhook-based delivery when `EMAIL_WEBHOOK_URL` is present
- `whatsapp`: webhook-based delivery when `WHATSAPP_WEBHOOK_URL` is present
