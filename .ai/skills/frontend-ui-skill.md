# Frontend UI Skill

## General UI Rules

- Preserve the existing Next.js App Router structure.
- Preserve existing route behavior.
- Use existing components where practical.
- Keep UI consistent with the current Tailwind design direction.
- Prefer simple, maintainable layouts over complex animations.
- Do not introduce a new design system without approval.
- Do not introduce new dependencies without approval.

## Project UI Consistency Rules

Before changing UI, inspect nearby and related frontend components to understand the existing product style.

Preserve consistency with:
- layout structure
- spacing scale
- Tailwind utility style
- card and border radius patterns
- button variants
- typography hierarchy
- color usage
- empty/loading/error states
- responsive behavior

Do not introduce a new visual language unless explicitly approved.

For dashboard changes:
- reuse existing layout components where possible
- reuse existing UI primitives where possible
- keep navigation and auth flow unchanged
- keep the page visually aligned with auth, jobs, profile, and homepage sections

## UX Rules

UI changes should improve:
- clarity
- hierarchy
- spacing
- responsiveness
- accessibility
- user guidance

For dashboards, prioritize:
- clear next actions
- useful summary cards
- simple navigation
- product value explanation
- low visual clutter

## Accessibility Rules

- Use semantic HTML where practical.
- Buttons and links should have clear labels.
- Interactive elements should be keyboard accessible.
- Do not rely only on color to communicate meaning.
- Icons should have accessible labels or be marked decorative.

## Styling Rules

- Use Tailwind CSS.
- Avoid excessive custom CSS.
- Keep class names readable.
- Do not test Tailwind classes directly.
- Avoid visual changes outside the assigned scope.

## Data/State Rules

If the UI uses API data:
- include loading state
- include empty state
- include error state if the current architecture supports it
- do not change API contracts

## Testing Rules

Frontend tests should focus on:
- rendered user-visible content
- navigation links/buttons
- conditional UI states
- accessibility labels
- empty/loading/error behavior

Avoid:
- snapshots
- CSS class assertions
- implementation-detail tests
