# plan.md — Build the new sit.iitd.ac.in

**Audience:** Cursor (or any developer) implementing the website.
**Inputs:** this repository: `content/` (markdown), `data/` (CSV), `assets/` (images and documents), `forms/` (Google Forms spec).
**Output:** a fast, modern, statically pre-rendered React site deployed to IIT Delhi's **Apache** server at `https://sit.iitd.ac.in`, where all content is edited as markdown and CSV, and regular updates (news, projects, events, openings, alumni) arrive from Google Forms.

Read §1–§4 fully before writing code. Implement in the milestone order in §13. Each milestone has acceptance criteria.

---

## 0. Guiding principles

1. **Content and code are separate.** Nobody should need to touch React to change text, add a project or publish news. Every visible string except UI chrome ("Read more", "Filter") comes from `content/` or `data/`.
2. **Static output.** The build produces plain HTML/CSS/JS files that Apache serves directly. There is no server runtime, no database and no Node on the server.
3. **Pre-render every route** to HTML for SEO, link previews and no-JS readability, then hydrate with React for interactivity (filters, carousels, search).
4. **The site tells one story:** *SIT takes applied computing from project → initiative → ecosystem.* The three stages have consistent colours and icons everywhere (§7.3).
5. **Accessible and fast:** WCAG 2.1 AA; Lighthouse ≥ 95 on Performance, Accessibility, Best Practices and SEO on the home page (mobile).
6. **Never show placeholders to the public.** `TODO`/`VERIFY` markers, `status: draft` rows and `published: FALSE` rows are excluded or hidden in production builds, but surfaced in a dev-only "content health" report (§5.5).

---

## 1. Tech stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Build tool | **Vite 5** + **TypeScript** (strict) | fast, standard |
| UI | **React 18** | requested; matches the team's direction away from marked.js |
| Static pre-rendering | **vite-react-ssg** (pin an exact version) | generates one `index.html` per route from React Router routes; client hydration |
| Routing | **React Router 6** (data routes, as required by vite-react-ssg) | |
| Styling | **Tailwind CSS 3** with design tokens from `content/site.yml` → `tailwind.config.ts` | consistent, small CSS |
| Markdown | **unified**: `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-directive`, `remark-rehype`, `rehype-slug`, `rehype-autolink-headings`, `rehype-raw` **off** (HTML comments are stripped; no raw HTML) | lets markdown embed React components (§6) |
| YAML / CSV | `js-yaml`, `papaparse` | |
| Validation | `zod` schemas for every collection | build fails loudly on bad data |
| Images | `sharp` at build time (responsive `srcset` and WebP/AVIF), `<picture>` component | |
| Search | **Pagefind** (static index generated after build) | works on plain Apache |
| Icons | `lucide-react` | |
| Carousel | `embla-carousel-react` | light, accessible |
| Testing | `vitest` (content pipeline), `playwright` (smoke + axe accessibility), `lychee` or `linkinator` (links) | |
| CI | GitHub Actions (or GitLab CI at IITD), see §11 | |

Node ≥ 20. Package manager: `pnpm`.

---

## 2. Repository layout (target)

Keep content and app in **one repository**. Cursor adds `web/` and `scripts/`, and must not move the content folders.

```
sit-website/
├── content/                  # markdown (this repo, already written)
│   ├── site.yml              # global config: nav, footer, contact, theme tokens
│   ├── pages/                # one .md per static page; `route` in front-matter
│   ├── impact/               # impact case studies (collection)
│   └── research-areas/       # four thrust areas (collection)
├── data/                     # CSV collections (already written)
│   ├── projects.csv  news.csv  events.csv  openings.csv  admissions.csv
│   ├── stats.csv  hero-slides.csv  labs.csv  partners.csv  courses.csv
│   └── people/ faculty.csv students.csv alumni.csv staff.csv advisory-board.csv
├── assets/                   # copied verbatim to the site root (/images/…, /documents/…)
├── forms/google-forms.md     # form definitions (source of truth for CSV columns)
├── archive/                  # snapshot of the old site (reference only, never built)
├── scripts/                  # NEW — Node scripts (TypeScript, run with tsx)
│   ├── build-content.ts      # content + data → web/src/generated/*.json (§5)
│   ├── import-forms.ts       # Google Sheet → data/*.csv (§9)
│   ├── images.ts             # responsive image derivatives (§5.4)
│   ├── redirects.ts          # emits .htaccess redirect block (§10.3)
│   └── content-health.ts     # TODO/VERIFY/missing-image report (§5.5)
├── web/                      # NEW — the React app
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx  routes.tsx  App.tsx
│   │   ├── generated/        # build output of scripts/build-content.ts (git-ignored)
│   │   ├── lib/              # content loaders, markdown renderer, filters, dates
│   │   ├── components/       # UI + markdown components (§6, §7)
│   │   ├── layouts/          # PageLayout, HomeLayout, CollectionLayout
│   │   └── pages/            # route components (§4)
│   ├── public/.htaccess      # Apache config (§10.2)
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── .github/workflows/        # build, validate, deploy (§11)
├── plan.md  README.md  REVIEW.md
└── package.json              # workspace root: scripts below
```

Root `package.json` scripts:

```
pnpm content        # scripts/build-content.ts  (validate + generate JSON)
pnpm dev            # content (watch) + vite dev server
pnpm build          # content → images → vite-react-ssg build → pagefind → redirects
pnpm preview        # serve web/dist locally
pnpm import:forms   # pull approved rows from Google Sheets into data/*.csv
pnpm health         # content-health report (markdown table in stdout + web/dist/_health.html in dev)
pnpm test           # vitest + playwright
pnpm deploy         # rsync web/dist/ to the Apache server (§10.4)
```

---

## 3. Content conventions (must be honoured by the pipeline)

### 3.1 Paths
- **Markdown body**: images and documents are site-absolute: `![alt](/images/research/x.png)`, `[Brochure](/documents/sit-brochure-2023-24.pdf)`.
- **Front-matter and CSV**: asset paths are relative to `assets/` *without* a leading slash: `images/people/faculty/kolin-paul.jpg`. The loader prefixes `/`.
- **Internal links** use routes (`/research/projects`), never file paths. Query strings are allowed and pre-select filters: `/research/projects?status=open-for-students&seeking=PhD`.
- **External links** open in the same tab, with an external-link icon and `rel="noopener"`. (The old site's habit of `target=_blank` everywhere is dropped.)

### 3.2 Front-matter fields common to all markdown
| Field | Required | Meaning |
|---|---|---|
| `title` | yes | H1 and `<title>` (suffix " · SIT, IIT Delhi") |
| `route` | pages/collections | URL path |
| `description` | yes for pages | meta description, OG description, listing snippets |
| `hero_image` | no | page hero; if missing, use a typographic hero with a subtle generated pattern (§7.6) |
| `review` | no | editorial note, **never rendered** |
| `layout` | no | `home` for the home page; default `page` |

### 3.3 Editorial markers
- `<!-- ... -->` HTML comments: stripped from output; collected by `content-health`.
- Text containing `TODO` or `VERIFY` **outside** comments, for example `email: "TODO …"` in YAML or `value: "TODO"` in metrics: in production, the containing element (metric, link, table row, field) is **hidden**. In dev it is shown with a yellow "TODO" badge.
- Links whose URL contains `TODO` are rendered as plain text in production.

### 3.4 Enumerations (shared across CSVs and front-matter; define once in `web/src/lib/enums.ts`)
| Enum | Values (slug → label) |
|---|---|
| `thrust_area` | `sustainability-and-social-development` → "Sustainability and social development"; `sustainable-and-scalable-computing` → "Sustainable and scalable computing"; `health-and-social-care-technologies` → "Health and social care"; `safe-and-responsible-computing` → "Safe and responsible computing" (labels come from `content/research-areas/*.md` `short_title`) |
| `stage` | `project` → "Project"; `initiative` → "Initiative"; `ecosystem` → "Ecosystem" |
| project `status` | `ongoing` → "Ongoing"; `open-for-students` → "Open for students"; `proposed` → "Seeking collaborators"; `completed` → "Completed" |
| `seeking` | `PhD`, `MSR` → "MS (Research)", `Predoc` → "Pre-doc / Research Fellow", `RA` → "Research assistant", `Postdoc`, `Software engineer`, `Collaborators`, `Funding` |
| faculty `category` | `joint` → "Joint faculty"; `associated` → "Associated faculty"; `adjunct-visiting` → "Adjunct and visiting faculty"; `former` → "Former faculty" |
| `programme` | `phd` → "PhD"; `msr` → "MS (Research)"; `mtech` → "M.Tech." |
| news `category` | `achievement`, `announcement`, `event`, `opportunity`, `media`, `admissions-notice` |
| event `type` | `workshop`, `talk`, `conference`, `viva`, `outreach`, `other` |
| opening `type` / `status` | `fellowship`, `position`, `internship`, `call` / `open`, `closed`, `draft` |

Multi-valued CSV cells use `;` as a separator. Booleans are `TRUE`/`FALSE` (case-insensitive). Dates are ISO: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Partial dates are allowed (old news only has a year). Sort partial dates as the first day of the period, and display them as "2021", "Jan 2025" or "31 Jan 2025".

---

## 4. Routes and page templates

All routes are pre-rendered. `:slug` routes are enumerated from the collections at build time.

| Route | Source | Template / notes |
|---|---|---|
| `/` | `content/pages/home.md` (`layout: home`) | HomeLayout: full-bleed sections, directives render as bands (§8) |
| `/about`, `/about/vision`, `/about/how-we-create-impact`, `/about/leadership`, `/about/facilities`, `/about/reports` | `content/pages/about/*.md` | PageLayout with section sub-nav (left rail on desktop, chips on mobile) |
| `/impact` | `content/pages/impact/index.md` | PageLayout, wide |
| `/impact/:slug` | `content/impact/*.md` | **ImpactStoryLayout** (§7.5): hero with tagline, three-stage timeline from front-matter, metrics band, body, related projects, partners |
| `/research` | `content/pages/research/index.md` | |
| `/research/:area` | `content/research-areas/*.md` | **ThrustAreaLayout**: hero, summary, subtheme chips, body, then projects, labs and faculty directives |
| `/research/projects` | `content/pages/research/projects.md` | contains `::project-explorer` |
| `/research/projects/:id` | `data/projects.csv` rows **with** `description_md` | **ProjectLayout**: title, stage/status badges, summary, description, faculty (linked), partners, seeking, contact, website. Rows without `description_md` have no detail page; their cards link to `website` or open an expandable card |
| `/research/labs`, `/research/centres` | pages | |
| `/academics`, `/academics/phd`, `/academics/ms-research`, `/academics/mtech-cybersecurity`, `/academics/research-fellows`, `/academics/courses`, `/academics/admissions`, `/academics/faq` | pages | |
| `/why-sit`, `/why-sit/students`, `/why-sit/faculty`, `/why-sit/partners` | pages | |
| `/people`, `/people/faculty`, `/people/students`, `/people/alumni`, `/people/staff`, `/people/advisory-board` | pages | people directives (§6) |
| `/news` | `content/pages/news/index.md` | |
| `/news/:id` | `data/news.csv` rows with `body_md` | **NewsLayout** |
| `/events` | `content/pages/news/events.md` | |
| `/openings` | `content/pages/news/openings.md` | |
| `/contact` | `content/pages/contact.md` | |
| `/search` | app | Pagefind UI |
| `/404` | app | friendly 404 with search + key links; Apache `ErrorDocument 404 /404/index.html` |

Breadcrumbs on every page except home, derived from `content/site.yml` `nav`.

---

## 5. Content pipeline (`scripts/build-content.ts`)

### 5.1 Steps
1. Load `content/site.yml`.
2. Glob `content/**/*.md`. Parse front-matter (`gray-matter` or `remark-frontmatter` + `js-yaml`). Keep the body as **markdown source** (rendered at SSG time by the React markdown renderer, §6.1). Strip HTML comments from the body and collect them for the health report.
3. Load every CSV in `data/` with papaparse (`header: true`, `skipEmptyLines: true`, trim headers and values). Normalise booleans, split `;` lists, parse dates.
4. Validate with zod schemas (§5.2). **Errors fail the build** (missing required field, unknown enum, duplicate `id`, broken internal reference). **Warnings** (missing image file, TODO markers, a faculty name in a project that doesn't match `faculty.csv`) are printed and written to the health report.
5. Filter for production: drop news, events and openings with `status` `draft` or empty; projects with `published=FALSE`; people with `active=FALSE` (kept for the "Former faculty" view via a separate array).
6. **Derive cross-references**:
   - `faculty[name].projects` ← projects whose `faculty` list contains the name (case-insensitive match after normalising initials and dots: "P V M Rao" == "P. V. M. Rao").
   - `researchArea.projects`, `researchArea.faculty`, `researchArea.labs`.
   - `impactStory.relatedProjects` from `related_projects`.
   - `opening.status = closed` if `deadline` < build date.
   - `stats`, `heroSlides` sorted by `order`, filtered by `active`.
7. Emit `web/src/generated/{site,pages,impact,areas,projects,news,events,openings,admissions,people,labs,courses,stats,hero,partners}.json` and a `routes.json` (all pre-render paths).
8. Copy `assets/` → `web/public/` (or configure Vite `publicDir` to `../assets`). Generate image derivatives (§5.4).

### 5.2 Schemas (zod, abbreviated)
```ts
Project = { id: slug, title: string, thrust_area: ThrustArea, stage: Stage, status: ProjectStatus,
  summary: string.max(400), description_md?: string, faculty: string[], partners: string[], sponsor?: string,
  seeking: Seeking[], background?: string, contact_email?: email, website?: url, image?: assetPath,
  impact_story?: slug(ref content/impact), start_year?: year, featured: bool, published: bool, last_updated?: date }
News = { id, date: partialDate, category: NewsCategory, title, summary: max(500), body_md?, link?: url|route,
  image?: assetPath, thrust_area: ThrustArea[], featured: bool, status: 'published'|'draft', submitted_by? }
Event = { id, title, type, start_date: partialDate, end_date?, venue, audience?, summary, registration_url?, image?, status }
Opening = { id, title, type, summary, apply_url?, contact, deadline?: date|'rolling', status }
Admission = { cycle, programme: Programme[], item, date?, link?, status: 'current'|'archived' }
Faculty = { name, category, role?, affiliation?, degree?, research_interests?, thrust_areas: ThrustArea[], profile_url?, email?, photo?, display_order?: int, active: bool }
Student = { name, programme, research_interests?, supervisor?, thrust_areas: ThrustArea[], profile_url?, photo?, year_joined?, active }
Alumnus = { name, programme, graduation_year: year, thesis_title?, supervisor?, current_position?, profile_url?, photo?, story_md? }
Staff = { name, type: 'administrative'|'research'|'programme', designation, email?, phone?, photo?, active }
Stat = { label, value, suffix?, note?, source }          // `source` is never rendered
HeroSlide = { order:int, kicker, title, text, cta_label, cta_link, image, active }
ImpactStory front-matter = { title, slug, route, tagline, thrust_area, current_stage, order, hero_image, card_image,
  faculty: string[], website?, metrics: {value,label}[], timeline: {stage, period, text}[],
  partners?: {name, role?, logo?, url?}[], related_projects?: slug[], links?: {label,href}[],
  sources?: string[] }   // `sources` = editorial provenance; NEVER rendered (may cite internal notes)
ResearchArea front-matter = { title, short_title, slug, route, order, icon (lucide name), hero_image, card_image,
  summary, subthemes: string[], impact_stories: slug[] }
```

### 5.3 Markdown rendering
- Render at **SSG time** inside React (`react-markdown` with the remark/rehype plugins in §1 and a `components` map). Directives become React components (§6). This keeps one renderer for dev and build.
- Headings: the page H1 comes from front-matter `title` *unless* the body starts with `# `. Never render two H1s. Body `##` → section headings with anchor links.
- Tables: responsive wrapper with horizontal scroll and a sticky first column on mobile.
- Images in the body: run through the `<ResponsiveImage>` component (lazy, `srcset`, width/height from the image manifest to avoid layout shift), with a click-to-enlarge lightbox.

### 5.4 Images
`scripts/images.ts`: for every raster image under `assets/images/`, generate widths `[320, 640, 960, 1280, 1920]` (capped at the original width) in **WebP** plus the original format into `web/public/_img/…`, and write `image-manifest.json` (`{path: {width, height, variants[]}}`). Portraits: crop to a 1:1 square centred on the upper third (faces). Hash filenames for cache-busting. Missing image → placeholder (§7.6) plus a health warning.

### 5.5 Content-health report (`pnpm health`)
Lists: every `TODO`/`VERIFY` (file, line, text), outstanding image placeholders from `assets/images/PLACEHOLDERS.csv` grouped by `request_from`, HTML comments, draft rows, missing images, CSV rows with unknown faculty names, impact metrics still `TODO`, links to `owncloud.iitd.ac.in` (flag: documents that should live on the site), external links that fail (optional `--links`). Output: a markdown table to stdout, plus `/_health/` route **in dev only**.

---

## 6. Markdown component contract

Markdown may embed components in two ways. **Implement every component listed; unknown component names fail the build.**

### 6.1 Syntax
- **Leaf directive** (data-driven): `::name{attr="value" other="x"}` on its own line (remark-directive). Attribute values are strings; parse `"true"/"false"` and numbers.
- **Fenced YAML block** (inline configuration): a fenced code block whose info string is `yaml <component-name>`, for example ```` ```yaml stage-cards ````. The body is YAML (usually a list) passed as `items`. Fenced blocks with plain `yaml` and no component name render as code.

Shared attribute conventions:
- `source` = collection name (`projects`, `news`, `events`, `openings`, `faculty`, `students`, `alumni`, `staff`, `advisory-board`, `labs`, `courses`, `stats`, `hero-slides`, `partners`, `admissions`) or a dotted path into `site.yml` (`site.contact`).
- `filter` = comma-separated conditions: `field=value` (equality; list fields match if they contain the value), `field~value` (contains), `field!=` (non-empty). Example: `filter="thrust_areas~health-and-social-care-technologies,active=TRUE"`.
- Direct shorthand attributes (`thrust_area`, `status`, `seeking`, `sponsor`, `programme`, `featured`, `ids`) are sugar for `filter`.
- `ids="related_projects"` means "take the ids from this front-matter field". `ids="a,b"` means literal ids.
- `limit`, `sort="field:asc|desc"`, `group_by`, `group_order`, `layout`, `empty` (text shown when nothing matches; if absent, the component renders **nothing**, including its preceding heading — see below), `collapsed="true"` (inside a `<details>`).
- **Empty-section rule:** if a data component renders nothing and has no `empty` text, also hide the immediately preceding heading (`##`/`###`) so pages never show empty sections.

### 6.2 Components

| Name | Kind | Props | Renders |
|---|---|---|---|
| `hero-carousel` | leaf | `source="hero-slides"` | full-bleed carousel (embla), autoplay 7 s, pause on hover/focus, respects `prefers-reduced-motion`, dots + arrows, each slide: image with dark gradient, kicker, H2 title, text, CTA button. Slide 1 image `fetchpriority="high"` |
| `stats-strip` | leaf | `source`, `title?` | 3–6 big numbers with labels; count-up animation on first view (disabled for reduced motion); non-numeric values (e.g. "millions") shown as text |
| `stage-cards` | fenced | items: `{stage,title,text,link}` | three cards in the stage colours connected by an arrow line (desktop horizontal, mobile vertical) |
| `stage-timeline` | fenced | items: `{stage,title,text}` | the same visual, larger, explanatory (used on "How we create impact") |
| `stage-support` | fenced | items: `{stage, items[]}` | three columns aligned to the stage colours, bullet lists |
| `timeline` | leaf | (uses current impact story front-matter `timeline`) | vertical stage timeline with period labels |
| `metrics` | leaf | (uses front-matter `metrics`) | metric tiles; hide tiles whose value contains TODO in production |
| `impact-cards` | leaf | `limit?`, `layout="grid|large"` | cards for `content/impact/*` sorted by `order`: card image, title, tagline, current-stage badge |
| `stage-pipeline` | leaf | `source="projects"` | three columns (project/initiative/ecosystem) with counts and the top 5 project titles each, plus a "view all" link with a pre-set filter |
| `thrust-area-tiles` | leaf | `show_summary?`, `show_subthemes?` | 4 tiles (icon, image, title, summary/subthemes) linking to `/research/:area` |
| `projects` | leaf | filters, `limit`, `group_by="status"`, `layout="cards|list"`, `title?` | project cards: image (or area-coloured pattern), stage badge, status badge, title, summary, faculty chips (link to faculty profile URL), "seeking" chips, CTA (detail page / website / email) |
| `project-explorer` | leaf | `filters="thrust_area,stage,status,seeking"`, `default_sort` | full filter UI (chips + search box) over all published projects; filters reflected in the URL query string; result count; pre-rendered with all items visible (no-JS friendly) |
| `labs` | leaf | `thrust_area?`, `group_by?`, `limit?` | logo or initial monogram, name, summary, faculty, website |
| `people` | leaf | `source`, `filter`, `group_by`, `group_order`, `layout="grid|compact|feature|table"`, `columns?`, `filters?`, `search?`, `sort?`, `empty?`, `collapsed?` | grid: portrait (1:1, rounded), name (linked to `profile_url`), category/role, affiliation, interests (2-line clamp), thrust-area dots. compact: small avatar + name. table: sortable table. Missing photo → initials avatar in a neutral tone |
| `alumni-stories` | leaf | `source="alumni"`, `filter`, `limit` | quote-style cards (photo, name, year, current position, story) |
| `news-feed` | leaf | `limit`, `include="news,events"` | merged reverse-chronological list (news + upcoming events first); cards with date, category tag, title, summary |
| `news-list` | leaf | `filters="category,thrust_area,year"`, `page_size` | paginated list (pages pre-rendered as `?page=n`, or client-side) |
| `events` | leaf | `source`, `ids?`, `upcoming_first`, `filters` | date block (day/month), title, type tag, venue, summary, link; "Upcoming" / "Past" groups |
| `openings` | leaf | `source`, `ids?`, `status` | cards with type tag, deadline (or "Rolling"), apply button |
| `opportunities-band` | leaf | `admissions="current"`, `openings="open"`, `projects="open-for-students"`, `limit` | a home-page band with three columns: current admissions, open positions, projects seeking students |
| `admissions-panel` | leaf | `status`, `programme?`, `show_dates?`, `collapsed?` | grouped by cycle: interview dates prominently shown, then documents (links) |
| `incentive-highlights` | leaf | — | 4 icon tiles from `content/pages/why-sit/index.md` `audience-cards` points (first point of each audience plus Research Fellows); links to `/why-sit` |
| `audience-cards` | fenced | `{title, href, points[]}` | three large cards |
| `programme-cards` | fenced | `{title, href, text, tags[]}` | cards with tags |
| `key-facts` | fenced | `{label, value}` | 2×2 / 4×1 fact grid |
| `faq` | fenced | `{q, a}` | accessible accordion (`<details>`); add `FAQPage` JSON-LD |
| `partner-options` | fenced | `{title, text, href}` | cards |
| `people-tiles` | fenced | `{title, href, icon, count_source, count_filter?}` | tiles with live counts |
| `documents` | fenced | `{title, file, thumbnail?, note?}` | document list with file type and size; hide entries without a file in production |
| `contact-routes` | fenced | `{label, text, href}` | list of contact options |
| `cta-band` | fenced | `{label, href}[]` | full-width dark band with 2–3 buttons (first primary) |
| `partner-logos` | leaf | `source="partners"` | greyscale logo strip, colour on hover; hidden if empty |
| `courses` | leaf | `source`, `limit?`, `layout="accordion|cards"` | course code, title, credits, description |
| `gallery` | leaf | `folder`, `empty` | masonry grid with lightbox from all images in an assets folder |
| `contact-card` | leaf | `source="site.contact"` | address, phone, email (hide TODO fields) |
| `map` | leaf | `source="site.contact.map_embed"` | **click-to-load** Google Maps iframe (privacy and performance) |

---

## 7. Design system

### 7.1 Direction
Modern, confident, editorial: lots of white space, large type, full-bleed photography, and the **IITD red used as a decisive accent**, not as wallpaper. It should feel like a School "gearing up for large-scale impact and transformation": bold numbers, stories with faces, motion that is purposeful and sparse.

### 7.2 Tokens (from `content/site.yml` → Tailwind theme)
| Token | Value | Use |
|---|---|---|
| `primary` | `#C21717` (IITD red) | primary buttons, links on hover, active nav, key highlights |
| `primary-dark` | `#8E1010` | hover/pressed, text on light red |
| `primary-50` | `#FDECEC` | tinted backgrounds, badges |
| `ink` | `#1F2328` | headings |
| `body` | `#4A4F55` | body text (≥ 4.5:1 on white) |
| `surface` / `surface-alt` | `#FFFFFF` / `#F6F4F1` | alternating section bands |
| `dark` | `#1B1B1F` | footer, CTA bands, stats band background |
| `line` | `#E5E2DD` | borders |

**Fonts:** headings **Montserrat** (600/700), body **Poppins** (400/500), both self-hosted via `@fontsource` (no Google Fonts request), `font-display: swap`. Scale: 14/16/18/20/24/30/36/48/60 px; body 17 px on desktop, line-height 1.65; max reading width 72 ch.

### 7.3 Stage colours (used *everywhere* stages appear)
| Stage | Colour | Icon (lucide) |
|---|---|---|
| Project | `#E8A33D` (amber, "spark") | `sparkles` |
| Initiative | `#2F7D6D` (teal, "growth") | `git-merge` |
| Ecosystem | `#C21717` (IITD red, "scale") | `globe-2` |

Badges: pill, 12 px uppercase, colour dot + label. Connect stage visuals with a thin line and a chevron to communicate progression.

### 7.4 Layout and chrome
- **Header:** utility bar (IIT Delhi · Webmail · Contact; 32 px, dark) and main bar (logo left, mega-menu centre, search icon + **Apply** primary button right). Sticky; shrinks on scroll. Mega-menu panels show child links plus one featured card (e.g. the latest impact story) on desktop; on mobile, a full-screen drawer with accordions. Keyboard accessible (arrow keys, Esc), and `aria-expanded` set correctly.
- **Footer:** dark; logo, short mission line, the three link columns from `site.yml`, contact block, CTA buttons, copyright with the current year, and "Last updated <build date>".
- **Section rhythm:** alternate `surface` / `surface-alt` bands; 96 px vertical padding on desktop, 56 px on mobile; 12-column grid, max width 1280 px.
- **Page hero:** image heroes 420 px tall (desktop) with a dark gradient and title bottom-left; typographic heroes have a large title on `surface-alt` with a generated pattern.

### 7.5 Impact story layout
1. Full-bleed hero (image, tagline as H1 subtitle, current-stage badge, thrust-area link).
2. Sticky in-page nav: Problem · What we built · How it grew · Impact · What's next.
3. `timeline` as a horizontal three-step band on desktop, with each step's period and text.
4. `metrics` band on `dark` background with large numerals.
5. Body sections.
6. Related projects, faculty (avatars), partners (logo if present, else name + role as a text chip), external links.
7. "Next story" card at the bottom.

### 7.6 Placeholders
Two kinds of placeholder exist:

1. **Labelled placeholder files** (already in the repo). Every image the design needs but the School has not yet supplied exists as a real JPG **at its final dimensions**, listed in **`assets/images/PLACEHOLDERS.csv`** (`path, width, height, used_on, brief, request_from, status`). Each image shows "PLACEHOLDER", its size, its path, what photo is needed and whom to ask, and heroes also mark the **text-overlay safe area**. These files are what the website team sends to faculty and the SIT office when requesting photos. Replacing one means dropping a real photo at the same path and setting `status` to `supplied` in the CSV (or deleting the row).
   - The build reads `PLACEHOLDERS.csv`. In **dev and staging** (`SHOW_PLACEHOLDERS=true`) the labelled images render as-is, so reviewers see exactly what is missing. In **production**, any image whose row still has `status=placeholder` is replaced by the generated pattern (2), so visitors never see a "PLACEHOLDER" label.
   - `content-health` lists every outstanding placeholder, grouped by `request_from`, so requests can be sent in batches.
   - Use the image's real dimensions from the manifest for `width`/`height` attributes and crops. Hero layouts must keep the title and CTA inside the marked safe area (lower-left 55% × 52%).
2. **Generated pattern.** When an image path is missing, the file does not exist, or a placeholder is suppressed in production, render a **generated SVG pattern** (deterministic from the slug), such as contour lines or a dot grid, tinted with the thrust-area or stage colour. Pages then look intentional before photography arrives. Never render a broken `<img>`.

### 7.7 Motion and accessibility
- Fade/slide-in on scroll for section headings and cards (IntersectionObserver, 200 ms, once). All motion is disabled under `prefers-reduced-motion`.
- Focus rings: 2 px `primary` offset outline. Skip-to-content link. Landmarks (`header`, `nav`, `main`, `footer`). Every image needs `alt`: use the markdown alt text or the person's name; decorative images get `alt=""`.
- Colour contrast AA throughout; never convey stage by colour alone (icon + label).

---

## 8. Home page specification (`content/pages/home.md`)

Render the markdown in order. Each top-level block (directive or `##` section with its following content) becomes a full-width band with alternating backgrounds:

1. `hero-carousel`: 80 vh max on desktop, 70 vh on mobile.
2. `stats-strip`: on `dark`, overlapping the bottom of the hero by 48 px on desktop.
3. "Computing that leaves the lab": two columns (text left; on the right, a photo collage of the four `impact` card images).
4. "How we create change" + `stage-cards`: the signature visual, with generous space.
5. "Featured initiatives" + `impact-cards` (4).
6. "Four thrust areas" + `thrust-area-tiles`.
7. "Opportunities now" + `opportunities-band`, on a `primary-50` tint.
8. "News and events" + `news-feed`.
9. "Why SIT" + `incentive-highlights`.
10. `partner-logos` (hidden while empty).
11. `cta-band`.

---

## 9. Google Forms → CSV pipeline

Form definitions and column mappings: **`forms/google-forms.md`** (source of truth).

### 9.1 Set-up (one-off, done by the website team)
1. Create the five forms exactly as specified, all linked to **one** Google Sheet, one tab per form (`news`, `projects`, `events`, `openings`, `alumni`).
2. Add moderator columns to each tab (`status` or `moderation` for projects, `featured`, `moderator_note`, optional `edited_<column>`).
3. Create a Google Cloud **service account** with read access to the Sheet (share the Sheet with the service-account email), and read access to the Drive folder where form file uploads land.
4. Store the credentials as a CI secret `GOOGLE_SERVICE_ACCOUNT_JSON`, and the Sheet ID as `SUBMISSIONS_SHEET_ID`.

### 9.2 `scripts/import-forms.ts`
- Reads each tab via the **Google Sheets API** (`googleapis`), taking only rows with moderation = `published`.
- Maps form question headers → CSV columns using a mapping table in `scripts/forms-mapping.ts`, generated from `forms/google-forms.md` (keep both in sync; add a unit test that asserts every mapped column exists in the zod schema).
- Applies `edited_<column>` overrides.
- Normalises: trim; dropdown labels → enum slugs; dates → ISO; checkbox lists → `;`-joined slugs; generates `id` (slug of title, ≤ 60 chars cut at a word boundary, unique).
- **Images:** for file-upload answers (Drive URLs), downloads the file via the Drive API to `assets/images/<collection>/<id>.<ext>`, re-encoded with sharp (max 2400 px, strip EXIF/GPS), and writes that path to the CSV.
- **Merge strategy:** form rows are *upserted* into the existing CSV by `id` (or by `update_of` for projects, `name` for alumni). Rows that exist only in the CSV (migrated or hand-edited) are preserved. A row's `status=superseded` in the Sheet deletes it from the CSV.
- Writes CSVs deterministically (stable column order and row order: by date desc for news and events, by title for projects) so git diffs are readable.
- `--dry-run` prints the diff without writing.

### 9.3 Fallback without API access
If a service account is not possible, a moderator can **File → Download → CSV** each tab into `data/incoming/<tab>.csv`, and `pnpm import:forms --from-dir data/incoming` performs the same mapping and merge. Image uploads must then use the "Image URL" question, or be dropped manually into `assets/images/<collection>/` and named in the `image` column.

### 9.4 Automation
A scheduled CI job (daily at 06:00 IST, plus manual dispatch) runs `import:forms`. If the CSVs changed, it opens a pull request (or commits to `main` if the team prefers no review) titled "Content: N new submissions". Merging to `main` triggers build and deploy (§11).

---

## 10. Hosting on Apache (IIT Delhi)

### 10.1 Build output
`web/dist/` contains one folder per route with an `index.html` (e.g. `dist/research/projects/index.html`), hashed JS/CSS in `dist/assets/`, images in `dist/images/` and `dist/_img/`, documents in `dist/documents/`, `pagefind/`, `sitemap.xml`, `robots.txt`, `404/index.html` and `.htaccess`.

### 10.2 `.htaccess` (ship in `web/public/.htaccess`; requires `AllowOverride All` or the equivalent in the vhost — confirm with CSC)
```apache
Options -Indexes
DirectorySlash On
DirectoryIndex index.html
ErrorDocument 404 /404/index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # force https and canonical host
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://sit.iitd.ac.in%{REQUEST_URI} [L,R=301]
  # trailing slash: serve /path/ from /path/index.html (pre-rendered)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME}/index.html -f
  RewriteRule ^(.*[^/])$ /$1/ [L,R=301]
  # --- BEGIN generated redirects (scripts/redirects.ts) ---
  # --- END generated redirects ---
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml text/xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/json "access plus 0 seconds"
  ExpiresDefault "access plus 1 month"
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\.(js|css|woff2|webp|avif|jpg|png|svg)$">
    <If "%{REQUEST_URI} =~ m#^/(assets|_img)/#">
      Header set Cache-Control "public, max-age=31536000, immutable"
    </If>
  </FilesMatch>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Permissions-Policy "geolocation=(), camera=(), microphone=()"
</IfModule>
```

### 10.3 Redirects from the old site (`scripts/redirects.ts`)
Generate `RewriteRule ... [R=301,L]` lines for every old URL, so existing links and search results keep working:

| Old | New |
|---|---|
| `/frontend/vision` | `/about/vision` |
| `/people` | `/people` (unchanged) |
| `/faculty`, `/students`, `/alumni` | `/people/faculty`, `/people/students`, `/people/alumni` |
| `/researchstaff`, `/adminstaff` | `/people/staff` |
| `/research` | `/research` |
| `/show-news/53`, `/54`, `/55`, `/56` | `/research/sustainability-and-social-development`, `/research/sustainable-and-scalable-computing`, `/research/health-and-social-care-technologies`, `/research/safe-and-responsible-computing` |
| `/show-news/57`–`/60` | `/research/projects?thrust_area=<matching area>` |
| `/show-news/47`, `/43`, `/48`, `/64` | `/academics/research-fellows` |
| `/show-news/63` | `/research/centres` |
| `/show-news/<other>` | `/news` |
| `/phd`, `/msr`, `/mtechcs` | `/academics/phd`, `/academics/ms-research`, `/academics/mtech-cybersecurity` |
| `/admission`, `/how` | `/academics/admissions` |
| `/courses` | `/academics/courses` |
| `/contact` | `/contact` |
| `/public/storage/uploads/placement/SIT%20Brochure%202023-24_updated_1688555498.pdf` | `/documents/sit-brochure-2023-24.pdf` |
| `/public/storage/faculty_images/*`, `/public/storage/student_images/*` | `410 Gone` (or ignore) |

Note that old URLs have no trailing slash; put the redirect rules **before** the trailing-slash rule.

### 10.4 Deploy
- `pnpm deploy` = `rsync -avz --delete web/dist/ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/` (variables from `.env.deploy`, git-ignored). Use `--delete` only on the build directory, never on server folders that hold other content. Keep the previous release for rollback: deploy to `releases/<timestamp>/` and switch a `current` symlink if the server allows symlinks (`Options +FollowSymLinks`); otherwise rsync directly.
- If the server is reachable only from inside the IITD network, run deploys from a machine on campus, or use a self-hosted CI runner on campus. Document the chosen route in `README.md`.
- Base path: the site is served at the domain root. Keep Vite `base: "/"`.

---

## 11. CI/CD

Workflow `ci.yml` (on PR and push):
1. `pnpm install --frozen-lockfile`
2. `pnpm content` (validation must pass)
3. `pnpm build`
4. `pnpm test` (vitest + Playwright smoke on `pnpm preview`: every route returns 200, has one H1, has no console errors, and has no axe violations of serious or critical impact)
5. Link check on internal links (external links: weekly job, non-blocking)
6. Upload `web/dist` as an artifact; on PRs, post the content-health summary as a comment.

Workflow `deploy.yml` (on push to `main`): build, then rsync (secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_KEY`).
Workflow `import-forms.yml` (cron daily 00:30 UTC, plus manual): §9.4.

---

## 12. SEO, metadata, analytics
- `<title>`: "{page title} · SIT, IIT Delhi"; home: "{site.name} | {tagline}".
- Meta description from front-matter `description` (fallback: first 155 characters of the body).
- Open Graph and Twitter cards: `og:image` from `hero_image` (fallback `site.og_image`); generate 1200×630 crops at build time.
- JSON-LD: `CollegeOrUniversity` (parentOrganization IIT Delhi) on home; `BreadcrumbList` on all pages; `NewsArticle` for news detail; `Event` for events; `FAQPage` for the FAQ.
- `sitemap.xml` (all routes, `lastmod` from the git commit date of the source file) and `robots.txt`.
- Canonical URLs with a trailing slash.
- Analytics: optional, privacy-friendly (e.g. self-hosted Plausible or Matomo, if IITD has one). No cookies banner needed if cookieless. Disabled until configured in `site.yml` (`analytics: {provider, src}`).

---

## 13. Milestones (implement in order)

**M1: Skeleton and pipeline**
- Set up the repo (pnpm workspace, `web/` Vite + React + TS + Tailwind, `scripts/` with tsx).
- `build-content.ts` with zod schemas, cross-references and JSON output; `pnpm content` passes on the current data, and the warnings list matches the known TODOs.
- vite-react-ssg pre-renders all routes in §4 with a bare layout.
- ✅ *Acceptance:* `pnpm build` produces `dist/` with an `index.html` for every route in `routes.json`; deliberately breaking an enum in a CSV fails the build with a readable message.

**M2: Design system and chrome**
- Tokens, fonts, header with mega-menu and mobile drawer, footer, breadcrumbs, page hero, section bands, buttons, badges (stage/status/category), cards, placeholder patterns, ResponsiveImage, and the image pipeline.
- ✅ *Acceptance:* keyboard-only navigation of the menu works; Lighthouse accessibility ≥ 95 on a sample page; no layout shift from images.

**M3: Markdown renderer and components**
- The markdown renderer with directives and fenced YAML components; all components in §6.2; empty-section rule; TODO hiding in production.
- ✅ *Acceptance:* every page in `content/pages` renders with no "unknown component" errors; the production build contains no "TODO" or "VERIFY" text (add a test that greps `dist/`).

**M4: Collections**
- Impact story layout, thrust-area layout, project explorer with URL-synced filters, project and news detail pages, people grids, events, openings, admissions panel.
- ✅ *Acceptance:* `/research/projects?status=open-for-students&seeking=Predoc` pre-filters correctly with JS; with JS disabled, all projects are visible.

**M5: Home page**
- Built as specified in §8, with motion and reduced-motion handling.
- ✅ *Acceptance:* home Lighthouse (mobile) ≥ 95 / 95 / 95 / 95; LCP < 2.5 s on simulated 4G.

**M6: Search, SEO, redirects**
- Pagefind, the search page and the header search; sitemap, robots, JSON-LD and OG images; generated redirects in `.htaccess`.
- ✅ *Acceptance:* searching "CoRE" finds the impact story, the research area and the projects; every old URL in §10.3 returns 301 to the right place (test with a list in `scripts/redirects.test.ts` against `pnpm preview` + a local Apache docker image `httpd:2.4` with the `.htaccess`).

**M7: Forms import**
- `import-forms.ts` (API mode + `--from-dir` mode), mapping tests, image download, deterministic CSV writing, CI workflow.
- ✅ *Acceptance:* with a fixture Sheet export in `scripts/__fixtures__/`, the import produces the expected CSV diff, and re-running it is a no-op.

**M8: Deploy and hand-over**
- Apache config verified on the IITD server (or `httpd:2.4` docker locally), deploy script, rollback notes, `README.md` sections "How to edit content", "How to publish news", "How to deploy".
- ✅ *Acceptance:* a non-developer can follow the README to change a page, add a project via the form, and see it live after the next build.

---

## 14. Things Cursor must *not* do
- Do not invent content. If a page needs text that isn't in `content/`, leave a visible TODO in **dev only** and list it in the health report.
- **Do not display monetary amounts for incentives anywhere** (School policy). The content already omits them; do not add any.
- Do not hot-link images from `lh7-rt.googleusercontent.com` or the old site. All images are in `assets/`.
- Do not use `target="_blank"` by default, and do not add cookie-setting third-party scripts.
- Do not hand-edit `web/src/generated/`.

---

## 15. Open content items (for the School; tracked in `REVIEW.md`)
Summarised from the `TODO` and `VERIFY` markers: a single public contact email; an SVG logo; hero photography for the four impact stories and the thrust areas; exact impact metrics (CoRE stack villages, Assistech countries and users, Gram Vaani reach); start years for the impact timelines; partner lists and logos; the approval status of the PhD/MS(R) top-up, IGNITE and the housing support (the copy is written so that no amounts appear); Advisory Board membership; facilities details; the Head's message; Google Form URLs once the forms are created.
