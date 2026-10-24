# FATHOM — surface brief / direction contract (dev-only, never shipped)

Mode: Experience (studio-site register) with a Persuade close ("join the next descent").
Subject: FATHOM, a fictional deep-ocean survey institute that maps the water column below the light (ROV mapping, sensor moorings, hadal landers).
Audience & scene: research partners, funders, engineers; desktop in a quiet office; curious but busy. Mobile: a simpler, non-pinned read.
Job: make the depth tangible, prove technical seriousness, get a partner to open a conversation.
Unique mechanism: they survey continuously from surface to hadal trench; the page IS a descent.

Cultural world considered (7): bathymetric charts; sonar/echogram scrolls; CTD rosette instruments; lab notebook with depth readouts; the light
falloff of the water column (sunlight/twilight/midnight/abyss/hadal); submersible viewport; expedition logbooks. Rut: "near-black + glowing cyan neon
ocean page" and its opposite "cream + serif + terracotta brochure". Both rejected.

Chosen world: **the water column itself**. The page descends: ground colour goes from bright surface foam to lightless abyss as you scroll, type
inverts with it. Material is drifting marine snow (GPGPU particles) pushed by the cursor like a current. One accent: sonar orange, spent only on
interactive/moving things (links, cursor, live readout). Mono (IBM Plex Mono) is used ONLY for measurements (depth, pressure, temperature) —
structure as information. Display/body: Bricolage Grotesque (one family, optical sizes/widths).

First viewport: headline "We map what the light never reaches." over a live water column; a depth readout (−0 m) that ticks as you scroll; grid corner marks.
Visitor path: Surface (hero + mission) → The Descent (pinned scroll-film through 5 light zones with real facts) → Expeditions (horizontal tiles with
procedural bathymetry textures) → Instruments (data table, tabular nums) → Join the next descent (contact) → footer.
Signature interaction: cursor-current through the particle field + the continuous darkening descent tied to scroll depth.
Cross-surface reach: depth readout and orange accent carry to every page; charts world carries into tables.
Honest risk: dark lower half risks the "dark+neon" cluster — mitigated by a warm, desaturated orange and no glows/box-shadows; particles must stay
subtle (small, low-contrast) so copy stays legible at every scroll position.
Illustrative content: institute, expeditions, instrument specs are fictional and labelled as such in the footer.

Tokens (OKLCH): surface ground oklch(97% 0.012 220) → abyss ground oklch(13% 0.03 250); ink oklch(16% 0.02 250) ↔ foam oklch(95% 0.01 220);
accent oklch(70% 0.19 45) (sonar orange). Radius 14px (tiles), 999 (small controls only). Grid 12 col, gap 2vw, margin clamp(24px,5vw,96px).
Type scale 1.25: body 1rem/1.55, lead 1.25, h3 1.56, h2 2.44, display clamp(2.8rem, 6.5vw, 6rem) tracking -0.025em.
Motion: --ease-out cubic-bezier(.23,1,.32,1); --ease-expo cubic-bezier(.16,1,.3,1); UI 160–260ms; scroll scrub 0.6; one authored moment = hero load (headline lines rise, readout counts, particles fade in).
