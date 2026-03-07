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

If a channel is enabled, the worker marks the notification as `delivered` and records a `notification.delivered` event.
