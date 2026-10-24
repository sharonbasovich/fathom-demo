---
name: FATHOM
colors:
  primary: "#141A26"
  ground-surface: "#F3F6F8"
  ground-abyss: "#0B1623"
  ink: "#141A26"
  ink-foam: "#EEF1F4"
  ink-2: "#4C5A6B"
  accent: "#F08A3D"
  rule: "rgba(20, 26, 38, 0.14)"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontSize: 6.4rem   # fluid: clamp(2.8rem, 1rem + 6.6vw, 6.4rem)
    lineHeight: 0.98
    letterSpacing: -0.03em
    fontWeight: 400
  h2:
    fontFamily: Bricolage Grotesque
    fontSize: 3.05rem  # fluid: clamp(1.9rem, 1.2rem + 2.2vw, 3.05rem)
    lineHeight: 1.05
    fontWeight: 500
  body:
    fontFamily: Bricolage Grotesque
    fontSize: 1rem
    lineHeight: 1.55
  measurement:
    fontFamily: IBM Plex Mono
    fontSize: 0.85rem
rounded:
  tile: 14px
  control: 999px
spacing:
  gap: 2vw
  margin: clamp(24px, 5vw, 96px)
  section: 12vh–18vh
---

## Overview

The page is the water column. The ground colour is the light at the visitor's depth: bright surface foam at the top of the page,
lightless abyss once the descent passes the twilight zone, and the type inverts with it. Marine snow (a GPGPU particle field)
drifts through every section and is pushed aside by the cursor like a current; a click sends a sonar ring through it. One accent,
sonar orange, is spent only on things that move or can be acted on: the live depth readout, the scale pin, links on hover, survey
tracks on charts. Mono type is used only for measurements.

## Colors

- **Ground** moves continuously from `oklch(97% 0.012 220)` to `oklch(13% 0.03 250)`; CSS tokens switch at the twilight boundary (`data-dark`).
- **Ink / foam** are the two text colours; secondary text is tinted from the same hue, never grey.
- **Accent** `oklch(70% 0.19 45)` — interactive and live only. Never as fill for surfaces.
- No gradients on text, no glows, no box-shadows; depth is expressed by the scene, not by elevation.

## Typography

One family, Bricolage Grotesque (variable: weight, width, optical size). Display at weight 400, width 92, tracking −0.03em; headings
at 500; body at 400. IBM Plex Mono for depth, pressure, temperature, dates and chart annotations — the instrument voice. No eyebrows,
no all-caps labels, no accented single words.

## Layout

12 columns, 2vw gaps, margins `clamp(24px, 5vw, 96px)`. Corner cross marks expose the grid in the hero. Headlines left, supporting copy
on the right columns; the descent pins one viewport with the depth scale in column 1 and zone copy from column 5. Expeditions scroll
horizontally on desktop and are a snap scroller on mobile.

## Motion

Lenis smooth scroll driven by GSAP's ticker. One authored moment: hero headline lines rise (expo.out, 1.3s, 90ms stagger). The descent is
scrubbed (0.6s smoothing) with strictly sequential zone hand-offs. Section headings rise once. UI transitions 220ms, `cubic-bezier(.23,1,.32,1)`.
`prefers-reduced-motion`: no smoother, no pins, zones stack, canvas removed.

## Components

Pill buttons (ink on ground; accent on hover; scale .97 on press). Tables: text left, numbers right in mono with tabular figures, hairline rules.
Tiles: 14px radius, procedural bathymetric charts, no hover scale. Focus rings are a two-ring box-shadow in accent.
