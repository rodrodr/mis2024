```markdown
# Design System Document: The Decisive Record

## 1. Overview & Creative North Star

### The Creative North Star: "The Decisive Record"
This design system is not a standard web interface; it is a digital broadsheet. It draws inspiration from the authoritative weight of *The Economist* and the empirical rigor of *Pew Research*. The objective is to move beyond "app-like" templates and create a high-end editorial landscape that feels archival, academic, and indisputable.

We achieve this through **Organic Brutalism**: a synthesis of strict, hard-edged layouts (0px border radius) and soft, tonal backgrounds. By rejecting standard UI tropes like heavy shadows and rounded buttons, we signal to the user that the content is serious, researched, and premium. The layout should feel like a series of physical paper layers—stacked, intentional, and clean.

---

## 2. Colors & Tonal Architecture

The palette is rooted in a "Strict Light Mode" philosophy. We use a sophisticated cream base to reduce eye strain and provide a more "literary" feel than pure white.

### Palette Strategy
- **Background (`#fbf9f4`):** The primary canvas. It should feel like high-quality, uncoated paper.
- **Surface Tiers:** 
    - **Surface Container Lowest (`#ffffff`):** Reserved exclusively for cards and interactive modules to make them "pop" against the cream background.
    - **Surface Container High (`#eae8e3`):** Used for "recessed" areas like sidebars or footer regions.
- **Accents (Muted Brazil Influence):**
    - **Primary (`#154212`):** A deep, scholarly green for primary actions and brand presence.
    - **Secondary (`#3056c4`):** A muted navy for secondary utility and link treatments.
    - **Tertiary (`#735c00`):** A sophisticated gold for highlights, warnings, or specialized data callouts.

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning. Structural boundaries must be defined through **Background Color Shifts**. For example, a "Surface Container Low" section sitting on a "Surface" background creates a clean, sophisticated break without the clutter of a stroke.

### Signature Textures
For main Call-to-Actions (CTAs), do not use flat fills. Use a subtle linear gradient transitioning from `primary` to `primary_container` at a 15-degree angle. This adds a "silk-screened" depth that feels expensive and custom.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance utility with narrative authority.

- **The Narrative (Newsreader):** All Display, Headline, and Body text must use Newsreader. This serif typeface conveys history and intellectual depth.
    - *Display-LG (3.5rem):* Use for hero statements.
    - *Body-LG (1rem):* Use for long-form analysis. Increase line-height to 1.6 for maximum readability.
- **The Utility (Inter):** All Labels, Metadata, and UI components (buttons, inputs) must use Inter. This provides a functional contrast to the serif narrative.
    - *Label-MD (0.75rem):* Use for data captions and small UI elements. Always use Uppercase with +5% letter spacing for a premium "technical" look.

---

## 4. Elevation & Depth

In this system, depth is earned through **Tonal Layering**, not structural shadows.

- **The Layering Principle:** Treat the UI as a stack of paper. The most important content (e.g., a data story card) sits on `surface_container_lowest` (#ffffff), placed atop the `background` (#fbf9f4). 
- **Ambient Shadows:** Standard drop shadows are forbidden. If a floating element (like a modal or dropdown) is required, use a "Tinted Ambient Shadow": 
    - *Blur:* 40px
    - *Spread:* -5px
    - *Color:* `on_surface` at 6% opacity. This creates a soft glow rather than a harsh edge.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in a complex data table), use the `outline_variant` token at **15% opacity**. This "Ghost Border" provides a hint of structure without interrupting the flow of white space.

---

## 5. Components

### Buttons
- **Shape:** 0px border-radius (Strict Square).
- **Primary:** `primary` background with `on_primary` text. No border.
- **Secondary:** Transparent background with a `primary` Ghost Border (20% opacity).
- **States:** On hover, shift the background color one tier darker (e.g., from `primary` to `primary_container`).

### Cards & Narrative Modules
- **Rule:** No borders. 
- **Separation:** Use `surface_container_lowest` for the card body. Use generous padding (minimum 32px) to allow the typography to breathe.
- **Asymmetry:** Experiment with placing images or data viz offset from the text column to create an editorial, "non-templated" feel.

### Data Visualization (Ideological Scale)
Our diverging scale for political or data mapping:
- **Left/Opposition:** Deep Red (`#B22222`).
- **Center/Neutral:** Soft Green/Grey (`#7FB069`).
- **Right/Proponents:** Deep Blue (`#0047AB`).
- *Instruction:* Use these colors with high-contrast text (`#ffffff`) for legibility.

### Input Fields
- **Styling:** Bottom-border only (1px using `outline`).
- **Focus State:** Transition the bottom-border to 2px `primary` green.
- **Background:** A very subtle `surface_container_low` fill to define the touch target.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Whitespace:** If a layout feels "crowded," double the margins. Editorial design lives and dies by its gutters.
- **Use Intentional Asymmetry:** Align text to the left but allow data callouts to hang in the right margin.
- **Prioritize Hierarchy:** Use the Display-LG serif type to make a statement. Don't be afraid of large text.

### Don’t:
- **Never use Rounded Corners:** Even a 2px radius destroys the "Decisive Record" aesthetic.
- **Avoid Pure Black:** Use `on_surface` (#1b1c19) for text to maintain the soft, ink-on-paper look.
- **No Divider Lines:** Do not use `<hr>` tags or lines to separate list items. Use 16px-24px of vertical spacing instead.
- **No Standard Blue Links:** Use the `secondary` navy or `primary` green for links, always with a subtle underline (Ghost Border style).

---

## 7. Interaction Note
Interactions should feel "Heavy and Meaningful." Avoid bouncy, playful animations. Use "Ease-in-out" transitions with durations between 200ms and 300ms. Fades should be preferred over slides to maintain the feeling of flipping through a high-end journal.```