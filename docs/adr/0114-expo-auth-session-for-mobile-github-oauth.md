# ADR-0114: Expo AuthSession for Mobile GitHub OAuth

Date: 2026-05-05

## Status

Accepted

## Context

Tolaria mobile needs a GitHub login path that works without terminal Git credentials. The product choice recorded in the mobile strategy is a GitHub OAuth App first, with GitHub App hardening later if selected-repository installation permissions and short-lived installation tokens become necessary.

GitHub's current OAuth App documentation supports the authorization-code flow and marks PKCE parameters as strongly recommended for securing the flow. This makes a public mobile client viable without shipping a client secret. See [GitHub Docs: Authorizing OAuth apps](https://docs.github.com/apps/building-oauth-apps/authorizing-oauth-apps).

Expo SDK 55 provides `expo-auth-session` for browser-based auth sessions and `expo-web-browser` for completing native browser redirects. Those modules preserve the managed Expo path and keep Android possible later.

## Decision

Use `expo-auth-session` plus `expo-web-browser` for the mobile GitHub OAuth session boundary.

Configure the Expo app with the `tolaria` URL scheme and use the redirect path `oauth/github`. The native session adapter builds an authorization-code request with PKCE, prompts through the system browser flow, exchanges the temporary code for a token, and returns only a narrow session result to the rest of the app.

Successful OAuth completion is connected to the SecureStore-backed credential boundary from ADR-0113. The sync planner still consumes only credential availability; Git token material remains inside the secure credential storage/native Git callback boundary.

## Consequences

- GitHub auth can be added to UI without coupling mobile screens to OAuth request details.
- The OAuth native modules and URL scheme are native-runtime changes, so they require a new development-client/TestFlight/App Store build rather than OTA alone.
- Unit tests cover request shaping, result normalization, and secure-store handoff without opening a browser or contacting GitHub.
- The later Android implementation can reuse the same OAuth boundary while validating Android redirect and browser behavior separately.
- The GitHub OAuth App client ID still needs environment/config injection before the UI can trigger a real login.
