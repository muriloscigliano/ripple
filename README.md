# Ripple Pond

> Every decision is a stone. Every choice sends ripples.

A meditative dark pond where each typed decision drops as a stone, propagates real wave-equation ripples across the surface, and Claude streams consequences that fade in along the wavefronts as they expand. When two ripples cross, a *compound consequence* blooms at the intersection — the model reasoning live about what happens when two choices collide.

Built in 3 hours as a hackathon project, spec-driven.

## Run

```bash
npm install
npm run dev
```

Opens at http://localhost:5173/.

## Live mode (optional)

Without an API key the app runs in **fallback mode**: ~10 hand-crafted consequences per preset decision arrive at the same 150 ms cadence as the live stream would. The visual demo is identical; only the reasoning is canned.

To enable live Claude streaming, drop your key in `.env.local`:

```
VITE_ANTHROPIC_API_KEY=sk-ant-…
```

Restart `npm run dev`. The model used is `claude-haiku-4-5-20251001`.

## Demo flow

1. Page loads, dark pond. After ~3.5 s, a single quiet stone drops at the center with the words *"every decision is a stone"* shimmering on the water.
2. Input fades in at ~4.5 s.
3. Click a preset (*"I quit my job today."* / *"I'm telling them how I feel."* / *"I'm moving across the country."*) or type your own and press Enter.
4. The text falls into the water, splash, ripple expands. 8–10 consequence cards fade in along the wavefront over ~6 s — present-tense, concrete, mixing immediate / short-term / long-term, mixing calm / tense / heavy.
5. Drop a second decision. When the two wavefronts intersect, the simulation slows briefly, gold particles radiate from the crossing, and a compound consequence blooms — *"You sleep on the couch tonight"*, etc.

## Architecture

Three strict layers:

```
Layer A — Pond            (p5 instance, two Float32Array buffers,
                           Hugo Elias kernel, analytic wavefront tracker,
                           Bourke circle-circle intersections)

Layer B — Engine          (Anthropic SDK with dangerouslyAllowBrowser,
                           NDJSON streaming via messages.stream + assistant
                           prefill '{', validation/coercion layer,
                           150 ms queue-drain pacing, fallback router)

Layer C — Conductor       (React + Zustand v5, intersection polling at
                           10 Hz with pending-queue retry, severity-driven
                           hue shift, time dilation pre-bloom, particle
                           radiation, glass cards with variable-font
                           weight pulse modulated by local wavefront amp)
```

Layer A imports nothing from B or C. Layer B imports nothing from A or C. Layer C is the only place that knows both exist.

## Design system

CSS-first Tailwind v4 (`@theme` block) with OKLCH color space throughout. All design tokens live in `src/styles/tokens.css` and are frozen day-one:

- **Color** — surface ramp (void → deep → mid → light), severity scales (calm cyan / tense amber / heavy ruby / compound gold)
- **Type** — Fraunces variable serif (consequence cards, with `wght` + `SOFT` axes), Inter (UI), Geist Mono (instrument readouts)
- **Motion** — named easings (`water` / `drop` / `emerge` / `vanish`) and named durations (`instant` / `fast` / `medium` / `slow` / `cinematic`); every motion preset lives in `src/motion/presets.ts`
- **Effects** — backdrop blur for glass cards, gold compound glow, blur-vignette

Single hardest design rule: the canvas is the hero. UI chrome is whisper-quiet.

## Stack

Vite 6 · React 18 · TypeScript · p5.js (instance mode) · Zustand v5 · `@anthropic-ai/sdk` · Motion (Framer Motion) · Tailwind CSS v4 · Fraunces / Inter / Geist Mono.
