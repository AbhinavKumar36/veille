---
name: Veille Clinical Intelligence
colors:
  surface: '#111418'
  surface-dim: '#111418'
  surface-bright: '#36393e'
  surface-container-lowest: '#0b0e12'
  surface-container-low: '#191c20'
  surface-container: '#1d2024'
  surface-container-high: '#272a2f'
  surface-container-highest: '#32353a'
  on-surface: '#e1e2e8'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#e1e2e8'
  inverse-on-surface: '#2e3135'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffbcbf'
  on-tertiary: '#67001b'
  tertiary-container: '#ff929a'
  on-tertiary-container: '#8c0028'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#111418'
  on-background: '#e1e2e8'
  surface-variant: '#32353a'
typography:
  display-command:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-command-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-dossier:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-panel:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-default:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  body-compact:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  telemetry-data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.02em
  telemetry-data-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
  telemetry-data-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0em
  label-tactical:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
  code-stream:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  gutter-panel: 1px
  margin-console: 1rem
  density-table-row: 1.75rem
---

## Brand & Style

This design system establishes a high-density, mission-critical workspace engineered for clinical epidemiologists, biosecurity analysts, and diagnostic researchers. The interface balances high-stakes intelligence agency operational displays with precision clinical bio-informatics. The atmosphere is quiet, focused, authoritative, and deliberate—stripping away decorative consumer polish in favor of raw informational utility, strict alignment, and immediate visual triage.

Drawing from tactical command consoles and computational data workstations, the aesthetic leverages:
- **Obsidian-Tier Substrates:** Pure dark, non-reflective surfaces that eliminate eye fatigue during protracted operational shifts.
- **Hairline Structural Architecture:** Absolute geometry maintained via precise 1px borders, dividing complex analytical domains without heavy drop shadows.
- **Signal-to-Noise Hierarchy:** High-contrast tactical telemetry beacons against low-contrast structural scaffolding, ensuring anomalies, bio-threat metrics, and verified clinical vectors command instant attention.
- **Tactical Micro-Typography:** Strict uppercase tracking for metadata badges, paired with monospaced data readouts to convey institutional rigour.

## Colors

The palette operates on a strict functional taxonomy. Colors do not serve aesthetic embellishment; every hue represents an operational state, triage classification, or semantic entity type.

### Core Architecture (Neutrals)
- **Base Canvas (`#090C10`):** Deep obsidian void. Used for the global viewport, workspace canvas, and terminal backdrops.
- **Surface Level 1 (`#0F141C`):** Charcoal plate. Applied to primary panels, dossiers, telemetry streams, and analytical workspaces.
- **Surface Level 2 (`#151B26`):** Elevated console plate. Used for modal panels, inspector drawers, hover states, and active card headers.
- **Border Structural (`#212B3A`):** Low-contrast structural hairline separator.
- **Border Active/Hover (`#2E3B4E`):** Focused or selected structural edge.

### Functional Accents
- **Cyan / Ice Blue (`#38BDF8`):** Primary interactive beacon. Identifies tracked genetic entities, clinical identifiers, hyperlinked dossier nodes, and telemetry cursor states.
- **Emerald (`#10B981`):** Verified clearance, healthy telemetry feeds, confirmed negative biospecimens, and stabilized epidemiological curves.
- **Amber / Gold (`#F59E0B`):** Active intercepts, watchlists, anomalous sensor deviations, and unverified data transfers.
- **Crimson / Rose (`#F43F5E`):** Critical biothreat signatures, immediate pathogen alerts, operational system breaches, and emergency isolation flags.

### Monochromatic Text Tiers
- **Text Primary (`#F1F5F9`):** High-readability pure white-slate for core metrics, terminal output, and active values.
- **Text Secondary (`#94A3B8`):** Subdued slate for structural field labels, operational column headers, and timestamp metadata.
- **Text Muted (`#475569`):** Low-visibility carbon for static table lines, inactive controls, and trailing IDs.

## Typography

Typography prioritizes high information density, vertical alignment, and absolute numerical clarity. 

- **Primary Interface Font (Inter):** Deployed across headlines, clinical dossier prose, analytical summaries, and system menus. Renders with neutral precision at micro-scales.
- **Technical Monospace Font (JetBrains Mono):** Mandated for all clinical metrics, coordinates, gene sequence alignments, accession numbers, telemetry timestamps, and tactical status pills.

### Execution Standards
- **Tabular Figures:** `font-variant-numeric: tabular-nums` must be enabled globally for all numeric renderings to prevent jitter in live-updating feeds.
- **Tactical Tracking:** All `label-tactical` tokens must be set to `text-transform: uppercase` with wide letter-spacing (`0.08em`) to guarantee quick peripheral legibility against dark substrates.
- **Vertical Rhythm:** Strict line-height bounds prevent table row bloating and maintain dense multi-column telemetry arrays.

## Layout & Spacing

The layout model simulates a multi-monitor mission-control matrix. Content conforms to an ultra-dense, multi-pane fluid workspace framed by structural borders rather than empty whitespace margins.

### Grid & Composition
- **Structural 1px Seams:** Layout panes abut one another with `1px` gaps (or hairline borders) revealing background separation, maximizing usable display real estate.
- **Pane Hierarchy:** A three-tiered dock system comprising:
  1. Primary Tactical Strip (compact, iconographic + status indicators, width `48px`).
  2. Data Registry & Feed Explorer (collapsible, width `320px` to `400px`).
  3. Main Operational Theater (fluid analytical grid with customizable dashboard modules).
  4. Contextual Inspector / Target Dossier Drawer (fixed `380px` right-rail).

### Breakpoints & Density Modes
- **Desktop Command (`≥ 1440px`):** Quad-pane simultaneous viewport; fixed height panels with independent internal scrolling.
- **Tactical Mobile / Field Ops (`< 768px`):** Collapses into a single-panel priority stack; bottom command bar for switching between alerts, target feeds, and primary telemetry.
- **Data Densities:** Table rows strictly adhere to `density-table-row` (`28px` base height) with horizontal padding of `space-md` (`12px`).

## Elevation & Depth

This design system avoids soft, blurred consumer shadows and decorative ambient lighting. Depth is articulated purely through surface tonal gradation, sharp border luminescence, and selective inset occlusion.

### The Planar Hierarchy
- **Base Level (`#090C10`):** System floor. Houses recessed grids and global frame borders.
- **Surface Level (`#0F141C`):** Standard analytical plane. Houses grid tables, charts, and record collections.
- **Active / Elevated Level (`#151B26`):** Raised inspector cards, floating command bars, and active dialog overlays.

### Edge Definition & Light Physics
- **Hairline Bounding:** Every card, cell, and pane is circumscribed by a 1px solid border (`#212B3A`).
- **Focus Luminescence:** When focused or armed, an element replaces its passive border with a hairline tactical accent border (`#38BDF8` or `#F43F5E`) accompanied by an ultra-tight, sharp glow: `box-shadow: 0 0 0 1px #38BDF8, 0 0 8px -2px rgba(56, 189, 248, 0.4)`.
- **Modals & Overlays:** Elevated modals use an opaque backdrop filter (`backdrop-filter: blur(4px)`) layered over a `rgba(9, 12, 16, 0.85)` shield, framed by `#2E3B4E`.

## Shapes

The interface embraces a strict, architectural zero-radius philosophy (`roundedness: 0`). Curved edges are eliminated to maximize screen real estate, reinforce terminal instrumentation, and facilitate seamless border sharing between dense adjacent components.

### Form Characteristics
- **Right-Angle Geometry:** All buttons, panels, tables, tabs, inputs, and indicators have sharp `0px` corners.
- **Chamfered Variants (Tactical Accents):** Selected command elements (such as target status nodes or critical dossier cards) may feature a deliberate 45-degree corner cut (3px–4px chamfer) on top-right or diagonal corners to signify mission-critical telemetry markers.
- **Micro-Pills Exception:** Operational status indicators (e.g., live streaming radar pings) retain absolute geometric minimalism: precise `2px` micro-rectangles or sharp square nodes rather than circular dots.

## Components

### 1. Command Buttons
- **Primary Action (Cyan Armed):** Background `#38BDF8`, text `#090C10`, typography `label-tactical`, `0px` radius, padding `6px 14px`. Hover: `#7DD3FC`. Active: `#0284C7`.
- **Ghost Tactical (Secondary):** Background transparent, border `1px solid #212B3A`, text `#F1F5F9`. Hover: background `#151B26`, border `#2E3B4E`, text `#38BDF8`.
- **Hazard / Abort:** Border `1px solid #F43F5E`, text `#F43F5E`, background `rgba(244, 63, 94, 0.05)`. Hover: background `#F43F5E`, text `#FFFFFF`.

### 2. Tactical Badges & Chips
- **Micro-Status Indicator:** Sharp container with `1px solid` border, padding `2px 6px`, font `label-tactical`.
- **Variants:**
  - *Threat High:* Text `#F43F5E`, border `#F43F5E`, background `rgba(244, 63, 94, 0.1)`.
  - *Verified Target:* Text `#10B981`, border `#10B981`, background `rgba(16, 185, 129, 0.1)`.
  - *Telemetry Stream / Active:* Text `#38BDF8`, border `#38BDF8`, background `rgba(56, 189, 248, 0.1)`.
  - *Alert / Suspicious:* Text `#F59E0B`, border `#F59E0B`, background `rgba(245, 158, 11, 0.1)`.

### 3. High-Density Data Grids & Lists
- **Structure:** Zero-gap tabular layouts. Row height fixed at `28px`.
- **Header Row:** Background `#090C10`, border-bottom `1px solid #212B3A`, font `label-tactical`, text `#94A3B8`.
- **Data Rows:** Background `#0F141C`, alternating rows `#090C10` (subtle stripe optional), border-bottom `1px solid #151B26`. Text `body-compact` or `telemetry-data-sm`.
- **Row Hover:** Background `#151B26`, left border accent `2px solid #38BDF8`.

### 4. Input Fields & Query Terminals
- **Surface:** Background `#090C10`, border `1px solid #212B3A`, color `#F1F5F9`, font `telemetry-data-md`, padding `6px 10px`.
- **Focus State:** Border `1px solid #38BDF8`, outline `none`, inset shadow `0 0 0 1px #38BDF8`.
- **Prefix / Monospace Prompt:** Integrated command prompt prefix (e.g., `QUERY://`) in text `#475569`.

### 5. Checkboxes & Switches
- **Checkbox:** Sharp `12px x 12px` square, border `1px solid #2E3B4E`, background `#090C10`. Checked state: filled `#38BDF8` with a dark square core `4px x 4px` instead of a traditional checkmark.
- **Tactical Toggle Switch:** Segmented dual-block with sharp edges. Left: `OFF` (`#151B26`), Right: `LIVE` (`#10B981` with text `#090C10`).

### 6. Dossier Cards & Analytical Modules
- **Frame:** Surface `#0F141C`, border `1px solid #212B3A`.
- **Header Bar:** Integrated command strip with `28px` height, surface `#151B26`, border-bottom `1px solid #212B3A`, holding classification code, panel title (`label-tactical`), and collapse/action icons.

### 7. Telemetry Sparklines & Micro-Indicators
- **Inline Sparklines:** 1px stroke line vectors (`#38BDF8` or `#F43F5E`) without fill gradients; embedded directly inside table cells alongside tabular numeric metrics.
- **Coordinate Crosshairs:** Hairline target grid markings (`+` and `L` corner reticles) positioned at the outer boundaries of live telemetry visualization cards.