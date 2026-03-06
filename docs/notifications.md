# Notifications

The dedicated `/notifications` page is the delivery inbox for runtime alerts.

## What it supports

- listing notifications across all channels
- filtering by channel and status
- creating notifications manually for local validation
- marking notifications as `delivered` or `failed`

## Backend contracts

- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/:id/status`

This page is separate from the Operations page, which still focuses on paused sessions and the broader event stream.
