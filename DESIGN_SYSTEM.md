# Mymensingh Sheba design system

## Brand tokens

### Color palette
- Primary green: `#16A34A` with a full scale from 50 to 950.
- Accent amber: `#F59E0B` for priority and promotional highlights.
- Neutrals: off-white `#F8FAFC`, slate text scale, and cool borders.
- Semantic colors: success `#15803D`, warning `#B45309`, danger `#B42335`, info `#2364A0`.

### Radius and shadows
- Inputs and buttons: 12px radius.
- Cards and sheets: 16-20px radius.
- Soft layered shadows for elevated surfaces.
- Base spacing uses a 4px scale.

### Motion and z-index
- Transitions: 150-250ms, `ease-out`.
- z-index scale: app bar 40, navigation 50, overlay 60, toast 100.

## Typography
- Main font: Hind Siliguri for Bangla and Latin text.
- Body text: 15-16px base size with 1.6 line-height.
- Inputs: minimum 16px font size for comfortable touch targets.
- Headings use a readable scale from h1 to h4 with generous spacing.

## Layout rules
- Design for 360px mobile first.
- Respect safe areas using `env(safe-area-inset-*)`.
- Avoid hardcoded colors or spacing values; use design tokens and shared components.
- Keep touch targets at a minimum of 44px.

## Components

### Button
Use `Button` for primary, secondary, ghost, success, and danger actions. Keep labels short and action-focused. Use `fullWidth` for mobile forms.

### Input and Textarea
Use field-level validation and provide comfortable tap sizes. Minimum text size remains 16px to avoid browser zoom.

### Card and ServiceCard
Use `Card` for containers and `ServiceCard` for local services, listings, and provider summaries.

### Tabs and SearchBar
Use `Tabs` for small grouped content and `SearchBar` for large search flows.

### Modal and BottomSheet
Use modal windows for focused task flows and bottom sheets for mobile actions. Respect escape-to-close and backdrop click behaviors.

### Toast
Use toasts for lightweight confirmations and errors. Keep them short and action-oriented.

### Skeleton and EmptyState
Use skeletons to signal loading and `EmptyState`/`ErrorState` for empty or failed states.

## Design rules
- Always use tokens instead of raw color or px declarations.
- Keep contrast readable in both light and dark themes.
- Ensure no horizontal overflow on mobile views.
- Preserve the app shell and avoid obscuring content behind the sticky bottom nav.
