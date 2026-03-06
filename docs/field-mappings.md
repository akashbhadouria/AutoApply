# Field Mappings

`Field Mappings` is the persistence layer for the self-learning ATS engine.

## Purpose

ATS forms often use inconsistent labels such as:

- `Current CTC`
- `Expected Salary`
- `Notice Period`

These labels need to map to stable profile keys once and then be reused.

## Data model

Each mapping stores:

- raw label
- normalized label
- canonical profile key
- confidence (`manual`, `learned`, `suggested`)

## Workflow

1. browser automation analyzes a form
2. built-in and learned mappings are checked
3. if a required field still has no usable value, the session pauses
4. the label can then be stored as a new field mapping

This is the persistence layer that makes the automation system progressively smarter over time.

