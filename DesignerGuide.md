# PaperEcash — Designer Contribution Guide

> **This guide is for designers who want to contribute new note designs to PaperEcash.**
> Read it fully before opening Figma. The QR code position and denomination text placement
> depend entirely on the coordinates you measure here — if they are off, the printed notes
> will look misaligned.

---

## 1. Canvas Specification

All designs **must** use a **2:1 aspect ratio** exactly. This is the only hard requirement on dimensions — you may work at any resolution as long as the ratio is precisely `2:1`.

| Property | Value |
|---|---|
| **Aspect Ratio** | `2 : 1` (required) |
| **Recommended Size** | `1748 × 874 px` |
| **Physical Size** | `3.5 × 1.75 inches` at 500 DPI |

> **Why 1748 × 874?**
> This is the standard size used across all existing designs and maps directly to a physical cash note card at 500 DPI. You may use a different resolution (e.g. `3496 × 1748` for 2x), but the aspect ratio must be exactly `2:1`. If `designSize` is not provided in the JSON entry, the renderer will fall back to `1748 × 874` as the default — so always provide your actual canvas size to ensure correct coordinate mapping.

---

## 2. Required Deliverables

For each design you contribute, you must provide:

- [ ] **`front.png`** — the front face of the note
- [ ] **`back.png`** — the back face of the note
- [ ] **JSON entry** — filled into `public/json/designs.ts`
- [ ] **Front QR placeholder coordinates** — `x`, `y`, `width`, `height`
- [ ] **Back QR placeholder coordinates** — `x`, `y`, `width`, `height`
- [ ] **Denomination text coordinates** — `x`, `y`, `fontSize`
- [ ] **Canvas natural size** — `width`, `height`

---

## 3. Folder & File Naming

Create a folder under `public/designs/` named exactly as you will reference it in the JSON `frontPath` and `backPath` fields. Place `front.png` and `back.png` inside it:

```
public/designs/YourDesignName/front.png
public/designs/YourDesignName/back.png
```

**Naming rules for folders:**

```
VintageEcash/     ✅
vintage_ecash/    ✅  (must match path fields exactly — case-sensitive)
My Design v2/     ❌  (spaces not recommended)
```

---

## 4. Measuring Coordinates in Figma

All `x`, `y`, `width`, and `height` values must be measured **relative to the design frame**, not the Figma canvas.

**Steps:**
1. Open your Figma file.
2. **Select the frame first** (the 2:1 rectangle that represents the note).
3. Inside that frame, select the QR placeholder or text element.
4. Read `X`, `Y`, `W`, `H` from the right panel — these are your coordinates.

> If you select an element without first selecting the frame, the coordinates will be relative to the Figma canvas and will be wrong.

See [FigmaGuide.md](./FigmaGuide.md) for a step-by-step walkthrough with screenshots.

---

## 5. Front & Back QR Placement

Leave a clearly empty, undecorated rectangular area on **both the front and back** of your design where the QR code will be rendered. Do not place any design elements inside this area — the renderer will draw the QR code precisely within the bounds you specify.

**Rules for the QR region:**
- Must be roughly square (`width` and `height` should be close in value).
- Must not overlap denomination text, logos, or any important design element.
- Must have sufficient contrast with the surrounding background so the QR remains scannable.

---

## 6. Denomination Text

The denomination (e.g. `6.144 SATS`) is rendered by the app at the position you specify. You do not need to include any denomination text in your image — just leave space for it and note the coordinates.

**Rules:**
- Must not overlap the QR region.
- `fontSize` should be specified at your canvas resolution (e.g. `76` for a `1748 × 874` canvas).

---

## 7. Adding Your Design to the JSON

Open `public/json/designs.ts` and add a new entry to the `designs` array. Increment the `id` from the last existing entry.

```typescript
{
    id: 6,
    DesignName: "Your Design Name",
    frontPath: "YourDesignName/front.png",
    backPath: "YourDesignName/back.png",
    designer: "YourHandle",
    lnurl: "your@lightning.address",
    label: ["Community", "Regular"],
    qr: { // front design note qr alignment dimenstion
        x: 137,
        y: 132,
        width: 594,
        height: 589
    },
    backQr: { // back design note qr alignment dimenstion
        x: 283,
        y: 232,
        width: 369,
        height: 366
    },
    denomination: {
        x: 768,
        y: 392,
        fontSize: 78 
    },
    designSize: {
        width: 1748,
        height: 874
    }
}
```

### Available Labels

Pick 1–3 labels that best describe your design's intended use:

| Label | When to use |
|---|---|
| `"Community"` | General community use |
| `"Gifts"` | Gift-giving, presents |
| `"Event"` | Conferences, meetups, hackathons |
| `"Cypherpunk"` | Technical or privacy-focused aesthetic |
| `"Regular"` | Everyday payments |
| `"Other"` | Anything that does not fit the above |

---

## 8. JSON Field Reference

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique integer. Increment from the last entry. |
| `DesignName` | `string` | Human-readable name shown in the UI. |
| `frontPath` | `string` | Path to the front image relative to `public/designs/`. Case-sensitive. |
| `backPath` | `string` | Path to the back image relative to `public/designs/`. Case-sensitive. |
| `designer` | `string` | Your name or handle. Shown in the UI. |
| `lnurl` | `string?` | Your Lightning Address for the "Support Designer" tip button. Optional. |
| `label` | `Label[]` | Array of 1–3 labels from the allowed set. |
| `qr.x` | `number` | Left edge of the front QR region in canvas pixels (frame-relative). |
| `qr.y` | `number` | Top edge of the front QR region in canvas pixels (frame-relative). |
| `qr.width` | `number` | Width of the front QR region in canvas pixels. |
| `qr.height` | `number` | Height of the front QR region in canvas pixels. Should be close to `qr.width`. |
| `backQr.x` | `number` | Left edge of the back QR region in canvas pixels (frame-relative). |
| `backQr.y` | `number` | Top edge of the back QR region in canvas pixels (frame-relative). |
| `backQr.width` | `number` | Width of the back QR region in canvas pixels. |
| `backQr.height` | `number` | Height of the back QR region in canvas pixels. Should be close to `backQr.width`. |
| `denomination.x` | `number` | Left edge of the denomination text in canvas pixels (frame-relative). |
| `denomination.y` | `number` | Top edge of the denomination text in canvas pixels (frame-relative). |
| `denomination.fontSize` | `number` | Font size in canvas pixels at your `designSize` resolution. |
| `designSize.width` | `number` | Actual pixel width of your exported canvas. |
| `designSize.height` | `number` | Actual pixel height of your exported canvas. |

---

## 9. Verification Checklist

Before submitting your design, confirm each item:

**Canvas**
- [ ] Aspect ratio is exactly `2:1`
- [ ] The design image fills the entire frame (`X: 0, Y: 0`, full width and height)
- [ ] No elements extend outside the frame
- [ ] `designSize` in the JSON matches the actual exported pixel dimensions

**Files**
- [ ] `front.png` is exported from the frame at `1x` (or your chosen resolution)
- [ ] `back.png` is exported from the frame at `1x`
- [ ] Both files are placed in `public/designs/YourDesignName/`
- [ ] `frontPath` and `backPath` in the JSON match the folder and filenames exactly (case-sensitive)

**Coordinates**
- [ ] All coordinates were measured with the **frame selected first**, not the canvas
- [ ] `qr.width` and `qr.height` are similar in value (the QR region is roughly square)
- [ ] `backQr.width` and `backQr.height` are similar in value
- [ ] Denomination text does not overlap the QR region or important design elements
- [ ] `denomination.fontSize` is appropriate for your canvas resolution

**JSON**
- [ ] `id` is unique and incremented from the last entry
- [ ] At least 1 label is set
- [ ] `lnurl` is a valid Lightning Address, or omitted entirely

---

## 10. Example: Existing Design Entry

Here is a real entry from the designs file for reference:

```typescript
{
    id: 1,
    DesignName: "Vintage Ecash",
    frontPath: "Vintage/front.png",
    backPath: "Vintage/back.png",
    designer: "Harshdev098",
    lnurl: "denimkangroo19@primal.net",
    label: ["Community", "Regular"],
    qr: {
        x: 163,
        y: 182,
        width: 505,
        height: 500
    },
    backQr: {
        x: 283,
        y: 232,
        width: 369,
        height: 366
    },
    denomination: {
        x: 794,
        y: 396,
        fontSize: 76,
    },
    designSize: {
        height: 874,
        width: 1748,
    }
}
```

---

*To submit a design, open a pull request with your design files and JSON entry.*