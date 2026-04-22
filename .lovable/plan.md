

# Streamline Header Navigation

## Problem
Currently 7 nav items + Report Search + Book Appointment button = 9 elements in the desktop nav bar, causing items to wrap to two lines on smaller desktop screens.

## Current nav items
1. Home
2. About Us
3. Services
4. Fitness Criteria
5. Medical Equipment
6. News & Updates
7. Contact
8. Report Search (separate link)
9. Book Appointment (CTA button)

## Solution: Group secondary items under a "Resources" dropdown

**Keep as top-level (5 items):**
- Home
- About Us
- Services
- News & Updates
- Contact

**Group into "Resources" dropdown (3 items):**
- Fitness Criteria
- Medical Equipment
- Screening Process

**Keep separate:**
- Report Search (highlighted link)
- Book Appointment (CTA button)

This reduces the nav bar from 9 elements to 7 (5 links + 1 dropdown + Report Search + CTA), fitting comfortably in one line.

## Technical approach

1. **Update `NavItem` type** in `mockData.ts` — add optional `children` array for dropdown items
2. **Reduce `navItems`** — move Fitness Criteria, Medical Equipment, and Screening Process under a "Resources" parent
3. **Refactor `Header.tsx`** — use the existing `navigation-menu.tsx` (Radix NavigationMenu) for the desktop dropdown. Render top-level items as plain links and "Resources" as a trigger with a dropdown panel
4. **Mobile nav stays flat** — in the Sheet, render all items including children in a flat list (no nested dropdown needed on mobile)
5. **Reduce nav gap** from `gap-[24px]` to `gap-[16px]` for extra breathing room

