#!/usr/bin/env python3
"""Convert the raw sit.iitd.ac.in mirror into an organised markdown/CSV/image archive."""
import csv, json, os, re, shutil, sys
from urllib.parse import urlparse, unquote, urljoin, quote
from bs4 import BeautifulSoup, Comment
from markdownify import markdownify as md

RAW = sys.argv[1]            # .../sit_scrape
OUT = sys.argv[2]            # output archive dir
SITE = "https://sit.iitd.ac.in"
manifest = json.load(open(os.path.join(RAW, "manifest.json"), encoding="utf8"))

if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

def norm(u):
    p = urlparse(u)
    path = quote(unquote(p.path or "/"), safe="/%:@&=+$,;~!*'()")
    host = p.netloc.lower()
    scheme = "https" if host == "sit.iitd.ac.in" else p.scheme
    return f"{scheme}://{host}{path}" + (f"?{p.query}" if p.query else "")

def raw_file(url):
    e = manifest.get(norm(url))
    if e and e.get("file"):
        return os.path.join(RAW, e["file"])
    return None

def slugify(s):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s[:70] or "item"

def relpath(from_file, to_file):
    return os.path.relpath(to_file, os.path.dirname(from_file)).replace(os.sep, "/")

# ------------------------------------------------------------------ page map
PAGE_MAP = {
    "/": ("pages/home.md", "Home"),
    "/frontend/vision": ("pages/about/vision.md", "About > Vision"),
    "/people": ("pages/people/index.md", "People"),
    "/research": ("pages/research/index.md", "Research"),
    "/show-news/53": ("pages/research/areas/sustainability-and-social-development.md", "Research > Sustainability and Social Development"),
    "/show-news/54": ("pages/research/areas/sustainable-and-scalable-computing.md", "Research > Sustainable and Scalable Computing"),
    "/show-news/55": ("pages/research/areas/health-and-social-care-technologies.md", "Research > Health and Social Care Technologies"),
    "/show-news/56": ("pages/research/areas/safe-and-responsible-computing.md", "Research > Safe and Responsible Computing"),
    "/phd": ("pages/academics/programmes/phd.md", "Academics > Degree Programs > PhD Program"),
    "/msr": ("pages/academics/programmes/ms-research.md", "Academics > Degree Programs > MS (by Research) Program"),
    "/mtechcs": ("pages/academics/programmes/mtech-cybersecurity.md", "Academics > Degree Programs > M.Tech. in Cybersecurity"),
    "/show-news/47": ("pages/academics/research-fellows.md", "Academics > Research fellows"),
    "/show-news/57": ("pages/academics/ongoing-projects/sustainability-and-social-development.md", "Academics > Ongoing Projects > Computing for Sustainability and Social Development"),
    "/show-news/58": ("pages/academics/ongoing-projects/sustainable-and-scalable-computing.md", "Academics > Ongoing Projects > Sustainable and Scalable Computing"),
    "/show-news/59": ("pages/academics/ongoing-projects/health-and-social-care-technologies.md", "Academics > Ongoing Projects > Health and Social Care Technologies"),
    "/show-news/60": ("pages/academics/ongoing-projects/safe-and-responsible-computing.md", "Academics > Ongoing Projects > Safe and Responsible Computing"),
    "/admission": ("pages/admissions/latest-admissions-info.md", "Academics > Admissions > Latest Admissions Info"),
    "/how": ("pages/admissions/how-to-apply.md", "Academics > Admissions > How to Apply"),
    "/courses": ("pages/academics/courses.md", "Footer > Courses (not in main menu)"),
    "/show-news/63": ("pages/coe/r-systems-coe.md", "CoE > R-Systems CoE"),
    "/contact": ("pages/contact.md", "Contact"),
}
PEOPLE_PAGES = {"/faculty": "faculty", "/students": "students", "/alumni": "alumni",
                "/adminstaff": "admin-staff", "/researchstaff": "research-staff"}

PLACEHOLDER_NEWS = {2, 3, 4, 5, 17, 18, 19, 20, 21, 22, 26, 27, 28, 29, 30, 31, 37, 38, 44, 45,
                    51, 52, 61, 62, 66, 67, 68, 69, 70}
NEWS_KIND = {  # rough categorisation of the real items
    **{i: "achievement" for i in (6, 7, 10, 11, 12, 13, 14, 15, 23, 25, 32)},
    **{i: "admissions-notice" for i in (16, 24, 33, 34, 40, 71, 73, 74)},
    **{i: "event" for i in (35, 42, 65, 72)},
    **{i: "opportunity" for i in (36, 39, 43, 46, 48, 64)},
    **{i: "announcement" for i in (8, 9, 49, 50)},
}

# url path -> new md path (for internal link rewriting); news filled later
LINK_MAP = {SITE + k if k != "/" else SITE + "/": v[0] for k, v in PAGE_MAP.items()}
for k, v in PEOPLE_PAGES.items():
    LINK_MAP[SITE + k] = f"pages/people/{v}.md"

# ------------------------------------------------------------------ assets
asset_log = []          # (original_url, local_path or 'linked-to-origin', used_in)
copied = {}

def local_asset(url, category, name_hint=None):
    """Copy an asset into images/ or documents/ and return its archive path (or None)."""
    nurl = norm(url)
    if nurl in copied:
        return copied[nurl]
    src = raw_file(nurl)
    if not src or not os.path.exists(src):
        return None
    base = os.path.basename(unquote(urlparse(nurl).path))
    base = re.sub(r"__[0-9a-f]{8}$", "", base)
    stem, ext = os.path.splitext(base)
    if not ext:
        head = open(src, "rb").read(16)
        ext = (".png" if head.startswith(b"\x89PNG") else ".jpg" if head[:3] == b"\xff\xd8\xff" else
               ".gif" if head[:4] == b"GIF8" else ".webp" if head[8:12] == b"WEBP" else ".bin")
    stem = slugify(name_hint or re.sub(r"_\d{10}$", "", stem))
    dest_rel = f"{category}/{stem}{ext.lower()}"
    i = 2
    while os.path.exists(os.path.join(OUT, dest_rel)):
        dest_rel = f"{category}/{stem}-{i}{ext.lower()}"
        i += 1
    os.makedirs(os.path.dirname(os.path.join(OUT, dest_rel)), exist_ok=True)
    shutil.copy2(src, os.path.join(OUT, dest_rel))
    copied[nurl] = dest_rel
    return dest_rel

LOCAL_IMG_HOSTS = {"sit.iitd.ac.in", "lh7-rt.googleusercontent.com"}   # SIT content images (Google-doc images expire)
LOCAL_DOC_HOSTS = {"sit.iitd.ac.in"}

# ------------------------------------------------------------------ html -> md
def content_sections(soup):
    for t in soup(["script", "style", "noscript", "iframe"]):
        t.decompose()
    for c in soup.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    wrapper = soup.select_one("div.wrapper") or soup.body
    secs = []
    for sec in wrapper.find_all("section", recursive=False):
        cls = set(sec.get("class", []))
        if cls & {"page-title", "contact-box", "google-map", "menu-list-items"}:
            continue
        for junk in sec.select("section.contact-box, section.google-map, footer, div.back-to-top, #back-to-top, a.top"):
            junk.decompose()
        secs.append(sec)
    return secs

def rewrite_dom(nodes, md_path, used_in, img_category):
    n_img = 0
    for node in nodes:
        for img in node.find_all("img"):
            src = img.get("src") or ""
            full = norm(urljoin(SITE + "/", src.strip()))
            host = urlparse(full).netloc
            if "pre-loader" in full:
                img.decompose(); continue
            if host in LOCAL_IMG_HOSTS:
                n_img += 1
                hint = f"{os.path.splitext(os.path.basename(md_path))[0]}-{n_img}" if host != "sit.iitd.ac.in" or "uploads" in full else None
                loc = local_asset(full, img_category, hint)
                if loc:
                    img["src"] = relpath(md_path, os.path.join(OUT, loc).replace(OUT + "/", ""))
                    asset_log.append((full, loc, used_in))
                    continue
            img["src"] = full
            asset_log.append((full, "linked-to-origin (missing or external)", used_in))
        for a in node.find_all("a"):
            href = (a.get("href") or "").strip()
            if href.startswith(("javascript:", "#")) or not href:
                a.unwrap()
                continue
            if href.startswith(("mailto:", "tel:")):
                continue
            full = norm(urljoin(SITE + "/", href))
            if full.rstrip("/") + ("/" if full.endswith(".in") else "") in LINK_MAP or full in LINK_MAP:
                target = LINK_MAP.get(full) or LINK_MAP.get(full.rstrip("/"))
                a["href"] = relpath(md_path, target)
            elif urlparse(full).netloc in LOCAL_DOC_HOSTS and "/public/storage/uploads/" in full:
                loc = local_asset(full, "documents")
                a["href"] = relpath(md_path, loc) if loc else full
                asset_log.append((full, loc or "missing", used_in))
            else:
                a["href"] = full      # everything on other domains: link to origin

def to_md(nodes):
    text = "\n\n".join(md(str(n), heading_style="ATX", bullets="-") for n in nodes)
    text = text.replace("\xa0", " ")
    text = re.sub(r"^\s*\[?TOP\]?(\(#top\))?\s*$", "", text, flags=re.M)
    text = re.sub(r"^#{1,6}\s*$", "", text, flags=re.M)          # empty headings
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"

def page_title(soup):
    h = soup.select_one("section.page-title h1, section.page-title h2, section.page-title .page-title-name")
    return h.get_text(" ", strip=True) if h else ""

def frontmatter(**kw):
    lines = ["---"]
    for k, v in kw.items():
        if v is None:
            continue
        v = str(v).replace('"', "'")
        lines.append(f'{k}: "{v}"')
    lines.append("---\n")
    return "\n".join(lines)

def write(rel, content):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf8") as f:
        f.write(content)

def load(path_key):
    f = raw_file(SITE + path_key if path_key != "/" else SITE + "/")
    return BeautifulSoup(open(f, encoding="utf8").read(), "lxml") if f else None

BROCHURE = norm(SITE + "/public/storage/uploads/placement/SIT Brochure 2023-24_updated_1688555498.pdf")
_b = local_asset(BROCHURE, "documents", "sit-brochure-2023-24")
if _b:
    LINK_MAP[BROCHURE] = _b

# ------------------------------------------------------------------ news map first (for link rewriting)
news_items = {}
for u, e in manifest.items():
    m = re.match(r"https://sit\.iitd\.ac\.in/show-news/(\d+)$", u)
    if m and e.get("file") and f"/show-news/{m.group(1)}" not in PAGE_MAP:
        nid = int(m.group(1))
        soup = BeautifulSoup(open(os.path.join(RAW, e["file"]), encoding="utf8").read(), "lxml")
        secs = content_sections(soup)
        h = secs[0].find("h3") if secs else None
        title = h.get_text(" ", strip=True) if h else f"news-{nid}"
        folder = "news/_placeholders-and-tests" if nid in PLACEHOLDER_NEWS else "news"
        rel = f"{folder}/{nid:03d}-{slugify(title)}.md"
        news_items[nid] = (rel, title, u)
        LINK_MAP[u] = rel

# ------------------------------------------------------------------ regular pages
page_index = []
for key, (rel, nav) in PAGE_MAP.items():
    soup = load(key)
    if soup is None:
        print("missing", key)
        continue
    secs = content_sections(soup)
    title = page_title(soup) or nav.split(" > ")[-1]
    if key.startswith("/show-news/") and secs and secs[0].find("h3"):
        title = secs[0].find("h3").get_text(" ", strip=True)
    img_cat = "images/research" if ("research" in rel or "projects" in rel or "coe" in rel) else "images/site"
    rewrite_dom(secs, rel, rel, img_cat)
    body = to_md(secs)
    # first h3 duplicating the title (show-news pages) -> h1
    body = re.sub(r"^### (.+)\n", r"# \1\n", body, count=1) if body.startswith("### ") else f"# {title}\n\n" + body
    empty = len(re.sub(r"[#\s]", "", body.split("\n", 1)[-1])) < 5
    fm = frontmatter(title=title, source_url=SITE + (key if key != "/" else "/"), original_nav=nav,
                     status="EMPTY ON LIVE SITE" if empty else "scraped")
    if empty:
        body += "\n> *This page has no content on the live site (it only shows a title).* \n"
    write(rel, fm + body)
    page_index.append((nav, rel, SITE + key, "empty" if empty else "ok"))

# ------------------------------------------------------------------ news
for nid, (rel, title, url) in sorted(news_items.items()):
    soup = BeautifulSoup(open(raw_file(url), encoding="utf8").read(), "lxml")
    secs = content_sections(soup)
    rewrite_dom(secs, rel, rel, "images/news")
    body = to_md(secs)
    body = re.sub(r"^### (.+)\n", r"# \1\n", body, count=1)
    kind = "placeholder/test" if nid in PLACEHOLDER_NEWS else NEWS_KIND.get(nid, "news")
    fm = frontmatter(id=nid, title=title, category=kind, date="UNKNOWN (live site does not show dates)",
                     source_url=url)
    write(rel, fm + body)

# ------------------------------------------------------------------ people (CSV + generated md)
def people_cards(soup):
    groups = []
    for sec in content_sections(soup):
        h2 = sec.find("h2")
        group = h2.get_text(" ", strip=True) if h2 else ""
        cards = sec.select("div.team")
        if not cards:
            continue
        groups.append((group, cards))
    return groups

people_summary = {}
for key, name in PEOPLE_PAGES.items():
    soup = load(key)
    rows = []
    for group, cards in people_cards(soup) if soup else []:
        for c in cards:
            h5 = c.find("h5")
            a = h5.find("a") if h5 else None
            pname = h5.get_text(" ", strip=True) if h5 else ""
            link = a.get("href", "").strip() if a else ""
            if link.startswith("javascript"):
                link = ""
            span = c.find("span")
            desc = re.sub(r"\s+", " ", span.get_text(" ", strip=True)) if span else ""
            img = c.find("img")
            photo, photo_src = "", ""
            if img and img.get("src"):
                photo_src = norm(urljoin(SITE + "/", img["src"].strip()))
                if "BLANK" not in photo_src.upper() and "noimage" not in photo_src:
                    photo = local_asset(photo_src, f"images/people/{name}", pname) or ""
            GROUPS = {"PHD": "PhD", "MS(RESEARCH )": "MS (Research)", "PHD STUDENTS": "PhD Students",
                      "M.S. RESEARCH STUDENTS": "MS (Research) Students"}
            row = {"group": GROUPS.get(group.upper().strip(), group), "name": pname, "profile_url": link}
            if name == "faculty":
                m = re.match(r"\s*(Ph\.?\s?D\.?\s*\([^)]*\))\s*(.*)", desc)
                row["degree"] = m.group(1) if m else ""
                row["research_interests"] = m.group(2) if m else desc
            elif name == "alumni":
                m = re.match(r"(.*)\((\d{4})\)\s*$", pname)
                row["name"] = m.group(1).strip() if m else pname
                row["year"] = m.group(2) if m else ""
                row["thesis_or_area"] = re.sub(r"^Title:\s*", "", desc)
            elif name == "admin-staff":
                row["designation"] = desc
            else:
                row["research_interests"] = desc
            row["photo"] = photo
            row["photo_original_url"] = photo_src
            rows.append(row)
    people_summary[name] = rows
    if rows:
        os.makedirs(os.path.join(OUT, "data/people"), exist_ok=True)
        with open(os.path.join(OUT, f"data/people/{name}.csv"), "w", newline="", encoding="utf8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader(); w.writerows(rows)
    # generated markdown for easy browsing
    rel = f"pages/people/{name}.md"
    title = page_title(soup) if soup else name
    out = [frontmatter(title=title, source_url=SITE + key, original_nav=f"People > {title}",
                       status="generated from data/people/" + name + ".csv" if rows else "EMPTY ON LIVE SITE"),
           f"# {title}\n"]
    if not rows:
        out.append("> *This page has no content on the live site.*\n")
    cur = None
    for r in rows:
        if r["group"] != cur:
            cur = r["group"]
            out.append(f"\n## {cur}\n" if cur else "")
        pic = f"![{r['name']}]({relpath(rel, r['photo'])}) " if r.get("photo") else ""
        nm = f"[{r['name']}]({r['profile_url']})" if r["profile_url"] else r["name"]
        extra = " — ".join(x for x in [r.get("degree"), r.get("research_interests"), r.get("designation"),
                                        (r.get("year") and f"{r['year']}: {r.get('thesis_or_area','')}")] if x)
        out.append(f"- {pic}**{nm}** {('— ' + extra) if extra else ''}")
    write(rel, "\n".join(out) + "\n")
    page_index.append((f"People > {title}", rel, SITE + key, f"{len(rows)} entries" if rows else "empty"))

# ------------------------------------------------------------------ navigation (site map incl. hidden items)
idx_html = open(raw_file(SITE + "/"), encoding="utf8").read()
soup = BeautifulSoup(idx_html, "lxml")
nav = soup.select_one("ul.menu-links") or soup.select_one("nav.mega-menu")

def walk(ul, depth=0):
    lines = []
    for li in ul.find_all("li", recursive=False):
        a = li.find("a", recursive=False)
        label = a.get_text(" ", strip=True) if a else li.get_text(" ", strip=True)[:40]
        href = (a.get("href") or "").strip() if a else ""
        tgt = LINK_MAP.get(norm(urljoin(SITE + "/", href))) if href and not href.startswith(("#", "javascript")) else None
        loc = f" → `{tgt}`" if tgt else (f" → {href}" if href and not href.startswith(("#", "javascript")) else "")
        lines.append("  " * depth + f"- **{label}**{loc}")
        for sub in li.find_all("ul", recursive=False):
            lines += walk(sub, depth + 1)
        for div in li.find_all("div", recursive=False):
            for sub in div.find_all("ul", recursive=False):
                lines += walk(sub, depth + 1)
    return lines

nav_lines = walk(nav) if nav else ["(menu not found)"]
nav_lines = [l.replace("- ****", "- **(logo)**") for l in nav_lines]
nav_lines.append("  - **R-Systems CoE** → `pages/coe/r-systems-coe.md`  *(sits under CoE; malformed HTML on live site)*")
nav_lines.append("- **Contact** → `pages/contact.md`")
hidden = re.findall(r'<!--\s*<li><a href="([^"]+)">([^<]+)</a></li>\s*-->', idx_html)
topbar = [(a.get_text(" ", strip=True), a.get("href")) for a in soup.select("div.topbar a") if a.get_text(strip=True)]
foot = BeautifulSoup(idx_html, "lxml").select_one("footer")
footer_md = md(str(foot), heading_style="ATX", bullets="-") if foot else ""
footer_md = re.sub(r"\n{3,}", "\n\n", footer_md.replace("\xa0", " "))

sm = ["# Site map of the current sit.iitd.ac.in (as scraped on 23 Oct 2026)\n",
      "## Top bar\n"] + [f"- {t} → {h}" for t, h in topbar] + \
     ["\n## Main menu (hierarchy preserved)\n"] + nav_lines + \
     ["\n## Menu items commented out in the HTML (hidden on live site)\n"] + \
     [f"- {t} → {LINK_MAP.get(norm(h), h)}" for h, t in hidden] + \
     ["\n## Footer (verbatim)\n", footer_md]
write("site-map.md", "\n".join(sm) + "\n")

# ------------------------------------------------------------------ site chrome images, logos, theme CSS
chrome = {
    "images/logos/sit-website-logo.png": "/public/frontend/images/sit-website-logo.png",
    "images/logos/favicon.ico": "/public/frontend/images/favicon.ico",
    "images/site/home-slider-1.jpg": "/public/frontend/images/home-slider/1.jpg",
    "images/site/icons/people-faculty.png": "/public/frontend/images/about/faculty.png",
    "images/site/icons/people-students.png": "/public/frontend/images/about/humanities-social-science.png",
    "images/site/icons/people-research-staff.png": "/public/frontend/images/about/research.png",
    "images/site/icons/people-alumni.png": "/public/frontend/images/about/alumni.png",
    "images/site/icons/people-advisory-board.png": "/public/frontend/images/about/governers.png",
    "images/site/icons/people-admin-staff.png": "/public/frontend/images/about/admin.png",
}
for dest, src in chrome.items():
    f = raw_file(SITE + src)
    if f:
        os.makedirs(os.path.dirname(os.path.join(OUT, dest)), exist_ok=True)
        # if already copied under another name, move it to the canonical name
        prev = copied.get(norm(SITE + src))
        if prev and os.path.exists(os.path.join(OUT, prev)) and prev != dest:
            os.remove(os.path.join(OUT, prev))
            for root, _, files in os.walk(os.path.join(OUT, "pages")):
                for fn in files:
                    p = os.path.join(root, fn)
                    t = open(p, encoding="utf8").read()
                    if os.path.basename(prev) in t:
                        t = t.replace(relpath(os.path.relpath(p, OUT), prev), relpath(os.path.relpath(p, OUT), dest))
                        open(p, "w", encoding="utf8").write(t)
        shutil.copy2(f, os.path.join(OUT, dest))
        copied[norm(SITE + src)] = dest

css_src = os.path.join(RAW, "assets/sit.iitd.ac.in/public/frontend/css")
css_dst = os.path.join(OUT, "styles/original-css")
os.makedirs(css_dst, exist_ok=True)
for fn in ["style.css", "typography.css", "ps.css", "responsive.css", "skins/skin-iitd.css",
           "shortcodes/team.css", "shortcodes/page-title.css", "shortcodes/section-title.css"]:
    p = os.path.join(css_src, fn)
    if os.path.exists(p):
        shutil.copy2(p, os.path.join(css_dst, fn.replace("/", "__")))

write("styles/design-tokens.md", """# Design tokens extracted from the current site CSS

Source files are copied in `original-css/` (theme: a commercial Bootstrap 4 template "Webster",
re-skinned for IIT Delhi). Only the SIT-specific choices are worth carrying forward.

| Token | Value | Where it comes from |
|---|---|---|
| Primary / brand red | `#C21717` | `skin-iitd.css` – buttons, links, theme backgrounds, selection |
| Primary (darker variant) | `#BC1518` | `skin-iitd.css` |
| Secondary accent (green) | `#84BA3F` | `typography.css`, `ps.css` – template default, barely used |
| Heading text | `#363636` | `typography.css` |
| Body text | `#626262` | `typography.css` |
| Dark backgrounds (footer/map) | `#323232` / black | `skin-iitd.css`, `.black-bg` |
| Light background | `#ECEFF8`, `.gray-bg` | `typography.css` |
| Body font | **Poppins**, 14px | Google Fonts |
| Heading font | **Montserrat** | Google Fonts |
| Display / menu font | **Dosis** | Google Fonts |

Logo: `images/logos/sit-website-logo.png` (455×120 PNG, transparent). Favicon: `images/logos/favicon.ico` (16×16 only —
a higher-resolution favicon/SVG logo should be requested from the School for the new site).
""")

# ------------------------------------------------------------------ external documents referenced (linked, not copied)
ext_docs = sorted({(u, e.get("content_type", "")) for u, e in manifest.items()
                   if e.get("kind") == "asset" and e.get("status") == 200
                   and urlparse(u).netloc not in ("sit.iitd.ac.in", "fonts.googleapis.com", "fonts.gstatic.com",
                                                  "lh7-rt.googleusercontent.com", "ird.iitd.ac.in")})
ext_links = sorted(u for u, e in manifest.items() if e.get("kind") == "external-link")

# ------------------------------------------------------------------ README / inventory
n_news = sum(1 for i in news_items if i not in PLACEHOLDER_NEWS)
lines = [
"# sit.iitd.ac.in — scraped content archive",
"",
"Scraped from the live site on **23 Oct 2026** (raw mirror produced by `sit_scrape.py`, converted by `tools/build_archive.py`).",
"Every file carries the `source_url` it came from in its front-matter.",
"",
"## Layout",
"",
"```",
"site-map.md                 navigation hierarchy (top bar, mega-menu, hidden menu items, footer)",
"pages/                      one markdown file per page, foldered by the current menu hierarchy",
"  home.md, contact.md",
"  about/ people/ research/areas/ academics/{programmes,ongoing-projects}/ admissions/ coe/",
"news/                       real news/notices (show-news/N pages that are not menu pages)",
"  _placeholders-and-tests/  test, duplicate, 'DRAFT', 'Coming soon' and stub items (not for migration)",
"data/people/*.csv           faculty, students, alumni, admin staff — structured, one row per person",
"images/logos/               logo + favicon",
"images/people/<group>/      portraits, renamed to the person's name",
"images/research/            figures embedded in research-area pages",
"images/site/                home banner, people-section icons",
"documents/                  PDFs hosted on sit.iitd.ac.in itself (brochure)",
"styles/                     design tokens + the SIT-specific original CSS",
"```",
"",
"Linking policy: images and documents hosted **on sit.iitd.ac.in** are stored locally. Figures on research pages",
"were pasted from Google Docs and live on `lh7-rt.googleusercontent.com` with expiring keys, so they are also stored",
"locally. **Everything on other domains (owncloud, faculty home pages, core-stack.org, IRD, manage.iitd.ac.in, csia…)",
"is linked to its origin URL**, not downloaded.",
"",
"## Page inventory",
"",
"| Current menu location | Archive file | Source | Status |",
"|---|---|---|---|",
] + [f"| {n} | `{r}` | {u} | {s} |" for n, r, u, s in page_index] + [
"",
f"## News: {n_news} real items, {len(PLACEHOLDER_NEWS & set(news_items))} placeholders/tests",
"",
"| id | category | title | file |", "|---|---|---|---|",
] + [f"| {i} | {('placeholder' if i in PLACEHOLDER_NEWS else NEWS_KIND.get(i,'news'))} | {t} | `{r}` |"
     for i, (r, t, u) in sorted(news_items.items())] + [
"",
"## People data",
"",
] + [f"- `data/people/{k}.csv`: {len(v)} rows" + (f" (groups: {', '.join(sorted({r['group'] for r in v if r['group']}))})" if v else " — page empty on live site")
     for k, v in people_summary.items()] + [
"",
"## Issues noticed on the live site (worth fixing in the new site)",
"",
"- `Research` landing page, `Research Staff` page and the home-page *News & Announcements* carousel are **empty**.",
"- *Advisory Board* tile on the People page links nowhere; there is no advisory-board content anywhere.",
"- News pages carry **no dates** (the publish-date line is commented out), so chronology is lost; ids give rough order only.",
"- ~30 `show-news` entries are tests ('Volga-Dnepr Group…', 'TEST'), duplicates, 'DRAFT' or 'Coming soon' stubs.",
"- Research-fellow announcement exists in 4 near-identical copies (ids 43, 47, 48, 64).",
"- Contact email differs between Contact page (`rajeshk@cse.iitd.ernet.in`) and footer (`eoaesit[@]admin.iitd.ernet.in`); old `ernet.in` domains throughout.",
"- Head of School appears twice on the Faculty page (as Head and as Joint Faculty) with different profile links.",
"- Several alumni have placeholder images (`BLANK_*.jpg`) or broken image paths; these were skipped.",
"- Footer copyright says 2020; brochure is 2023-24; courses list mixes 1-credit special modules with retired courses.",
"- Many key documents (admission criteria, shortlists, R-Systems CoE project descriptions, research summaries) sit behind owncloud links rather than on the site.",
"- Research-area figures are hot-linked from Google Docs (`lh7-rt.googleusercontent.com`) and will eventually break.",
"",
f"## External documents linked from the site ({len(ext_docs)}) — kept as origin links",
"",
] + [f"- {u}" for u, _ in ext_docs] + [
"",
f"## All outbound links found ({len(ext_links)})",
"",
"<details><summary>expand</summary>",
"",
] + [f"- {u}" for u in ext_links] + ["", "</details>", ""]
write("README.md", "\n".join(lines))

with open(os.path.join(OUT, "data/asset-map.csv"), "w", newline="", encoding="utf8") as f:
    w = csv.writer(f); w.writerow(["original_url", "archive_path", "used_in"])
    for row in sorted(set(asset_log)):
        w.writerow(row)
print("done", len(page_index), "pages,", len(news_items), "news,", len(copied), "assets copied")
