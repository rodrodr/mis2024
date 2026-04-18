# Design System: High-End Editorial Intelligence

## 1. Overview & Creative North Star
The **Creative North Star** for this design system is **"The Digital Curator."** 

This system moves beyond the rigid, "dashboard-style" conventions of typical data platforms. It treats municipal ideological data not as a series of cold metrics, but as a narrative that requires editorial nuance. By blending the gravitas of a high-end broadsheet with the precision of modern data journalism, we create an experience that feels both authoritative and accessible.

The design breaks the standard "template" look through:
*   **Intentional Asymmetry:** Using a split-screen layout for storytelling, where text and data visualization interact across a vertical axis.
*   **High-Contrast Scale:** Utilizing dramatic shifts in typography size to establish a clear narrative hierarchy.
*   **Breathing Room:** Prioritizing ample whitespace (negative space) to reduce cognitive load during complex data analysis.

---

## 2. Colors
Our palette is rooted in a sophisticated, muted base that allows vibrant data signals to command attention.

### Foundational Tones
*   **Background (`#f4f4f2`):** A soft cream/light grey that reduces eye strain and provides a premium, "paper-like" feel.
*   **Surface Lowest (`#ffffff`):** Reserved exclusively for card interiors and tooltips to provide the highest point of visual focus.

### The Ideological Divergent Scale
Data visualization must follow this strict spectrum:
*   **Left (Progressive):** Red (`error`)
*   **Center (Neutral):** Green (`secondary`)
*   **Right (Conservative):** Blue (`on_tertiary_container`)

### The "No-Line" Rule
To maintain a high-end editorial feel, **prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit on a `surface` background to create a "zone" without the clutter of lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Depth is achieved by "stacking" the surface-container tiers:
1.  **Level 0 (Base):** `surface` (#f9f9f7)
2.  **Level 1 (Sub-sections):** `surface_container_low` (#f4f4f2)
3.  **Level 2 (Interactive Cards):** `surface_container_lowest` (#ffffff)

### Signature Textures
Main CTAs or hero backgrounds should utilize subtle gradients (transitioning from `primary` to `primary_container`) to provide visual "soul" that flat colors cannot achieve alone.

---

## 3. Typography
The typography system is a dialogue between the tradition of Serif and the efficiency of Sans-Serif.

*   **Display & Headlines (Newsreader):** A robust, elegant Serif. This is our "Editorial Voice." Use `display-lg` for impactful narrative titles and `headline-md` for section starts. The slight character of a serif conveys trust and historical weight.
*   **Body, Labels & Numbers (Inter):** A clean, high-legibility Sans-Serif. This is our "Analytical Voice." Use this for all UI elements, data labels, and dense body copy. 
*   **Hierarchy as Brand:** By setting headlines in Newsreader and data in Inter, we visually separate the *story* from the *evidence*, allowing the user to switch mental modes seamlessly.

---

## 4. Elevation & Depth
We eschew traditional structural lines in favor of **Tonal Layering.**

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift without needing a shadow.
*   **Ambient Shadows:** When a card requires a "floating" effect, use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(26, 28, 27, 0.06);`. The shadow color must be a tinted version of the `on-surface` color to mimic natural light.
*   **The "Ghost Border" Fallback:** If a border is necessary for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque, high-contrast borders for containers.
*   **Glassmorphism:** Use backdrop blurs (`backdrop-filter: blur(8px)`) on tooltips and floating navigation bars. This allows the underlying data colors to bleed through, making the layout feel integrated into the "paper."

---

## 5. Components

### Navigation & Filters
*   **Pill Buttons:** Rectangular 'pill' shapes with a `DEFAULT` (0.25rem) roundedness. 
*   **The "Thick Border" Variant:** Filters use a 2px solid border (`primary`) with no fill for an "unselected" state, and a solid `primary` fill for "active" states.

### Cards & Small Multiples
*   **Rule of Separation:** Forbid divider lines. Use vertical whitespace (32px or 48px) to separate content blocks.
*   **Small Multiples Grid:** Use a strict grid for ECharts instances. Each chart container should have a `surface-container-lowest` background and a subtle ambient shadow.

### Charts & Data Journalism Elements
*   **Gap Analysis:** Area charts representing ideological gaps must use a **hatched pattern** (diagonal lines) to indicate the "area of tension."
*   **Historical Annotations:** Use `surface_dim` (#dadad8) for vertical bands to represent specific historical eras or policy shifts within charts.
*   **Tooltips:** Pure white background, sharp corners (`sm` roundedness), with an `Inter` label-md font for data points.

### Split-Screen Storytelling
*   **Layout:** Left-side (40% width) contains the Serif narrative; Right-side (60% width) contains the interactive data viz. The two sides should scroll independently or lock based on narrative "waypoints."

---

## 6. Do's and Don'ts

### Do
*   **DO** use `display-lg` for numbers that represent key findings—treat data as a headline.
*   **DO** leave more whitespace than you think is necessary. "Breathe" is a functional requirement.
*   **DO** use `secondary_container` (#a0f399) as a highlight color for text-based insights.

### Don't
*   **DON'T** use 1px solid black borders for cards. Use the Tonal Layering Principle instead.
*   **DON'T** use rounded corners larger than `0.5rem` (lg) except for the "full" pill buttons. We want a sharp, editorial feel, not a "bubbly" mobile app look.
*   **DON'T** mix the font families. Keep the "Editorial" and "Analytical" voices distinct.
*   **DON'T** use standard grey shadows. Always tint your shadows with the background hue for a premium finish.