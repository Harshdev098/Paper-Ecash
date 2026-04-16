# PaperEcash — Designer Contribution Guide

> **This guide is for designers who want to add new note designs to PaperEcash.**
> Read it fully before opening Figma. The QR code and denomination text alignment
> depends entirely on the values you measure here — if they are off, the printed
> notes will look misaligned.

---

## 1. Canvas Specification

All designs **must** use the following canvas dimensions. Do not use any other size.

| Property | Value |
|---|---|
| **Width** | `1748 px` |
| **Height** | `874 px` |
| **Aspect Ratio** | `2 : 1` (exactly) |

These dimensions map to a physical **3.5 × 1.75 inch** card at 500 DPI — the standard size for a physical cash note card.

> **Why fixed dimensions?**
> The renderer uses `FIGMA_DESIGN_WIDTH = 1748` and `FIGMA_DESIGN_HEIGHT = 874`
> as the coordinate reference for all designs. If your canvas is a different size,
> every coordinate you measure will be wrong and the QR/text will be misaligned.
> WIP for getting a natural size dimenstions instead of hardcoded one.

---

## 2. Required Deliverables

For each design you contribute, you must provide:

- [ ] **`YourDesignName.png`** — the exported note image (see §6 for exact export settings)
- [ ] **JSON entry** — filled into `public/designs/json/designs.ts` (see §7)
- [ ] **QR placeholder coordinates** — `x`, `y`, `width`, `height` (see §4)
- [ ] **Denomination text coordinates** — `x`, `y`, `fontSize` (see §5)


### File Naming

Name the file exactly as you will reference it in the JSON `path` field:

```
VintageEcash.png   ✅
vintage_ecash.png  ✅ (but must match path field exactly)
My Design v2.png   ❌
```

Place the exported file in:

```
public/designs/YourDesignName.png
```

---

## 7. Adding Your Design to the JSON

Open `public/designs/json/designs.ts` and add a new entry to the `designs` array:

```typescript
{
    id: 6,                          // increment from last id
    DesignName: "Your Design Name",
    path: "YourDesignName.png",     // must match filename in public/designs/images/
    designer: "YourHandle",         // your name or handle
    lnurl: "your@lnurl.com",       // your lightning address for tips (optional)
    label: ["Community", "Regular"], // pick from the label list below
    qr: {
        x: 137,
        y: 132,
        width: 594,
        height: 589
    },
    denomination: {
        x: 768,
        y: 392,
        fontSize: 78
    }
}
```

### Available Labels

Pick 1–3 labels that best describe your design's intended use:

```
"Community"   — general community use
"Gifts"       — gift-giving, presents
"Event"       — conferences, meetups, hackathons
"Cypherpunk"  — technical, privacy-focused aesthetic
"Regular"     — everyday payments
"Other"       — anything that doesn't fit above
```

---

## 8. JSON Field Reference

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique integer. Increment from the last entry. |
| `DesignName` | `string` | Human-readable name shown in the UI. |
| `path` | `string` | Filename of the PNG in `public/designs/`. Case-sensitive. |
| `designer` | `string` | Your name or handle. Shown in the UI. |
| `lnurl` | `string` | Your Lightning Address for the "Support Designer" tip button. |
| `label` | `Label[]` | Array of labels from the allowed set. |
| `qr.x` | `number` | Left edge of QR slot in Figma pixels (frame-relative). |
| `qr.y` | `number` | Top edge of QR slot in Figma pixels (frame-relative). |
| `qr.width` | `number` | Width of QR slot in Figma pixels. |
| `qr.height` | `number` | Height of QR slot in Figma pixels. |
| `denomination.x` | `number` | Left edge of denomination text in Figma pixels (frame-relative). |
| `denomination.y` | `number` | Top edge of denomination text in Figma pixels (frame-relative). |
| `denomination.fontSize` | `number` | Font size in Figma pixels at 1748×874 canvas. |

---

## 9. Verification Checklist

Before submitting your design, confirm each item:

**Canvas**
- [ ] Frame is exactly `1748 × 874 px`
- [ ] Design image is positioned at `X: 0, Y: 0, W: 1748, H: 874`
- [ ] No elements extend outside the frame

**Coordinates**
- [ ] QR coordinates were read with the **Frame selected first**, not canvas
- [ ] Denomination coordinates were read with the **Frame selected first**
- [ ] `qr.width` and `qr.height` are similar in value (roughly square)
- [ ] `denomination.y` is positioned so text does not overlap QR or important design elements

**Export**
- [ ] Exported from the **Frame** at `1x PNG`
- [ ] File is placed in `public/designs/`
- [ ] `path` in JSON matches the filename exactly (case-sensitive)

**JSON**
- [ ] `id` is unique and incremented from the last entry
- [ ] At least 1 label is set
- [ ] `lnurl` is a valid Lightning Address or empty string

Here's a [Figma Guide](./FigmaGuide.md) to get the correct aligned coordinates

---

*To submit a design, open a pull request*
