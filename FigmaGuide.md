# Figma Setup — Step by Step

### Step 1 — Create the Frame

1. Open Figma and create a new file.
2. Press **`F`** to select the Frame tool.
3. Draw a frame anywhere on the canvas.
4. In the right panel, set the dimensions exactly:
   - **W:** `1748`
   - **H:** `874`
5. Name the frame `YourDesignName` (e.g. `VintageEcash`).

> **The frame is your coordinate origin (0, 0).** Everything you measure must be
> relative to the top-left corner of this frame, not the Figma canvas.

### Step 2 — Place Your Design Image

1. Import your artwork into Figma (**Ctrl/Cmd + Shift + K** or drag and drop).
2. Select the image layer and set:
   - **X:** `0`
   - **Y:** `0`
   - **W:** `1748`
   - **H:** `874`
3. Make sure the image fills the entire frame with no gap.

### Step 3 — Lock the Aspect Ratio Before Measuring

For all measurement steps below, **unlock the aspect ratio lock** in Figma's constraint panel (the chain icon 🔗 in the top right of the design panel). This prevents accidental proportional resizing when you are only reading coordinates — not resizing.

---

## Measuring QR Coordinates

The QR code is placed inside a rectangular slot on your design. You need to define where that slot is and how large it is.

### Step 1 — Add a QR Placeholder Rectangle

1. Press **`R`** to draw a rectangle on your frame.
2. Position and size it to cover the area where the QR code should appear on the printed note.
3. Name the layer `QR Placeholder`.
4. Set fill to any solid color so you can see it clearly (e.g. red at 50% opacity).

### Step 2 — Read the Coordinates

**Critical: click the parent Frame first, then click the QR rectangle.**
This ensures Figma shows coordinates relative to the frame, not the canvas.

In the right panel, read these four values:

| What to read | Figma panel label | JSON field |
|---|---|---|
| Left edge of rectangle | **X** | `qr.x` |
| Top edge of rectangle | **Y** | `qr.y` |
| Rectangle width | **W** | `qr.width` |
| Rectangle height | **H** | `qr.height` |

Write these down exactly as integers. Example:

```
X: 137   → qr.x
Y: 132   → qr.y
W: 594   → qr.width
H: 589   → qr.height
```

> **The QR slot should be roughly square.** The renderer draws a square QR code
> inside this rectangle, centered. If your slot is very non-square (e.g. 2:1 ratio),
> the QR will have large blank margins on two sides.

### Step 3 — Check Alignment Visually

Temporarily set a QR code image (any QR image from the web) inside the placeholder
to verify it looks correct on the design before you finalize the coordinates.

---

## Measuring Denomination Text Coordinates

The denomination text (e.g. `2.04 SATS`) is rendered in **bold Arial** directly on the note. You specify where its **top-left corner** starts.

> **Important:** The renderer uses `ctx.textBaseline = 'top'`, which means the `y`
> coordinate is the **top** of the text, not the baseline. This matches CSS `top`
> positioning and Figma's coordinate system.

### Step 1 — Add a Text Layer as Reference

1. Press **`T`** to add a text layer on your frame.
2. Type `0.000 SATS` (this is the format the renderer uses).
3. Set the font to **Bold Arial** (or closest available).
4. Set the font size to match what looks good on your design (common values: `58`, `72`, `78`).
5. Position the text where you want it on the note.

### Step 2 — Read the Coordinates

Again, **click the Frame first, then click the text layer.**

| What to read | Figma panel label | JSON field |
|---|---|---|
| Left edge of text box | **X** | `denomination.x` |
| Top edge of text box | **Y** | `denomination.y` |
| Font size | **font size in text panel** | `denomination.fontSize` |

Example:

```
X: 768   → denomination.x
Y: 392   → denomination.y
Font: 78 → denomination.fontSize
```

### Step 3 — Font Size Guidance

| Design feel | Suggested fontSize |
|---|---|
| Large / prominent | `78` |
| Medium / balanced | `72` |
| Small / subtle | `58` |

The `fontSize` value is in Figma pixels at the 1748×874 canvas. The renderer scales it proportionally to the actual print size automatically — you do not need to adjust for print DPI.

---

## Exporting the PNG

### Export Settings

1. In Figma, select your **Frame** (not an inner layer — click the frame name in the layers panel).
2. In the right panel, scroll to the bottom and click **`+`** next to "Export".
3. Set the export options:
   - **Scale:** `1x`
   - **Format:** `PNG`
   - **Suffix:** *(leave empty)*
4. Click **Export `YourDesignName`**.

> **Export the Frame, not the image layer inside it.**
> If you export an inner layer, the coordinates will shift because the image's
> own bounding box becomes the origin instead of the frame.

---

## Common Mistakes

### Wrong coordinate origin

**Symptom:** QR appears shifted to the bottom-right in the preview.

**Cause:** You measured coordinates relative to the Figma canvas, not the frame.

**Fix:** In Figma, click the Frame layer in the layers panel first, then click your QR rectangle. The X/Y values in the right panel will now be frame-relative.

---

### Aspect ratio lock active while measuring

**Symptom:** `qr.width` and `qr.height` look like they were rounded to maintain a ratio.

**Cause:** Figma's aspect ratio lock (🔗) was on, and repositioning the element changed both dimensions.

**Fix:** Unlock the chain icon before measuring. Read the values as they are — do not adjust them manually.

---

### Exporting an inner layer instead of the frame

**Symptom:** The PNG crops the design or has wrong dimensions.

**Cause:** You selected the image layer inside the frame, not the frame itself.

**Fix:** In Figma's layers panel, click the top-level frame named after your design, then export.

---

### Font size mismatch

**Symptom:** Denomination text renders much larger or smaller than expected.

**Cause:** `denomination.fontSize` was copied from a text layer that used a different font size than intended.

**Fix:** Verify the font size in Figma's text properties panel (not the transform panel). Set the value in `denomination.fontSize` to match exactly what you set in Figma.

---

### QR slot is not square

**Symptom:** The QR code has large empty margins on two sides.

**Cause:** `qr.width` and `qr.height` have a large difference (e.g. `600 × 200`).

**Fix:** Reshape your QR placeholder to be approximately square. The renderer fits a square QR into your slot — the slot should match.
