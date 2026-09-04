---
name: VEILLE Command
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#bdc2ff'
  on-secondary: '#1b247f'
  secondary-container: '#343d96'
  on-secondary-container: '#a8afff'
  tertiary: '#f1e9ff'
  on-tertiary: '#370096'
  tertiary-container: '#d6c9ff'
  on-tertiary-container: '#622be5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#343d96'
  tertiary-fixed: '#e8deff'
  tertiary-fixed-dim: '#cdbdff'
  on-tertiary-fixed: '#20005f'
  on-tertiary-fixed-variant: '#4f00d0'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
  surface-elevated: '#161B22'
  surface-card: '#0D1117'
  status-critical: '#FF3D00'
  status-warning: '#FFB300'
  status-success: '#00E676'
  data-node-person: '#00E5FF'
  data-node-event: '#FF4081'
  stroke-subtle: rgba(255, 255, 255, 0.08)
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  sidebar-width: 280px
  inspector-width: 400px
---

## Brand & Style

The design system embodies a **Clinical Intelligence** aesthetic—a high-stakes, authoritative environment where precision is the primary objective. It moves away from decorative "cyber" tropes toward a functional "Exoskeleton for the Mind," prioritizing data density, defensibility, and investigative clarity.

The visual direction utilizes a **Modern Corporate** foundation blended with **Technical Minimalism**. The interface should evoke the feeling of a mission control center: calm, organized, and powerful. Key design principles include:
- **High Information Density:** Content is packed tightly but structured through a strict hierarchy to minimize eye fatigue during long investigative sessions.
- **Defensibility:** Every visual indicator (confidence scores, relationship lines) must look anchored to evidence, using sharp lines and clinical data points.
- **Subtle Glassmorphism:** Used sparingly for tactical overlays and side-panels to maintain spatial context of the underlying network graph.

## Colors

The palette is optimized for **Dark Mode** to reduce eye strain in low-light operations centers.

- **Primary (Electric Cyan):** Reserved for active intelligence, data highlights, and the "Blast Radius" selection. It represents high-confidence data and primary actions.
- **Secondary (Deep Navy):** Used for structural navigation and grounding the interface.
- **Neutral (Charcoal/Black):** The canvas of the system, using `neutral_color_hex` for the base background and slightly lighter tiers for container elevation.
- **Status Colors:** Explicitly tied to the confidence model. Red and Amber indicate low-confidence/failed extraction requiring human review; Green indicates system-verified provenance.

## Typography

Typography balances narrative readability with technical precision. 
- **Inter** is the workhorse font, used for all interface controls and narrative evidence descriptions.
- **JetBrains Mono** is utilized for "Evidence Provenance"—IDs, timestamps, coordinates, and technical metadata. This creates a clear visual distinction between human-readable text and system-generated data.
- **Mobile scaling:** On mobile/tablet views, `headline-lg` scales to 24px to ensure the data-dense dashboards remain legible without excessive scrolling.

## Layout & Spacing

This design system uses a **Fluid/Fixed Hybrid Grid**. 
- **The Workspace:** A central fluid area for the Network Explorer (Graph) that stretches to fill available space.
- **Control Planes:** Fixed-width sidebars for navigation (Left, 280px) and the Entity Inspector (Right, 400px).
- **Rhythm:** An 8px base grid governs all component spacing, while 4px units are used for tight data-grid layouts.
- **Responsive Behavior:** On tablet, the Entity Inspector becomes a bottom-sheet. On mobile, the system pivots to a "List-First" view, hiding the graph explorer in favor of the Review Queue.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Outlines** rather than heavy shadows.

1.  **Floor (Level 0):** The deep charcoal background (`#0A0C10`).
2.  **Surface (Level 1):** Primary UI containers, cards, and sidebars. Defined by a subtle border (`stroke-subtle`) to separate components without creating bulk.
3.  **Overlay (Level 2):** Glassmorphic panels used for floating map controls or node-specific context menus. These use a 12px backdrop blur and 60% opacity on the surface color.
4.  **Priority (Level 3):** Urgent alerts and failed-process toasts. These use a slight glow effect (12px blur) tinted with the status color (Amber or Red) to draw immediate attention.

## Shapes

The shape language is **Technical and Sharp**. 
- A **Soft (0.25rem)** radius is used for the majority of UI components (buttons, input fields, cards) to maintain a modern feel while appearing serious.
- **Strict Geometry:** Graph nodes use primitive shapes (Circles for Persons, Squares for Events, Diamonds for Locations) to ensure the ontology is recognizable at a glance even at low zoom levels.
- **Edges:** Solid lines for "Observed" facts; dashed lines for "AI-Predicted" associations.

## Components

- **Intelligence Cards:** High-density containers with a `label-caps` header indicating the source (e.g., "FEDERAL DATABASE") and a primary monospaced ID.
- **Buttons:** 
    - *Primary:* Solid Electric Cyan with black text for high-impact actions like "MERGE" or "CONFIRM."
    - *Secondary:* Outlined with 1px `stroke-subtle`, used for "KEEP SEPARATE" or "CANCEL."
- **Status Indicators (Confidence Scores):** Circular rings or progress bars. A score of <0.60 triggers a "Warning" amber state, automatically placing the item into the Entity Review Queue.
- **Activity Logs:** Monospaced list items with timestamped provenance. Each entry includes a "jump-to-source" icon button.
- **Network Nodes:** Icons centered in geometric shapes. Hovering a node triggers a subtle primary-colored outer glow (the "Blast Radius" effect).
- **Review Queue:** A split-view list where "Ambiguity" is the first-class state, allowing side-by-side comparison of two entities for manual resolution.
