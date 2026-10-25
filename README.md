# sit.iitd.ac.in — content repository

Content for the new website of the **Amar Nath and Shashi Khosla School of Information Technology (SIT), IIT Delhi**. The site is a React app that renders everything in this repository as a static, pre-rendered website served by Apache. **`plan.md` is the implementation brief for Cursor.**

## What's here

| Path | What it is | How it changes |
|---|---|---|
| `content/site.yml` | navigation, footer, contact, theme colours | edit directly |
| `content/pages/**.md` | every static page; `route:` in front-matter sets the URL | edit directly |
| `content/impact/*.md` | the four flagship impact stories (project → initiative → ecosystem) | edit directly |
| `content/research-areas/*.md` | the four thrust areas for 2025–2035 | edit directly |
| `data/projects.csv` | all projects: ongoing, open for students, proposed, completed | **Google Form** + edits |
| `data/news.csv`, `events.csv`, `openings.csv` | news, events, openings | **Google Forms** |
| `data/people/*.csv` | faculty, students, alumni, staff, advisory board | edits; alumni via **Google Form** |
| `data/admissions.csv` | current admission cycle: dates, criteria, shortlists | edit each cycle |
| `data/stats.csv`, `hero-slides.csv`, `labs.csv`, `partners.csv`, `courses.csv` | home-page numbers, banners, labs, partners, courses | edit directly |
| `assets/images/`, `assets/documents/` | images and PDFs (see `assets/images/README.md` for what's still needed) | add files |
| `forms/google-forms.md` | exact questions for each Google Form and the CSV column each maps to | reference |
| `plan.md` | detailed build plan for the React app, the Forms import and Apache deployment | reference |
| `REVIEW.md` | rewrites to review, policy points to confirm, every TODO/VERIFY marker | work list |
| `archive/` | the old site, scraped on 23 Oct 2026, as markdown (for comparison) | read-only |
| `tools/` | scripts used to scrape the old site and build this repo | reference |

## Writing conventions (short version, full rules in `plan.md` §3 and §6)

- Images in markdown: `![Alt text](/images/folder/file.jpg)`. In CSV and front-matter: `images/folder/file.jpg`.
- Link to pages by route: `[Projects](/research/projects)`. Filters can go in the URL: `/research/projects?status=open-for-students`.
- Embed live data with a directive on its own line, for example `::projects{thrust_area="safe-and-responsible-computing"}` or `::people{source="faculty" filter="active=TRUE"}`.
- Small inline structures use a fenced block named after the component (```` ```yaml faq ````), with a YAML list inside.
- Put anything unfinished in an HTML comment `<!-- TODO: … -->` or mark a value `TODO`. These never show on the live site and are listed in the health report.
- **Do not publish amounts for incentives** (School policy).

## Status

Operating instructions, including the published sheet links, are in `MANUAL.md`. The live site updates when you `git pull` and `corepack pnpm build` on the server. Open writing tasks are in `REVIEW.md`. `plan.md` is the build brief.
