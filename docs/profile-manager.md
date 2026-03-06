# Profile Manager

`Profile Manager` is the first production slice for the job hunter system.

## Why this feature first

Every later automation flow depends on profile data:

- ATS autofill needs canonical field values
- the self-learning field engine needs a place to store new mappings
- referral generation needs user identity and resume links

## Data model

The system stores profile data in a dynamic key-value table:

| Column | Purpose |
| --- | --- |
| `key` | Canonical identifier such as `name` or `notice_period` |
| `label` | UI display label |
| `value` | Stored user value |
| `value_type` | Future-safe type metadata |
| `source` | `manual`, `learned`, or `imported` |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

## API contract

### `GET /api/profile-fields`

Returns all fields sorted by label and key.

### `PUT /api/profile-fields/:key`

Upserts a field.

Request body:

```json
{
  "label": "Current Salary",
  "value": "18 LPA",
  "source": "manual"
}
```

### `DELETE /api/profile-fields/:key`

Deletes a stored field.

## UI behavior

The `/profile` page allows the user to:

- create new fields
- edit existing values
- delete fields
- review the source of each value

The frontend calls the backend through Next.js route handlers so browser clients do not need direct backend URLs.

