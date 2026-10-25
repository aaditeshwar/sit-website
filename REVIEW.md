# Review checklist

Generated from the content. Once the app exists, regenerate it after edits with `pnpm health`.

## 1. Rewrites to review

Each page has a `review:` note in its front-matter saying where it came from. The original scraped text is in `archive/pages/` and `archive/news/`, so you can compare. The four impact stories were expanded with web research on 24 Oct 2026; each lists its sources in a `sources:` front-matter field, which is never shown on the site.

| Route | File | Origin |
|---|---|---|
| `/impact/architecture-and-security` | `content/impact/architecture-and-security.md` | expanded with web research (24 Oct 2026) — security-side partners and outcomes still needed from faculty |
| `/impact/assistech` | `content/impact/assistech.md` | expanded with web research (24 Oct 2026) — VERIFY dates, faculty list and the 19-countries figure |
| `/impact/core-stack` | `content/impact/core-stack.md` | expanded with web research (24 Oct 2026); numbers from core-stack.org — VERIFY before launch |
| `/impact/gram-vaani` | `content/impact/gram-vaani.md` | expanded with web research (24 Oct 2026) — VERIFY figures with Gram Vaani |
| `/about/facilities` | `content/pages/about/facilities.md` | new page — placeholder |
| `/about/how-we-create-impact` | `content/pages/about/how-we-create-impact.md` | new page — distilled from the RIC workshop note (Oct 2026) |
| `/about` | `content/pages/about/index.md` | draft rewrite — from archive pages/home.md (About US) |
| `/about/leadership` | `content/pages/about/leadership.md` | new page — placeholders |
| `/about/reports` | `content/pages/about/reports.md` | new page |
| `/about/vision` | `content/pages/about/vision.md` | draft rewrite — from archive pages/about/vision.md (thrust-area table preserved verbatim below) |
| `/academics/admissions` | `content/pages/academics/admissions.md` | draft rewrite — merges archive pages/admissions/how-to-apply.md and latest-admissions-info.md |
| `/academics/courses` | `content/pages/academics/courses.md` | light edit — course list moved to data/courses.csv |
| `/academics/faq` | `content/pages/academics/faq.md` | new page — answers drawn from existing site content; TODO items need the School office |
| `/academics` | `content/pages/academics/index.md` | new page |
| `/academics/ms-research` | `content/pages/academics/ms-research.md` | draft rewrite — from archive pages/academics/programmes/ms-research.md |
| `/academics/mtech-cybersecurity` | `content/pages/academics/mtech-cybersecurity.md` | draft rewrite — from archive pages/academics/programmes/mtech-cybersecurity.md |
| `/academics/phd` | `content/pages/academics/phd.md` | draft rewrite — from archive pages/academics/programmes/phd.md |
| `/academics/research-fellows` | `content/pages/academics/research-fellows.md` | draft rewrite — consolidates archive pages/academics/research-fellows.md and duplicate news items 043, 048, 064 |
| `/contact` | `content/pages/contact.md` | draft — TODO: confirm single public email |
| `/` | `content/pages/home.md` | draft rewrite — replaces pages/home.md in the archive |
| `/impact` | `content/pages/impact/index.md` | new page |
| `/events` | `content/pages/news/events.md` | data in data/events.csv |
| `/news` | `content/pages/news/index.md` | data in data/news.csv |
| `/openings` | `content/pages/news/openings.md` | data in data/openings.csv |
| `/people/advisory-board` | `content/pages/people/advisory-board.md` | placeholder — data in data/people/advisory-board.csv (empty) |
| `/people/alumni` | `content/pages/people/alumni.md` | data in data/people/alumni.csv |
| `/people/faculty` | `content/pages/people/faculty.md` | data in data/people/faculty.csv |
| `/people` | `content/pages/people/index.md` | draft rewrite — from archive pages/people/index.md |
| `/people/staff` | `content/pages/people/staff.md` | data in data/people/staff.csv — research staff page was empty on the old site |
| `/people/students` | `content/pages/people/students.md` | data in data/people/students.csv |
| `/research/centres` | `content/pages/research/centres.md` | draft rewrite — from archive pages/coe/r-systems-coe.md (show-news/63) |
| `/research` | `content/pages/research/index.md` | new page — the live Research page was empty |
| `/research/labs` | `content/pages/research/labs.md` | new page — data in data/labs.csv |
| `/research/projects` | `content/pages/research/projects.md` | new page — replaces the four 'Ongoing Projects' pages; data in data/projects.csv |
| `/why-sit/faculty` | `content/pages/why-sit/faculty.md` | new page — from IGNITE draft, RIC workshop note and fund-utilisation minutes. No amounts by design. VERIFY IGNITE launch status. |
| `/why-sit` | `content/pages/why-sit/index.md` | new page — distilled from School policies (amounts deliberately omitted) |
| `/why-sit/partners` | `content/pages/why-sit/partners.md` | new page — placeholder copy for the School to refine |
| `/why-sit/students` | `content/pages/why-sit/students.md` | new page — from SIT honorarium proposals and fund-utilisation minutes. No amounts by design. VERIFY which items are approved and in force. |
| `/research/health-and-social-care-technologies` | `content/research-areas/health-and-social-care-technologies.md` | draft rewrite — from archive research/areas/health-and-social-care-technologies.md (show-news/55) |
| `/research/safe-and-responsible-computing` | `content/research-areas/safe-and-responsible-computing.md` | draft rewrite — from archive research/areas/safe-and-responsible-computing.md (show-news/56) |
| `/research/sustainability-and-social-development` | `content/research-areas/sustainability-and-social-development.md` | draft rewrite — from archive research/areas/sustainability-and-social-development.md (show-news/53) |
| `/research/sustainable-and-scalable-computing` | `content/research-areas/sustainable-and-scalable-computing.md` | draft rewrite — from archive research/areas/sustainable-and-scalable-computing.md (show-news/54); original text lightly edited |

## 2. Policy points to confirm before launch

- **Incentive amounts:** none appear anywhere (by instruction). Confirm that the **existence** of these may be stated publicly: (a) the PhD and MS(R) School top-up (the documents are marked 'Proposal'), (b) IGNITE seed grants (marked 'Draft'), (c) first-year accommodation support (ScFB asked for specifics), (d) yearly faculty research support, (e) workshop support, (f) shared programme staff for scaled initiatives (from the RIC note).
- **Impact figures now used (from public sources; please confirm or update):**
  - CoRE stack: **1,500+ villages, 9+ states, 25+ partner organisations, 500+ landscape stewards, 40+ datasets** (core-stack.org). The RIC note says ~2,000 villages; Tower Research (Apr 2026) says 1,375 villages, 19 CSOs, 5 states. The expansion of CoRE is corrected to *Commoning for Resilience and **Equality***.
  - Assistech: SmartCane used by **~150,000 people** (ICMR/NCAHT launch, Jun 2024); **19 countries** (RIC note, unverified publicly); Assistech lab c. 2007; SmartCane launched 2014 with Wellcome Trust, Phoenix Medical Systems and Saksham.
  - Gram Vaani: founded **2009**, incubated at IIT Delhi; **2.5M+ users**, **120+ districts**, **~20 states**, **12 languages**, licensed in **5 countries** (Feedback Labs, GSMA 2024).
  - Architecture and security: MARG industry sponsors (Samsung, Cadence, SRC, Intel, NXP); CoE-CSIA founded 2014 with 22 faculty from 6 departments. **Security-side industry partners and technology-transfer outcomes are still needed from faculty.**
- **Faculty lists on impact pages** (especially Assistech and architecture and security) need confirming.
- **Contact email:** the old site shows two different addresses.

## 3. Photos to request (23 placeholders)

Each placeholder in `assets/images/` is at its final size and labelled with what's needed. Send each person their files.

**CoRE stack team (Prof. Aaditeshwar Seth)**
- `images/banners/core-stack-hero.jpg` (1920×800): Landscape photo: a community planning session or field team with a tablet in a rural landscape (watershed, waterbody, farms). People's faces visible, with consent.

**CoRE stack team**
- `images/impact/core-stack-card.jpg` (1200×800): Close-up: CoRE stack / Know Your Landscape map on a phone or tablet in the field, or a striking satellite-derived map.

**Assistech lab (Prof. P. V. M. Rao / Prof. Rohan Paul)**
- `images/banners/assistech-hero.jpg` (1920×800): A blind person using SmartCane on a street, or a student reading a tactile diagram or braille display.

**Assistech lab**
- `images/impact/assistech-card.jpg` (1200×800): SmartCane, DotBook or a tactile STEM book in use; product shot acceptable.

**Gram Vaani team**
- `images/banners/gram-vaani-hero.jpg` (1920×800): Rural community members recording or listening on a basic mobile phone; a Mobile Vaani volunteer meeting.
- `images/impact/gram-vaani-card.jpg` (1200×800): A person speaking into a feature phone, or a Mobile Vaani club meeting.

**MARG (Prof. Preeti Ranjan Panda) / SPRING (Prof. Vireshwar Kumar)**
- `images/banners/architecture-security-hero.jpg` (1920×800): Lab photo: chip, FPGA or development board, students at a test bench; or a macro shot of silicon.

**MARG / SPRING**
- `images/impact/architecture-security-card.jpg` (1200×800): Board or chip close-up, or the security lab.

**SIT office / student photographers**
- `images/banners/why-sit-hero.jpg` (1920×800): Students and faculty collaborating around a whiteboard or prototype; energetic, candid.

**SIT office**
- `images/banners/about-hero.jpg` (1920×600): The SIT building exterior, ideally golden hour, or the atrium with people.
- `images/banners/research-hero.jpg` (1920×600): Researchers at work in an SIT lab or in the field.
- `images/banners/research-fellows-hero.jpg` (1920×600): A young researcher working with a mentor.
- `images/site/facilities/lab-1.jpg` (1600×1000): A laboratory in the SIT building.
- `images/site/facilities/lab-2.jpg` (1600×1000): Shared compute or hardware lab.
- `images/site/facilities/seminar-room.jpg` (1600×1000): SIT seminar room during an event.

**SIT office (can reuse flagship photos)**
- `images/banners/impact-hero.jpg` (1920×600): Montage-style field photo representing impact at scale (villages, users, devices).

**Website design team**
- `images/banners/impact-model.jpg` (1920×600): Abstract or illustrative image of growth: a seedling to a tree, a lab to the field. An illustration is welcome.
- `images/site/og-card.jpg` (1200×630): SIT logo + tagline 'Applied computing for transformative impact at scale' on brand background.

**SIT office / students**
- `images/banners/academics-hero.jpg` (1920×600): Scholars in a seminar, lab or thesis defence.

**Thrust-area faculty**
- `images/banners/area-ssd.jpg` (1600×900): Rural landscape, water and community, or a satellite-derived landscape map.
- `images/banners/area-ssc.jpg` (1600×900): Chips, data centres, microtubule microscopy, AR/VR design.
- `images/banners/area-hsc.jpg` (1600×900): Assistive devices, medical imaging with clinicians, public-health fieldwork.
- `images/banners/area-src.jpg` (1600×900): Security lab, network equipment, abstract data-privacy visual.

## 4. TODO / VERIFY markers (54)

| File | Line | Marker |
|---|---|---|
| `content/impact/architecture-and-security.md` | 11 | TODO: confirm |
| `content/impact/architecture-and-security.md` | 16 | TODO", label: "technologies transferred or integrated into products" } |
| `content/impact/architecture-and-security.md` | 34 | TODO: security-side industry and government partners |
| `content/impact/architecture-and-security.md` | 77 | TODO: add an alumni count or examples |
| `content/impact/assistech.md` | 11 | TODO: confirm current faculty group |
| `content/impact/assistech.md` | 15 | VERIFY |
| `content/impact/assistech.md` | 47 | VERIFY dates, faculty list and the 19-countries figure" |
| `content/impact/core-stack.md` | 14 | VERIFY latest |
| `content/impact/core-stack.md` | 22 | VERIFY |
| `content/impact/core-stack.md` | 25 | VERIFY |
| `content/impact/core-stack.md` | 36 | TODO: complete list and logos (assets/images/partners/) |
| `content/impact/core-stack.md` | 48 | VERIFY before launch" |
| `content/impact/gram-vaani.md` | 15 | VERIFY latest |
| `content/impact/gram-vaani.md` | 46 | VERIFY figures with Gram Vaani" |
| `content/pages/about/facilities.md` | 12 | TODO: list labs and shared infrastructure (compute servers, FPGA/emulation systems, sensing and healthcare equipment, |
| `content/pages/about/leadership.md` | 14 | TODO: a short message from the Head (100–150 words) and a photograph. |
| `content/pages/about/leadership.md` | 20 | TODO: confirm the public names of the committees (e.g. School Faculty Board, School Research Committee, Committee of Professors) |
| `content/pages/about/leadership.md` | 29 | TODO: confirm wording with the School. |
| `content/pages/about/reports.md` | 15 | TODO |
| `content/pages/academics/courses.md` | 16 | TODO: mark which courses are offered in the current year (column `offered` in data/courses.csv) and retire the rest. |
| `content/pages/academics/faq.md` | 5 | TODO items need the School office" |
| `content/pages/academics/faq.md` | 26 | TODO: SIT office email and phone." |
| `content/pages/academics/mtech-cybersecurity.md` | 12 | TODO: add programme structure, typical courses and career outcomes (2–3 short paragraphs). |
| `content/pages/academics/phd.md` | 10 | VERIFY current count (old site: ~79) |
| `content/pages/contact.md` | 5 | TODO: confirm single public email" |
| `content/pages/people/alumni.md` | 10 | TODO: add 3–4 alumni stories (column story_md) |
| `content/pages/research/centres.md` | 25 | VERIFY the full name of CoE-CSIA |
| `content/pages/research/labs.md` | 14 | TODO: the list in data/labs.csv was compiled from links on the old site; ask faculty to add their groups and logos. |
| `content/pages/why-sit/faculty.md` | 5 | VERIFY IGNITE launch status." |
| `content/pages/why-sit/faculty.md` | 21 | VERIFY: IGNITE is marked 'Draft Proposal' — publish as 'launching soon' until approved. |
| `content/pages/why-sit/partners.md` | 35 | TODO: endowment / giving information, and an alumni-giving link if available. |
| `content/pages/why-sit/partners.md` | 39 | TODO: partnerships email |
| `content/pages/why-sit/students.md` | 5 | VERIFY which items are approved and in force." |
| `content/pages/why-sit/students.md` | 14 | VERIFY: approval status of the PhD and MS(R) honorarium policies |
| `content/pages/why-sit/students.md` | 22 | VERIFY: scheme details finalised? |
| `content/pages/why-sit/students.md` | 26 | VERIFY wording |
| `content/research-areas/health-and-social-care-technologies.md` | 43 | TODO: featured entries for AI in healthcare (Chetan Arora, AIH), physiological-signal ML and aphasia therapy (Rahul Garg), |
| `content/research-areas/safe-and-responsible-computing.md` | 55 | TODO: featured entries for post-quantum cryptography (Rajendra Kumar), AI-guided code analysis (Sorav Bansal), |
| `content/research-areas/sustainability-and-social-development.md` | 33 | TODO: add featured work for the other sub-themes (urban mobility, air pollution, sustainable agriculture, community information services). |
| `content/site.yml` | 7 | TODO: request an SVG / high-resolution logo from the School office |
| `content/site.yml` | 8 | TODO: 512px PNG/SVG favicon |
| `content/site.yml` | 118 | TODO — confirm one public address (old site shows both eoaesit[@]admin.iitd.ac.in and rajeshk@cse.iitd.ac.in)" |
| `content/site.yml` | 121 | TODO: add if the School has accounts |
| `data/projects.csv` | 27 | TODO: one-line summary from the PI (currently only available as an owncloud document).,,,,R-Systems CoE for Applied AI for Sustainable Systems,, |
| `data/projects.csv` | 28 | TODO: one-line summary from the PI (currently only available as an owncloud document).,,,,R-Systems CoE for Applied AI for Sustainable Systems,, |
| `data/projects.csv` | 29 | TODO: one-line summary from the PI (currently only available as an owncloud document).,,,,R-Systems CoE for Applied AI for Sustainable Systems,, |
| `data/projects.csv` | 30 | TODO: one-line summary from the PI (currently only available as an owncloud document).,,,,R-Systems CoE for Applied AI for Sustainable Systems,, |
| `data/stats.csv` | 3 | VERIFY" |
| `data/stats.csv` | 4 | VERIFY latest" |
| `data/stats.csv` | 5 | VERIFY |

## 5. Old-site content intentionally not migrated

- 29 test, duplicate, 'DRAFT' and 'Coming soon' news entries (`archive/news/_placeholders-and-tests/`).
- Admission-interview notices with no content (ids 33, 34, 40, 71, 73, 74) and two 'RESEARCH — please click here' owncloud links (ids 49, 50).
- The 'Congratulations Dr Geeta' item (id 25), which linked to an unrelated external greeting-card site.
- Duplicate copies of the research-fellows notice (ids 43, 48, 64), merged into `/academics/research-fellows`.
- Theme assets (Bootstrap template CSS, sliders, icons) that the new design does not need; see `archive/styles/design-tokens.md` for the retained colours and fonts.
