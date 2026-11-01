# Skyhaven Design System — Master Specification
*Generated with UI/UX Pro Max — Cloud Storage SaaS Profile*

---

## 1. Brand Identity & Visual Direction

Skyhaven is a modern, high-performance cloud storage and collaborative workspace platform inspired by the clarity of Dropbox, the versatility of Google Drive, and the craft of Linear.

- **Design Philosophy**: Functional Minimalism, Tactile Micro-Interactions, Spatial Depth.
- **Theme**: Clean Blue & White (Pure White `#FFFFFF`, Slate Neutral `#F8FAFC`, Electric Azure `#0061FE`).
- **Surface Elevation**: Subtle 1px crisp borders (`#E2E8F0`), diffuse ambient shadows, and selective glassmorphism backdrop blurs for modals/overlays.
- **Micro-Animations**: Framer Motion fluid springs (`damping: 24, stiffness: 300`) for folder expands, file selections, drag drops, and upload progress bars.
- **Spatial 3D Elements**: Three.js canvas modules for interactive 3D storage vaults, data crystal geometry, and responsive cloud particle fields.

---

## 2. Color Palette & Token Scale

| Token Name | Hex Code | Purpose |
|------------|----------|---------|
| `primary-50` | `#EFF6FF` | Selection tint, active row background |
| `primary-100` | `#DBEAFE` | Badge backgrounds, hover states |
| `primary-500` | `#3B82F6` | Secondary brand accent |
| `primary-600` | `#0061FE` | Main Brand Azure (Primary CTA, links, active icons) |
| `primary-700` | `#0052D4` | Primary hover state, button press |
| `surface-canvas` | `#F8FAFC` | App-wide shell background |
| `surface-card` | `#FFFFFF` | File grids, tables, cards, dialogs |
| `surface-sidebar` | `#F8FAFC` | Sidebar navigation, secondary panels |
| `border-subtle` | `#E2E8F0` | Structural dividers, card borders |
| `border-focus` | `#0061FE` | Keyboard focus ring (with 2px offset) |
| `text-primary` | `#0F172A` | Headings, file names, primary labels |
| `text-secondary` | `#475569` | Metadata, file sizes, timestamps |
| `text-muted` | `#94A3B8` | Placeholders, inactive breadcrumbs |
| `accent-emerald` | `#10B981` | Success states, upload completed, active sessions |
| `accent-amber` | `#F59E0B` | Warning, quota 80%+, starred items |
| `accent-rose` | `#EF4444` | Trash, destructive delete, validation errors |
| `accent-violet` | `#8B5CF6` | Media files, shared links, collaborative features |

---

## 3. Typography Hierarchy

- **Font Family**: Plus Jakarta Sans / Inter, system sans-serif fallback
- **Monospace Family**: JetBrains Mono / Fira Code (for token hashes, API keys, checksums)

| Role | Size | Line Height | Weight | Tracking |
|------|------|-------------|--------|----------|
| Display H1 | 32px (2rem) | 1.2 | 700 (Bold) | -0.025em |
| Page H2 | 24px (1.5rem) | 1.25 | 600 (SemiBold) | -0.02em |
| Section H3 | 18px (1.125rem) | 1.3 | 600 (SemiBold) | -0.015em |
| Body Regular | 14px (0.875rem) | 1.5 | 400 (Regular) | 0 |
| Body Medium | 14px (0.875rem) | 1.5 | 500 (Medium) | 0 |
| Caption / Meta | 12px (0.75rem) | 1.4 | 500 (Medium) | +0.01em |
| Micro Badge | 11px (0.6875rem) | 1.2 | 600 (SemiBold) | +0.02em |

---

## 4. Layout & Spacing System

- **Desktop Layout**: 
  - Persistent left sidebar: `w-64` (256px) or collapsed `w-20` (80px)
  - Top search & quick actions header: `h-16` (64px)
  - Main scrollable workbench: fluid with max content width `max-w-7xl`
  - Right collapsible inspection drawer: `w-80` (320px) for file details & activity
- **Mobile Layout**: 
  - Header: `h-14` with Hamburger trigger and user avatar
  - Slide-in navigation drawer with backdrop blur
  - Bottom quick-action bar for rapid upload & folder creation
- **Base Grid**: 4px / 8px scale (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px)
- **Border Radii**: 
  - Badges/Pills: `rounded-full`
  - Inputs/Buttons: `rounded-lg` (8px)
  - Cards/Modals: `rounded-xl` (12px) to `rounded-2xl` (16px)

---

## 5. Micro-Interactions & Animation Principles

- **Hover Feedback**: 150ms cubic-bezier transition, subtle background tint (`hover:bg-slate-100`), 1px translateY on CTA buttons.
- **File Drag & Drop**: Full viewport drop zone indicator with dashed `#0061FE` border, floating upload batch modal with individual file progress rings/bars.
- **Context Menus**: Floating spring popover positioned at cursor or anchor with keyboard accessibility (arrow navigation, ESC to dismiss).
- **Three.js Visualizations**: 
  - Landing Hero: Interactive rotating 3D cloud data node with floating file-crystal spheres that react to pointer hover.
  - Storage Overview: 3D interactive holographic cylinder/ring displaying storage partitions by file type.

---

## 6. Pre-Delivery UX Checklist

- [x] High-contrast accessible text (> 4.5:1 ratio on all surfaces)
- [x] Clear active states on all 75 API client endpoints
- [x] No emoji icons — 100% SVG Lucide icons
- [x] Full keyboard navigation (Cmd/Ctrl + K search, arrow navigation, Escape to close modals)
- [x] Graceful empty states with actionable primary buttons for new accounts
- [x] Real-time simulated API engine supporting all 75 documented endpoints with realistic latency, optimistic updates, and persistent LocalStorage state.
