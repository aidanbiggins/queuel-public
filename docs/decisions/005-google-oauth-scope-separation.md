# ADR 005: Google OAuth Scope Separation

## Status
Planned

## Context

Queuel.io uses Google OAuth for two purposes:

1. **Authentication** — Sign in with Google (via NextAuth.js)
2. **Calendar access** — Read/write Google Calendar events for scheduling

Currently, both are handled in a single OAuth flow. This creates a problem: when a new user signs in for the first time, Google shows a consent screen that includes calendar permissions. This triggers Google's "unverified app" warning screen because calendar scopes are classified as "sensitive."

The scary warning ("This app isn't verified") causes user drop-off during signup.

## Decision

Separate the two OAuth flows:

### Flow 1: Sign-in only
- Scope: `openid email profile`
- These are non-sensitive — no scary warning
- Used by NextAuth.js for authentication
- Every user goes through this

### Flow 2: Calendar connection
- Scope: `https://www.googleapis.com/auth/calendar.events`
- This is sensitive — requires Google verification
- Triggered separately after sign-in, from Settings > Integrations
- Only org admins need this
- Store refresh token per organization

### Implementation approach

1. NextAuth Google provider configured with minimal scopes only
2. New "Connect Google Calendar" button in org settings
3. Separate OAuth2 client (or same client, different authorization URL with calendar scope)
4. On callback, store the refresh token in the organization record
5. Calendar operations use the org-level token, not the user's sign-in token

### Google app verification

With scope separation:
- The sign-in flow uses only non-sensitive scopes → no verification needed
- The calendar flow uses sensitive scopes → submit for Google verification
- Verification requires: privacy policy, homepage, OAuth consent screen branding, security assessment

## Consequences

**Good:**
- New users see a clean Google sign-in screen — no scary warnings
- Calendar permissions are opt-in and explicit
- Org admins control calendar access, not individual users
- Easier path to Google verification (clear scope justification)

**Tradeoffs:**
- Two OAuth flows to maintain
- Users who need calendar access must complete an extra step
- Refresh token management per organization adds complexity
- Must handle token expiry and re-authorization gracefully

**Why this matters:** First impressions during signup directly impact conversion. An "unverified app" warning on the first interaction is a conversion killer for a B2B SaaS product.
