# Settings

The dedicated `/settings` page stores persisted runtime configuration for the automation platform.

## Stored settings

Settings live in the `system_settings` table with:

- `key`
- `label`
- `value`
- `value_type`
- `category`

## What the page supports

- listing settings
- upserting settings
- deleting settings
- bootstrapping common automation and notification keys from suggested presets

## Backend contracts

- `GET /api/settings`
- `PUT /api/settings/:key`
- `DELETE /api/settings/:key`

This page is for operator-level runtime controls. It does not replace infrastructure secrets or deployment environment variables.
