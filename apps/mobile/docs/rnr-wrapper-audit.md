# RNR Wrapper Audit

Date: 2026-06-10

This audit tracks the current Nativewind / React Native Reusables primitive boundary. The goal is to keep RNR usage high while preventing registry defaults from overriding Tolaria's desktop-derived visual hierarchy.

## Findings

| Primitive | Status | Notes |
| --- | --- | --- |
| `components/ui/text.tsx` | Fixed | Default `text-foreground text-base` now applies only when callers do not provide an explicit `style`. This prevents RNR defaults from overriding Tolaria StyleSheet typography in dense UI surfaces. |
| `components/ui/button.tsx` | OK | Button owns structure, focus/press states, and text context. Tolaria wrappers (`MobileButton`, `MobileIconButton`) own product sizing, variant mapping, and visible label classes. |
| `components/ui/badge.tsx` | OK | Badge owns the pill primitive. `MobileChip` supplies Tolaria tone classes and smaller desktop-aligned typography. |
| `components/ui/input.tsx` | OK | Input owns the RNR-style text entry primitive. `MobileTextInput` supplies Tolaria label, border, and density values for command/property sheets. |
| `ui/MobilePanel.tsx` | OK | Panel/toolbar chrome intentionally uses StyleSheet tokens rather than generic RNR classes because these surfaces must match desktop shell borders and spacing. |
| `ui/MobileListRow.tsx` | OK | The note-list row is a Tolaria product component, not a generic primitive. It uses desktop note-row hierarchy directly. |
| `ui/MobilePropertyRow.tsx` | OK | Property rows are product-specific and intentionally dense; labels/values follow desktop `propertyPanelLayout`. |
| `components/workspace/MobileWorkspaceActionSheet.tsx` | OK | Action sheets compose Tolaria wrappers for search/create/property/relationship/more flows. They target the mobile editable snapshot reducer and intentionally keep disk persistence outside the visual components. |

## Rules

- RNR primitives should stay local under `apps/mobile/src/components/ui`.
- Product surfaces should import Tolaria wrappers from `apps/mobile/src/ui` or workspace components from `apps/mobile/src/components/workspace`.
- If a caller passes an explicit RN `style` for typography, primitive default text classes must not fight it.
- Visual token decisions should be made in Tolaria wrappers/components, not by scattering one-off Nativewind classes through screens.
