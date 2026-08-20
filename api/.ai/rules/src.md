---
paths:
  - 'frontend/src/**/*.{tsx,ts,css}'
---

# Src

## Design system tokens and conventions
Use the custom design tokens from index.css for all styling:
- Primary: indigo (primary-50 through primary-900) for actions, active states, accents
- Neutral: slate (slate-25 through slate-950) for all text, borders, backgrounds
- Status: emerald (success), amber (warning), rose (danger)
- All UI components use these tokens exclusively - never use raw Tailwind gray/blue/green
- Shadows use layered soft shadows (shadow-xs through shadow-xl), not hard offsets
- Typography: Inter font, tight scale ratio, uppercase tracking-wider for section labels
- Candidate portal uses subtle gradients (from-slate-50 via-white to-primary-50/30)
- Admin uses flat slate-50 background
- Component variants: Button (primary/secondary/danger/ghost), Badge (success/warning/danger/info/gray)
