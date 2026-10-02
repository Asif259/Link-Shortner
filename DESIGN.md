---
name: Linkly Analytics Dashboard
version: 1.0.0
colors:
  primary: "#236B56"
  primary-hover: "#1C5745"
  primary-light: "#EBF5F1"
  secondary: "#3BA385"
  accent-mint: "#88D4BE"
  background-canvas: "#DDEBE4"
  surface-dashboard: "#F4F5F3"
  card-bg: "#FFFFFF"
  text-primary: "#1A2621"
  text-secondary: "#61726A"
  text-muted: "#8E9F97"
  border-subtle: "#E5EAE7"
  status-active: "#15803D"
typography:
  headline-lg:
    fontFamily: Inter, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
  headline-md:
    fontFamily: Inter, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  metric-stat:
    fontFamily: Inter, sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
  body-md:
    fontFamily: Inter, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label-xs:
    fontFamily: Inter, sans-serif
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  xl: 20px
  "2xl": 24px
  "3xl": 28px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  sidebar:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.3xl}"
  card:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.xl}"
    borderColor: "{colors.border-subtle}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-pill:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
---

# Linkly Analytics Dashboard Design Specification

## Overview
A modern, calm, and high-clarity SaaS Analytics Dashboard for a URL shortener product. The interface is framed in a distinctive large rounded tablet/app container against a soft pale mint background (`#DDEBE4`), mirroring the provided visual reference. It features a bold forest-teal sidebar, off-white card canvas, refined typography, and compact micro-visualizations.

## Colors
- **Primary Teal (`#236B56`)**: Dominates the sidebar navigation, primary CTA buttons, and key chart series.
- **Secondary Sage (`#3BA385`) & Accent Mint (`#88D4BE`)**: Used for multi-series charts, donut segmentations, and positive trend highlights.
- **Dashboard Canvas (`#F4F5F3`)**: Neutral, soft off-white backdrop that prevents eye fatigue while giving cards a crisp pop.
- **Outer Canvas (`#DDEBE4`)**: The ambient outer environment framing the floating dashboard container.
- **Card Surface (`#FFFFFF`)**: Pure white cards with clean 1px subtle borders (`#E5EAE7`) and soft ambient shadows.
- **Text Tones**: Neutral dark slate (`#1A2621`) for high readability, paired with calm secondary tones (`#61726A`).

## Typography
Clean modern sans-serif (`Inter`) with a disciplined hierarchy:
- Metrics: 24–28px, Bold 700.
- Card & Section Titles: 15–18px, Semi-bold 600.
- Body & Table Data: 13–14px, Regular 400.
- Micro-labels & timestamps: 11–12px, Medium 500.

## Layout & Spatial Rhythm
- Outer Frame: Floating rounded container (`rounded-3xl` / 28px) with responsive horizontal split.
- Left Sidebar: Fixed width (220px on desktop), vertically stacked navigation with distinct pill action at the footer (`Logout`).
- Content Area: Two-tier header (search pill, date filter, user avatar), followed by a 4-card metric grid, 2-column chart/activity section, and supplementary analytics grids.

## Elevation & Depth
- Ambient light drop shadow on the outer container (`0 20px 40px -15px rgba(26, 68, 55, 0.08)`).
- Content cards use crisp 1px borders with negligible elevation for a clean, non-distracting dashboard feel.

## Do's and Don'ts
- **DO** use rounded pills for search, timeframe filters, action buttons, and status tags to match the reference language.
- **DO** keep charts minimal, legible, and color-coordinated with the teal/mint palette.
- **DON'T** use random saturated neon colors, generic purples, or heavy glassmorphism blurs.
- **DON'T** clutter metrics with unnecessary decimal points or excessive decorations.
