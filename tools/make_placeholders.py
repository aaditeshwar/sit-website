#!/usr/bin/env python3
"""Generate labelled placeholder images (exact final dimensions) and a request manifest."""
import csv, math, os, random, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

REPO = sys.argv[1]
F = "/usr/share/fonts/truetype/google-fonts/"
def font(w, s):
    for n in ([f"Poppins-{w}.ttf"]):
        p = os.path.join(F, n)
        if os.path.exists(p):
            return ImageFont.truetype(p, s)
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)

RED, DARK, AMBER, TEAL = (194, 23, 23), (27, 27, 31), (232, 163, 61), (47, 125, 109)
AREA = {"ssd": (63, 125, 58), "ssc": (46, 94, 170), "hsc": (176, 58, 98), "src": (90, 70, 150)}

# path, w, h, used_on, brief, request_from, tint, safe_area
P = [
 ("banners/core-stack-hero.jpg", 1920, 800, "Home hero slide 1; /impact/core-stack hero",
  "Landscape photo: a community planning session or field team with a tablet in a rural landscape (watershed, waterbody, farms). People's faces visible, with consent.",
  "CoRE stack team (Prof. Aaditeshwar Seth)", RED, "hero"),
 ("impact/core-stack-card.jpg", 1200, 800, "Impact cards (home, /impact)",
  "Close-up: CoRE stack / Know Your Landscape map on a phone or tablet in the field, or a striking satellite-derived map.",
  "CoRE stack team", RED, "card"),
 ("banners/assistech-hero.jpg", 1920, 800, "Home hero slide 2; /impact/assistech hero",
  "A blind person using SmartCane on a street, or a student reading a tactile diagram or braille display.",
  "Assistech lab (Prof. P. V. M. Rao / Prof. Rohan Paul)", AREA["hsc"], "hero"),
 ("impact/assistech-card.jpg", 1200, 800, "Impact cards",
  "SmartCane, DotBook or a tactile STEM book in use; product shot acceptable.", "Assistech lab", AREA["hsc"], "card"),
 ("banners/gram-vaani-hero.jpg", 1920, 800, "/impact/gram-vaani hero",
  "Rural community members recording or listening on a basic mobile phone; a Mobile Vaani volunteer meeting.",
  "Gram Vaani team", AMBER, "hero"),
 ("impact/gram-vaani-card.jpg", 1200, 800, "Impact cards",
  "A person speaking into a feature phone, or a Mobile Vaani club meeting.", "Gram Vaani team", AMBER, "card"),
 ("banners/architecture-security-hero.jpg", 1920, 800, "/impact/architecture-and-security hero",
  "Lab photo: chip, FPGA or development board, students at a test bench; or a macro shot of silicon.",
  "MARG (Prof. Preeti Ranjan Panda) / SPRING (Prof. Vireshwar Kumar)", AREA["ssc"], "hero"),
 ("impact/architecture-security-card.jpg", 1200, 800, "Impact cards",
  "Board or chip close-up, or the security lab.", "MARG / SPRING", AREA["ssc"], "card"),
 ("banners/why-sit-hero.jpg", 1920, 800, "Home hero slide 4; /why-sit hero",
  "Students and faculty collaborating around a whiteboard or prototype; energetic, candid.", "SIT office / student photographers", TEAL, "hero"),
 ("banners/about-hero.jpg", 1920, 600, "/about hero", "The SIT building exterior, ideally golden hour, or the atrium with people.",
  "SIT office", DARK, "hero"),
 ("banners/impact-hero.jpg", 1920, 600, "/impact hero", "Montage-style field photo representing impact at scale (villages, users, devices).",
  "SIT office (can reuse flagship photos)", RED, "hero"),
 ("banners/impact-model.jpg", 1920, 600, "/about/how-we-create-impact hero",
  "Abstract or illustrative image of growth: a seedling to a tree, a lab to the field. An illustration is welcome.", "Website design team", TEAL, "hero"),
 ("banners/research-hero.jpg", 1920, 600, "/research hero", "Researchers at work in an SIT lab or in the field.", "SIT office", DARK, "hero"),
 ("banners/academics-hero.jpg", 1920, 600, "/academics hero", "Scholars in a seminar, lab or thesis defence.", "SIT office / students", DARK, "hero"),
 ("banners/research-fellows-hero.jpg", 1920, 600, "/academics/research-fellows hero", "A young researcher working with a mentor.", "SIT office", TEAL, "hero"),
 ("banners/area-ssd.jpg", 1600, 900, "Thrust area: Sustainability and social development (hero and tile)",
  "Rural landscape, water and community, or a satellite-derived landscape map.", "Thrust-area faculty", AREA["ssd"], "card"),
 ("banners/area-ssc.jpg", 1600, 900, "Thrust area: Sustainable and scalable computing", "Chips, data centres, microtubule microscopy, AR/VR design.",
  "Thrust-area faculty", AREA["ssc"], "card"),
 ("banners/area-hsc.jpg", 1600, 900, "Thrust area: Health and social care technologies", "Assistive devices, medical imaging with clinicians, public-health fieldwork.",
  "Thrust-area faculty", AREA["hsc"], "card"),
 ("banners/area-src.jpg", 1600, 900, "Thrust area: Safe and responsible computing", "Security lab, network equipment, abstract data-privacy visual.",
  "Thrust-area faculty", AREA["src"], "card"),
 ("site/og-card.jpg", 1200, 630, "Social sharing card (Open Graph)", "SIT logo + tagline 'Applied computing for transformative impact at scale' on brand background.",
  "Website design team", RED, "og"),
 ("site/facilities/lab-1.jpg", 1600, 1000, "/about/facilities gallery", "A laboratory in the SIT building.", "SIT office", DARK, "card"),
 ("site/facilities/lab-2.jpg", 1600, 1000, "/about/facilities gallery", "Shared compute or hardware lab.", "SIT office", DARK, "card"),
 ("site/facilities/seminar-room.jpg", 1600, 1000, "/about/facilities gallery", "SIT seminar room during an event.", "SIT office", DARK, "card"),
]

def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))

def make(path, w, h, used, brief, who, tint, safe):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):                       # diagonal gradient dark -> tint
        for x in range(0, w, 4):
            t = min(1, max(0, (x / w) * 0.75 + (1 - y / h) * 0.35))
            c = mix(DARK, tint, t * 0.85)
            for k in range(4):
                if x + k < w:
                    px[x + k, y] = c
    d = ImageDraw.Draw(img, "RGBA")
    rnd = random.Random(path)                # deterministic contour lines
    cx, cy = rnd.uniform(0.55, 0.85) * w, rnd.uniform(0.2, 0.6) * h
    for r in range(40, int(max(w, h) * 1.2), 38):
        wob = [(cx + (r + 14 * math.sin(a * 5 + r / 60)) * math.cos(a),
                cy + (r + 14 * math.cos(a * 4 + r / 50)) * math.sin(a) * 0.75) for a in [i * math.pi / 90 for i in range(181)]]
        d.line(wob, fill=(255, 255, 255, 26), width=2)
    m = int(min(w, h) * 0.06)
    if safe == "hero":                        # where the title / CTA overlay will sit
        d.rectangle([m, int(h * 0.48), int(w * 0.55), h - m], outline=(255, 255, 255, 110), width=3)
        d.text((m + 16, int(h * 0.48) + 12), "TEXT OVERLAY AREA — keep subject out of this box", font=font("Medium", max(16, h // 40)), fill=(255, 255, 255, 170))
    d.rectangle([4, 4, w - 5, h - 5], outline=(255, 255, 255, 90), width=4)
    s = min(w / 1920, h / 800) if safe == "hero" else min(w / 1200, h / 800)
    x0, y = (int(w * 0.6) if safe == "hero" else m), m
    tw = (w - x0 - m)
    d.text((x0, y), "PLACEHOLDER", font=font("Bold", int(64 * s)), fill=(255, 255, 255, 235)); y += int(80 * s)
    d.text((x0, y), f"{w} × {h} px  ·  JPG  ·  landscape", font=font("Medium", int(30 * s)), fill=(255, 255, 255, 220)); y += int(52 * s)
    d.text((x0, y), path, font=font("Regular", int(24 * s)), fill=(255, 210, 120, 255)); y += int(46 * s)
    f = font("Regular", int(24 * s))
    cpl = max(20, int(tw / (f.size * 0.55)))
    for label, txt in (("Used on", used), ("We need", brief), ("Request from", who)):
        d.text((x0, y), label.upper(), font=font("Bold", int(18 * s)), fill=(255, 255, 255, 170)); y += int(26 * s)
        for line in textwrap.wrap(txt, cpl):
            d.text((x0, y), line, font=f, fill=(255, 255, 255, 235)); y += int(32 * s)
        y += int(12 * s)
    out = os.path.join(REPO, "assets/images", path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "JPEG", quality=82, optimize=True, progressive=True)

rows = []
for p in P:
    make(*p)
    rows.append({"path": f"images/{p[0]}", "width": p[1], "height": p[2], "used_on": p[3], "brief": p[4],
                 "request_from": p[5], "status": "placeholder"})
with open(os.path.join(REPO, "assets/images/PLACEHOLDERS.csv"), "w", newline="", encoding="utf8") as fh:
    wr = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); wr.writeheader(); wr.writerows(rows)
print(len(rows), "placeholders")
