# ✨ Top Web Animation Techniques for Modern Sites

These are the foundational animation techniques used across award-winning websites. Master these, and you’ll cover 80% of what’s needed for creative, high-end web animation.

---

## 🔹 1. Scroll Tracking

Track the scroll progress of a section (usually a `0–1` value) and map it to animations like opacity, scale, or position.

**Tooling:**

- [`framer-motion`](https://www.framer.com/motion/) → `useScroll()`, `useTransform()`

**Pro tip:** Combine with smooth scrolling for buttery animations.

**Smooth scroll libraries:**

- [`lenis`](https://github.com/studio-freight/lenis)
- [`locomotive-scroll`](https://github.com/locomotivemtl/locomotive-scroll)

---

## 🔹 2. Viewport Detection

Trigger animations when elements **enter the viewport**. Perfect for staggered entrances or lazy reveals.

**Tooling:**

- Native: `IntersectionObserver API`
- `framer-motion` → `useInView()`

**Why it matters:** Used in nearly every modern website — a core building block.

---

## 🔹 3. CSS Sticky Position

A simple but powerful technique. Use `position: sticky` to pin elements during scroll and enable elegant, scroll-driven transitions.

**Why it’s great:**

- Native, performant, cross-browser
- Requires no JavaScript

**Pro tip:** Use creatively to avoid it feeling too “on-the-nose.” Think image reveals, pinned sections, or layered content transitions.

---

## 🔹 4. Easings

Easings define the **feel** of your animations — snappy, smooth, bouncy, or dramatic.

**Why it matters:** Good easing is the difference between amateur and pro-level motion design.

**Common types:**

- `easeInOut`
- `anticipate`
- `spring`
- Custom cubic-beziers or physics-based

**Pro tip:** Tune easings to match your site's personality and mood.

---

## 🔹 5. Text Splitting

Break text into **lines → words → characters** to animate each part individually. Useful for hero headlines, intros, and scroll reveals.

**Tooling:**

- [`split-type`](https://github.com/lukePeavey/SplitType)

**Caution:**

- Watch for **accessibility issues**
- Handle **resize events** to prevent layout bugs

---

## ⚡ Bonus Techniques

### ➕ Math Mapping

Remap a value from one range to another. Crucial for scroll progress, mouse tracking, and dynamic scaling.

```js
// Example: map 0–1 scroll progress to 0.5–1.2 scale
const scale = map(scrollProgress, 0, 1, 0.5, 1.2);
```

- Framer Motion → useTransform()

---

## ➕ Linear Interpolation (Lerp)

Smoothly transition between values — great for pointer trails, fluid movement, and canvas-based animations.
