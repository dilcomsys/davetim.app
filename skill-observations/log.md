# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

---

## 2026-08-03 — Comprehensive codebase inspection

### Observation 1: Preserve read-only task boundaries
**Status:** OPEN

**Date:** 2026-08-03
**Session context:** A comprehensive repository audit in which application files were explicitly left unchanged.
**Skill:** task-observer
**Type:** open-source
**Phase/Area:** Session Start Protocol / persistent log setup

**Issue:** The mandatory first-use setup writes observation metadata into the workspace even during a read-only inspection. That changes the repository's working-tree state and can conflict with the task's mutation boundary.

**Suggested improvement:** Add a read-only mode to the Session Start Protocol. When the active task does not authorize writes, keep observations session-local or use an environment-owned out-of-tree location, and create workspace metadata only after explicit user authorization.

**Principle:** Observability must not violate the mutation boundary of the task it observes; read-only diagnostics should remain read-only unless the user authorizes persistent metadata writes.

---

## 2026-08-03 — Mobile transition and rewarded-ad planning

### Observation 2: Treat rewarded feature gates as platform-policy decisions
**Status:** OPEN

**Date:** 2026-08-03
**Session context:** Planning an ad-funded premium model for a React Native application targeting both iOS and Android.
**Skill:** mobile monetization / store-readiness (candidate)
**Type:** personal
**Phase/Area:** Product architecture and release planning

**Issue:** A technically valid rewarded-ad flow can still have materially different store-review risk across platforms. Google explicitly defines disclosure and opt-in requirements, while Apple’s feature-unlock and advertising language creates additional review risk for nonessential feature gates. A single cross-platform implementation plan can therefore become a release blocker.

**Suggested improvement:** Any mobile monetization skill should require current primary-source checks for each target store, classify the reward as core/additive/consumable, and produce a platform matrix with remote kill switches and a no-ad fallback before SDK integration begins.

**Principle:** Mobile monetization architecture must be policy-aware and independently disableable per platform; technical parity is not the same as review parity.

---

## 2026-08-03 — MCP onboarding during an active session

### Observation 3: Plan for MCP capability reloads
**Status:** OPEN

**Date:** 2026-08-03
**Session context:** Adding and authorizing the Supabase hosted MCP server after a long-running repository migration had already started.
**Skill:** MCP onboarding / project bootstrap (candidate)
**Type:** personal
**Phase/Area:** Tool setup and continuity

**Issue:** The CLI could register and authenticate the MCP server successfully, but the active agent session did not hot-load its tools or resources. Backend work then required a user-visible session refresh even though authentication had completed.

**Suggested improvement:** MCP setup guidance should distinguish registration, OAuth success, and active-session capability availability; it should schedule any required refresh before implementation reaches an MCP-dependent step and preserve a concise continuation checkpoint.

**Principle:** A configured integration is not usable until the active runtime exposes its capabilities; onboarding verification must test both states.

---

## 2026-08-03 — Expo native permission audit

### Observation 4: Diff effective native permissions after config plugins
**Status:** OPEN

**Date:** 2026-08-03
**Session context:** Adding image selection and rewarded ads to an Expo SDK 57 application.
**Skill:** Expo release-readiness / mobile security (candidate)
**Type:** personal
**Phase/Area:** Native configuration and privacy

**Issue:** Adding the image-picker config plugin introduced Android microphone permission even though the product only selected existing gallery media. Package installation and TypeScript checks did not surface the excess permission.

**Suggested improvement:** Expo release workflows should capture `expo config --type public` before and after each native config plugin, compare effective permissions, and require an explicit product justification for every added permission.

**Principle:** Review generated native configuration, not only source intent; config plugins can broaden the privacy surface silently.

---

## 2026-08-03 — Product-specific landing page redesign

### Observation 5: Distinguish an event product from an event website
**Status:** OPEN

**Date:** 2026-08-03
**Session context:** Generating a design system for a mobile product that helps people create invitations and manage event attendance.
**Skill:** ui-ux-pro-max
**Type:** open-source
**Phase/Area:** Design-system recommendation / product classification

**Issue:** The design-system search interpreted an invitation-management product as an event or conference website. It consequently recommended speaker grids, agendas, early-bird pricing, and a generic romantic palette that did not match the software's actual job or established identity.

**Suggested improvement:** In the required design-system workflow, add a product-role disambiguation step before recommendation: identify whether the interface is the event itself, a marketplace for events, or a tool used to organize events. Weight the product's workflow, audience, and existing brand tokens above industry keyword matches when selecting landing structure and palette.

**Principle:** Design systems should classify what the product does before matching the world it serves; adjacent industry vocabulary can otherwise produce polished but structurally irrelevant recommendations.
