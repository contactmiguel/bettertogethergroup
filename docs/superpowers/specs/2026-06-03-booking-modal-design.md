# Booking Modal — Design Spec
**Date:** 2026-06-03
**Status:** Approved — ready for implementation

---

## Overview

Replace all "Book an Intro Session" CTAs on the Better Together Group site with a qualification-first booking modal. The modal keeps users on-site, collects ATTUNE-relevant intake context, then routes them directly into a Calendly embed based on their Q6 answer. No manual review by Claudia — auto-book flow.

---

## Files

### New
| File | Purpose |
|------|---------|
| `booking-modal.js` | Full modal system: HTML template, 3-step flow logic, form submission, Calendly embed injection |
| `api/intake.js` | Vercel serverless function — receives intake POST, sends email notification to Claudia, stubs CRM |

### Modified (one line each)
| File | Change |
|------|--------|
| `index.html` | Add `<script src="/booking-modal.js">` before `</body>`; swap CTA `href`/`onclick` to `data-booking-trigger` |
| `advisory.html` | Same |
| `about.html` | Same |
| `insights.html` | Same |

---

## Trigger

Any element with the `data-booking-trigger` attribute fires `openBookingModal()` when clicked. Replaces all existing CTA `href="advisory.html"` and scroll `onclick` handlers site-wide.

---

## Modal — Step 1: Intake Form

**Headline:** `"Quick intake."` (Source Serif 4, H2)

**Intro copy (verbatim):**
> "Effective executive advisory requires mutual fit. Tell us about you and the context of your inquiry."

**Fields in order:**

| # | Label | Type | Required |
|---|-------|------|---------|
| Q1 | Current role | Short text | Yes |
| Q2 | Organization | Short text | No |
| Q3 | What's not working — and what do you suspect is really behind it? | Textarea | Yes |
| Q4 | Where do you feel the most friction right now? (select all that apply) | Checkbox group (6 options) | No |
| Q5 | What have you already tried, and why hasn't it been enough? | Textarea | No |
| Q6 | Is this primarily a personal leadership challenge, or does it involve your team's dynamics? | Radio group (3 options) | Yes |

**Q4 checkbox options (exact copy):**
- Reacting before I see the full picture clearly
- My communication is creating the wrong climate
- Trust has eroded — with me, my team, or both
- I'm missing what's really going on beneath the surface
- There are things that need to be said that aren't being said
- I'm leading from pressure, not from clarity

**Q6 radio options (exact copy):**
- Personal — this is mine to navigate
- It involves my team
- Both

**Submit button:** `"Continue →"` (executive-gold style, matches site)

**Validation:** Q1 (role) + Q3 + Q6 are required. Submit button is disabled until all three have values. No inline error messages — button simply stays inert.

**On submit:**
1. POST intake payload to `/api/intake` — fire-and-forget (does not block transition)
2. Immediately advance modal to Step 2

---

## Modal — Step 2: Confirmation + Calendly Embed

**Fixed response (verbatim — no AI, no personalization):**
> "Thanks for providing clarity. We look forward to a productive session. Let's find a time."

**Calendly embed:** Inline widget injected below the fixed response using `Calendly.initInlineWidget()`. Calendly JS loaded dynamically only at this point.

**Routing by Q6:**

| Q6 answer | Calendly URL | Team door shown? |
|-----------|-------------|-----------------|
| "Personal — this is mine to navigate" | `https://calendly.com/claudiabeck/30-min-check-in` | No |
| "It involves my team" | `https://calendly.com/claudiabeck/30-min-check-in` | Yes |
| "Both" | `https://calendly.com/claudiabeck/30-min-check-in` | Yes |

**Team door line (shown only for "It involves my team" / "Both"):**
> "Also thinking about your team? Explore the A.T.T.U.N.E.™ team assessment →"

Links to: `https://attuneleadership.vercel.app?utm_source=btg-site&utm_medium=booking-modal&utm_campaign=team-door`
Opens in new tab.

**Modal stays open** — no redirect, no close on booking completion.

---

## `api/intake.js` — Serverless Function

**Route:** `POST /api/intake`

**Payload (JSON):**
```json
{
  "role": "...",
  "organization": "...",
  "whatIsNotWorking": "...",
  "frictionDimensions": ["...", "..."],
  "whatHaveYouTried": "...",
  "intent": "personal | team | both",
  "source": "solo site — Calendly intake",
  "timestamp": "ISO-8601"
}
```

**Behavior:**
1. Validate presence of `role`, `whatIsNotWorking`, `intent`
2. Send plain-text email to `claudia.beck@bettertogethergroup.co` with all intake fields
3. Log payload to console (Vercel function logs)
4. Return `{ ok: true }` — frontend ignores errors gracefully

**Email transport:** `[[STUB: choose Resend or Nodemailer/SMTP when CRM decision is made]]`

**CRM integration:** Deferred. Slot is present in the handler as a clearly-marked stub comment.

**Tagging:** All records tagged `source: "solo site — Calendly intake"`.

---

## Decisions Resolved

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Calendly Individual Advisory URL | `https://calendly.com/claudiabeck/30-min-check-in` |
| 2 | CRM integration | Deferred — stub in `api/intake.js`, revisit when platform chosen |
| 3 | Notification email | `claudia.beck@bettertogethergroup.co` |
| 4 | Team door destination | `https://attuneleadership.vercel.app` (with UTM) |

---

## Consistency Checklist

- [x] Modal triggered by CTA — no standalone Calendly redirect
- [x] Form intro copy used verbatim
- [x] Fixed response displayed verbatim before Calendly embed
- [x] Q6 correctly routes individual vs. team event type
- [x] Team door appears only for team/both Q6 answers
- [ ] Post-booking redirect to branded page — configure in Claudia's Calendly settings (outside codebase)
- [x] All intake data captured in `api/intake.js` regardless of booking outcome (fire-and-forget before Calendly loads)
- [x] No personal data passed via URL parameters
- [x] Outbound attune links tagged with UTM (`utm_source=btg-site&utm_medium=booking-modal&utm_campaign=team-door`)

---

## Visual Style

Inherits site design system:
- Background: `surface-container` (`#1d2021`) for modal panel, dark overlay backdrop
- Headline: Source Serif 4, `platinum-gray`
- Body / labels: Open Sans, `on-surface-variant`
- Submit button: `bg-executive-gold text-deep-navy` — matches all other primary CTAs
- Close button: `×` top-right, `text-platinum-gray/60`
- Modal width: `max-w-2xl`, full-screen on mobile
- Step transition: fade/slide, no jarring cut
