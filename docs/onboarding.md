# Onboarding

The onboarding flow is now the primary AutoApply setup surface and follows the locked product direction more closely than the earlier V1 scaffold.

## What the current implementation covers

- stepper-based onboarding flow
- welcome screen and activation framing
- resume upload
- canonical candidate identity fields
- richer profile capture via persisted `profile_fields`
- job preference capture
- platform connection inside onboarding
- Chrome extension detection from the onboarding surface
- extension-driven platform session capture routed to backend persistence
- activation gate requiring at least one connected platform
- LinkedIn consent gate before connection
- review-and-activate final step

## Current step flow

The `/onboarding` page now behaves as a 6-step flow:

1. Welcome
2. Resume and identity
3. Profile details
4. Job preferences
5. Connect platforms
6. Review and activate

The user is no longer redirected out of onboarding just to connect platforms. Platform connection is now part of the same setup journey.

## Endpoints used by onboarding

- `GET /api/me`
- `PUT /api/me`
- `GET /api/me/preferences`
- `PUT /api/me/preferences`
- `GET /api/profile-fields`
- `PUT /api/profile-fields/:key`
- `GET /api/me/connected-accounts`
- `POST /api/me/connected-accounts`
- `GET /api/platform-sessions`
- `POST /api/platform-sessions/capture`
- `POST /api/me/resume`

## Extension-driven platform connect

The current v5-aligned connection path is:

1. load the unpacked Chrome extension from [extension/autoapply-session-bridge](/home/akash/AutoApply/extension/autoapply-session-bridge)
2. log into the target platform in the same Chrome profile
3. open AutoApply onboarding on `http://localhost:3000`
4. use `Connect` on LinkedIn, Naukri, Instahyre, or Hirist
5. extension captures cookies and page storage
6. frontend posts the captured payload to backend
7. backend encrypts and stores the session, then marks the platform connected

## Activation rule

AutoApply activation is blocked until at least one job platform is connected:

- LinkedIn
- Naukri
- Instahyre
- Hirist

The UI shows a blocking message if the user reaches activation without any connected platform.

## Notes on current build state

The current slice implements the onboarding and platform-connection product shell.

Still pending for full final-spec alignment:

- real session validation and health checks
- full structured profile schema in first-class tables
- backend policy engine behavior tied to the new onboarding data
