# Website manual

How to update and look after [sit.iitd.ac.in](https://sit.iitd.ac.in). The site is a static build of this repository. Apache serves the files in `web/dist/`. There is no database and no admin screen: a change is either an edit in this repository, or a row approved in the submissions spreadsheet.

Question lists for the five forms live in `forms/google-forms.md`. Open writing tasks live in `REVIEW.md`.

## 1. Where each setting lives

The repository root is the directory that contains `package.json` and `MANUAL.md`. Paths below are relative to that directory.

| Path | Committed? | What you put there |
|---|---|---|
| `.env.example` | yes | Optional local overrides of the sheet links. Do not put secrets in this file |
| `.env` | no, git-ignored | Copy of `.env.example` only when a link should differ on your computer. A name set here wins over `forms/published-sheets.env` |
| `forms/published-sheets.env` | yes | One published-sheet link per form. Blank lines are skipped. This is the file the daily job reads |
| `.github/workflows/import-forms.yml` | yes | The daily job. It does not read `.env` and it does not use a Google Cloud account |
| `.env.deploy.example` | yes | Unused. The site is not released over SSH |
| `content/site.yml` | yes | Public site name, canonical URL, contact email, phone, social links |
| `forms/google-forms.md` | yes | The questions on each form. Form addresses are shared with colleagues directly and are not shown on the public site |
| `data/incoming/<tab>.csv` | no, git-ignored | One downloaded tab, used only by the fallback in section 5 |

### Published sheet links

Each form writes to its own response sheet. Publish that sheet to the web and paste the link into `forms/published-sheets.env`:

| Name | Form |
|---|---|
| `NEWS_SHEET_URL` | News |
| `PROJECTS_SHEET_URL` | Project |
| `EVENTS_SHEET_URL` | Event |
| `OPENINGS_SHEET_URL` | Opening |
| `ALUMNI_SHEET_URL` | Alumni update |

Leave a line blank until that form exists. The News link is already filled. These links are public, so they belong in the repository. The daily job reads this file. It does not need a Google Cloud project, a service account, or a GitHub secret.

In the sheet: File → Share → Publish to the web → Web page → that sheet only → Publish. Paste the whole link, including `gid=`. The import asks Google for the CSV of that same publication. The web page itself is a shell and does not contain the rows.

Anyone with the link can read every column on that sheet, including rows you have not marked published. Do not collect respondent email on a sheet you publish, and do not put private notes in it. A file-upload answer is a Drive link. The import downloads it when the file is shared as anyone with the link.

### Form addresses

The public pages do not link to the forms. Send the form address to colleagues by email or another internal channel.

### Public site settings

All of these are keys in `content/site.yml`:

| Key | What it is |
|---|---|
| `url` | Canonical origin, `https://sit.iitd.ac.in` |
| `contact.email` | The one public mailbox. The current value is still a TODO |
| `contact.phone` | `+91 11 2659 6056` |
| `contact.address` | Postal address in the footer |
| `social.linkedin`, `social.x`, `social.youtube` | Leave the value empty (`""`) until the School has that account |
| `logo`, `favicon`, `og_image` | Paths relative to `assets/`, written as `images/...` with no leading slash |

There is no analytics key. Adding one to `content/site.yml` fails the content check. Leave analytics out until the schema has a place for it.

### Release

The server is not reachable by SSH, and GitHub does not deploy the site. After the repository is updated, pull and build on the server. See section 7.

## 2. One-time setup

### Tools on a maintainer's computer

- Node.js 20 or newer
- pnpm 10.18.3, via Corepack: `corepack enable` then `corepack pnpm install`
- Git

From the repository root:

```bash
corepack pnpm install
corepack pnpm dev
```

The preview opens at `http://localhost:5173/`. `corepack pnpm content` checks the pages and CSVs and prints the health report. `corepack pnpm build` writes the site to `web/dist/`. `corepack pnpm preview` serves that folder at `http://localhost:4173/`.

### Google Forms and the spreadsheet

Create the five forms as `forms/google-forms.md` specifies. Optional questions may be left off. Each form can write to its own spreadsheet. Publish that response sheet and paste the link into `forms/published-sheets.env`.

On every sheet, add these columns to the right of the form responses:

| Tab | Moderator columns |
|---|---|
| `news`, `events`, `openings`, `alumni` | `status`, `moderator_note`, and any `edited_<column>` overrides |
| `projects` | `moderation` (this name is required, because the form already has a project Status question), `featured`, `moderator_note`, and any `edited_<column>` overrides |

News, events, and alumni `status` is `published` or `draft`. Openings `status` is `open`, `closed`, or `draft`. Projects `moderation` is `TRUE` or `FALSE`. A sheet with no such column leaves every existing row's visibility unchanged and adds nothing new.

Format date columns as `yyyy-mm-dd`. A value such as `05/06/2026` is read as 6 May.

The catalogue CSVs follow the sheet's column order, starting after Timestamp. Copy from the first column through `featured` (projects and news) or `status` (events, openings, and alumni) and paste into the sheet at column B. Columns after that (`id`, `published`, `last_updated`, `submitted_by`) stay in the file and are not on the sheet. An empty `image_upload` or `photo_upload` cell lines the image URL up with the sheet's URL column. Put a site path such as `/images/research/photo.png` in the image column. Dates are `YYYY-MM-DD`. A news item that only had a year or a month is dated the 1st of that month. A rolling opening has a blank deadline. Hidden news, events, and alumni use `draft`. Hidden projects use `moderation` `FALSE`. Openings that should stay listed use `open`; a filled deadline in the past is shown as closed, and `closed` marks one closed before its deadline. Hidden openings use `draft`.

A form question may omit the parenthetical note from `forms/google-forms.md`. `One-paragraph summary` matches `One-paragraph summary (shown on cards)`. The remaining words must still be the same.

A file-upload image is downloaded when the Drive file is shared as anyone with the link. The import resizes it and stores it under `assets/images/`. Each image question also has a URL column. A site path such as `/images/research/photo.png` keeps the file already in `assets/images/`. You can also paste an image URL anyone can open.

### GitHub

The workflow file is `.github/workflows/import-forms.yml`. After this repository is on GitHub with Actions enabled, GitHub runs it every day at 00:30 UTC (06:00 IST). It can also be started by hand: Actions → Import form submissions → Run workflow. A form submission does not start the job. Google does not notify GitHub. The job reads `forms/published-sheets.env` from the default branch. If every link is blank, it finishes without changing files.

## 3. Publishing through a form

Someone with an IIT Delhi account submits the form. A moderator works in the spreadsheet. The site changes only after that row is imported and the site is rebuilt.

1. Read the new row. Fix wording in an `edited_<column>` column (for example `edited_summary`). The original answer stays in place. The import uses the edited value.
2. Set `status` to `published` for news, events, and alumni, `open` for an opening, or `moderation` to `TRUE` for a project.
3. Set `featured` to `TRUE` on a project that should sort first on `/research/projects`. The home-page news band shows the latest items by date. The large home carousel is `data/hero-slides.csv`, edited by hand.
4. Wait for the 06:00 IST job, or run the workflow by hand. It opens a pull request titled `Content: N new submissions` when the CSVs changed. Merge that pull request. Then, on the server, pull and build (section 7). The live site changes when that build is what Apache serves.

Each run reads the whole sheet and merges it into the CSV already in the repository. The same title updates that CSV row. A new title is added, and the previous row stays. Rows that are only in the CSV, and not on the sheet, stay as they are.

`published`, `open`, and `TRUE` show the row. `draft` and `FALSE` keep an existing row and hide it. `closed` stores an opening as closed. A blank visibility cell updates the other fields of an existing row and leaves it shown or hidden as it already was. A new title with a blank or hidden value is not added. A blank cell keeps the current value. A cell containing only `-` clears that value. An empty image cell keeps the file; `-` in the image cell clears it. Alumni rows with the consent box unticked are ignored. Dropdown values are stored as written when they are already the CSV token.

Matching rules:

| Sheet | How a later submission updates an existing row |
|---|---|
| News, events, openings | Same title (the id is the slug of the title, at most 60 characters, cut on a word boundary) |
| Projects | The "update to an existing project" answer: current title, page link, or id. A blank answer creates a new project. Lead and co-faculty are IITD email ids (`aseth`, or `aseth@iitd.ac.in`), separated by `;`, matched to the email column in `data/people/faculty.csv`. The import stores that email id. The site shows the name. A name already in the CSV still matches |
| Alumni | Full name, matched ignoring capitalisation |

On the projects tab, the form's own Status (`ongoing`, `open-for-students`, `proposed`, `completed`) is the project state. The moderator column `moderation` is `TRUE` or `FALSE` and is stored in the CSV column `published`. `initiative` is the slug of a story under `content/impact/` (`core-stack`, `gram-vaani`, `assistech`, `computer-architecture`, `cybersecurity`). The form question is “Linked to an ongoing initiative”. Leave a cell blank to keep the current CSV value.

Imported images land in:

| Collection | File |
|---|---|
| News | `assets/images/news/<id>.<ext>` |
| Projects | `assets/images/projects/<id>.<ext>` |
| Events | `assets/images/events/<id>.<ext>` |
| Alumni photos | `assets/images/alumni/<name-slug>.<ext>` |

The import resizes the long edge to at most 2400 pixels and strips location and camera metadata. The largest accepted upload is 10 MB.

An opening imported from the form is stored as `open`. After its deadline date, the build shows it as closed. A blank deadline stays open (rolling).

News and events appear on the site when their CSV `status` is `published`. `draft` stays in the file and is omitted from the public site. A project appears when `published` is `TRUE`.

## 4. Editing the repository by hand

Work on a branch, run the local preview, and merge when the health check is clean.

| Change | Edit |
|---|---|
| A normal page | `content/pages/**.md`. The URL is the `route:` line in the front-matter |
| An impact story | `content/impact/*.md` |
| A thrust area | `content/research-areas/*.md` |
| Menu, footer, contact, colours | `content/site.yml` |
| A project, news item, event, or opening that is already in git | `data/projects.csv`, `data/news.csv`, `data/events.csv`, `data/openings.csv` |
| Faculty, students, alumni, staff, advisory board | `data/people/faculty.csv`, `data/people/students.csv`, `data/people/alumni.csv`, `data/people/staff.csv`, `data/people/advisory-board.csv` |
| Admission dates, criteria, shortlists | `data/admissions.csv`, each cycle |
| Home-page numbers, hero slides, labs, partners, courses | `data/stats.csv`, `data/hero-slides.csv`, `data/labs.csv`, `data/partners.csv`, `data/courses.csv` |
| A photograph or PDF | `assets/images/` or `assets/documents/`, then the path that points at it |

Pages and stories that rarely change are edited as markdown. News, projects, events, openings, and alumni updates normally come from the forms. Fix a typo in the CSV directly when the row is already in git.

In a markdown page:

- The public title, URL, and search description are `title`, `route`, and `description` at the top of the file.
- Link with a site path: `[Projects](/research/projects)`.
- In markdown, an image is `![Description of the photo](/images/folder/file.jpg)`. In a CSV or in front-matter, the same file is `images/folder/file.jpg` with no leading slash.
- A block of live records is a directive on its own line, such as `::projects{thrust_area="safe-and-responsible-computing"}`.
- Unfinished text goes in an HTML comment: `<!-- TODO: … -->`. A production build removes TODO and VERIFY text. `corepack pnpm content` lists every remaining marker.

Leave incentive amounts out of every page, caption, and spreadsheet cell. School policy is that those figures are not published.

Replace a placeholder photo by saving the real file at the same path listed in `assets/images/PLACEHOLDERS.csv`, then set that row's `status` to `supplied`. Heroes should be landscape. The public site shows a neutral pattern until the real file is marked supplied.

Do not edit `web/src/generated/`. The build writes it. Do not hot-link images from the old site or from Google user-content URLs. Do not add `target="_blank"` as a habit, and do not add a third-party script that sets cookies.

## 5. Import from downloaded CSVs

Use this when GitHub cannot call Google.

1. In the spreadsheet, File → Download → Comma-separated values, once per tab.
2. Save them as `data/incoming/news.csv`, `data/incoming/projects.csv`, `data/incoming/events.csv`, `data/incoming/openings.csv`, and `data/incoming/alumni.csv`. That folder is git-ignored.
3. From the repository root:

```bash
corepack pnpm import:forms --from-dir data/incoming --dry-run
corepack pnpm import:forms --from-dir data/incoming
```

The dry run prints the diff and writes nothing. The second command updates `data/news.csv`, `data/projects.csv`, `data/events.csv`, `data/openings.csv`, `data/people/alumni.csv`, and files under `assets/images/`. Commit those files. Running the import again on the same files changes nothing.

For this fallback, put images in `assets/images/<collection>/` yourself and type that path in the image column, or use an image URL anyone can open. A Drive file-upload link is downloaded only when that file is shared as anyone with the link.

## 6. Checks before a merge

```bash
corepack pnpm content
corepack pnpm dev
```

`pnpm content` must end with `Content OK`. A bad category, date, or URL names the file and the line. Draft rows and TODO markers are listed and do not fail the check.

On the local site, open the page you changed, and one neighbouring page that uses the same data (the project list, the news list, the home page). Search is rebuilt only by `corepack pnpm build`. The local dev server keeps the previous search index until that build has been run.

`corepack pnpm build` is the full production check: content, images, social cards, sitemap, redirects, HTML for every route, search index, and a scan that the public HTML contains no TODO or VERIFY text.

## 7. Releasing the site

There is no GitHub deploy workflow and no SSH copy. The server holds a checkout of this repository. After the repository has the update, on the server:

```bash
git pull
corepack pnpm install
corepack pnpm build
```

`corepack pnpm install` is only needed when dependencies changed. `corepack pnpm build` writes `web/dist/`. That folder is the whole website: one directory per page with an `index.html`, plus `assets/`, `images/`, `_img/`, `documents/`, `pagefind/`, `sitemap.xml`, `robots.txt`, `404/`, and `.htaccess`.

Photographs and banners are files in `web/dist/_img/<hash>-<width>.webp` (and a JPEG or PNG fallback). The HTML refers to them relative to the page (`../_img/...` on a nested page, `_img/...` on the home page). The build creates those files from `assets/images/`. The original files are also copied to `web/dist/images/`. A page can load while every picture is broken when `_img/` is missing or Apache cannot read it.

After each build, let Apache read the new files:

```bash
chmod o+x /home/aseth /home/aseth/core-stack /home/aseth/core-stack/sit-website /home/aseth/core-stack/sit-website/web
chmod -R o+rX /home/aseth/core-stack/sit-website/web/dist
```

Apache runs as `www-data` and cannot enter `/home/aseth` until those directories are traversable. Confirm `web/dist/_img/` contains files before reloading Apache.

### Apache

The checkout on the server is `/home/aseth/core-stack/sit-website`. Apache must serve `web/dist`, not the repository root. The same build works at the domain root (`https://sit.iitd.ac.in/`) and under a folder (`https://act4d.iitd.ac.in/sit-website/`). Pages, pictures, scripts, and styles use paths relative to the page, and the router reads the folder from the address. Do not set Vite `base` to a prefix.

Enable the modules used by the generated `.htaccess`:

```bash
sudo a2enmod rewrite headers expires deflate
```

Create `/etc/apache2/sites-available/sit.iitd.ac.in.conf`:

```apache
<VirtualHost *:80>
    ServerName sit.iitd.ac.in
    DocumentRoot /home/aseth/core-stack/sit-website/web/dist

    <Directory /home/aseth/core-stack/sit-website/web/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sit-error.log
    CustomLog ${APACHE_LOG_DIR}/sit-access.log combined
</VirtualHost>
```

`AllowOverride All` is required. The build writes `web/dist/.htaccess` from `web/public/.htaccess` and fills the redirect block from `scripts/redirects.ts`. Redirect targets have no leading slash, so they stay inside whichever folder holds `web/dist`. The file forces `https` on the current host, adds a trailing slash, redirects old URLs, and rewrites unknown paths to `404/index.html`. The rule that sends every host to `https://sit.iitd.ac.in` is commented out. Uncomment it only when this folder is the document root of `sit.iitd.ac.in`. Leave it commented on `act4d.iitd.ac.in` and on any preview that is not the public site.

If this machine terminates TLS, add a `<VirtualHost *:443>` with the same `DocumentRoot` and `Directory`, plus the certificate paths from CSC (`SSLEngine on`, `SSLCertificateFile`, `SSLCertificateKeyFile`). If CSC’s proxy already terminates TLS, keep only the port 80 block and point that proxy at this host.

Enable the site:

```bash
sudo a2ensite sit.iitd.ac.in
sudo apache2ctl configtest
sudo systemctl reload apache2
```

If this host should serve only SIT, disable the default site with `sudo a2dissite 000-default` before the reload. If CSC already has a vhost for `sit.iitd.ac.in`, change that file’s `DocumentRoot` and `Directory` instead of adding a second one.

Before building, copy the current `web/dist/` to a dated directory if you want a rollback. To roll back, point the document root at that copy.

After `git pull` and `corepack pnpm build`, view source on a nested page such as `/about/`. A picture should be `../_img/...` and the stylesheet `../assets/...`, not `/_img/...` or `/assets/...` from the host root. The home page uses `assets/...` and `_img/...` with no leading slash. Those resolve inside `/sit-website/` on the preview and inside `/` on the public site.

A one-off alternative is to set `base: '/sit-website/'` in `web/vite.config.ts` and rebuild. Every asset URL then starts with `/sit-website/`, which fixes the preview and breaks the site the moment it moves to `https://sit.iitd.ac.in/` with no prefix. The relative build above replaces that. Do not leave a hardcoded prefix in the config.

## 8. Regular maintenance

| When | What to do |
|---|---|
| Each morning, or after a form burst | Check the import pull request. Read the CSV diff. Merge it, then on the server `git pull` and `corepack pnpm build` |
| Each admission cycle | Update `data/admissions.csv`: dates, criteria links, shortlists, and `status` (`current` or `archived`) |
| When a deadline passes | Nothing, for an opening whose `deadline` is a date. The build marks it closed. Set `status` to `closed` yourself to close it early |
| When a project ends | In the sheet, submit an update with Status Completed, or edit `status` in `data/projects.csv` |
| When a portrait or hero arrives | Replace the file named in `assets/images/PLACEHOLDERS.csv` and mark it `supplied` |
| After any content edit | `corepack pnpm content`, then preview the affected pages |
| After a release | Load the changed URL on `https://sit.iitd.ac.in/`, and try one old URL such as `/frontend/vision` (it should land on `/about/vision/`) |
| Quarterly | Read the health report. Clear TODO items the School has answered. Confirm the contact email and logo in section 1 |

Old addresses such as `/phd`, `/show-news/53`, and the brochure PDF are redirected by the generated block in `.htaccess`. Add a new old-address only by editing `scripts/redirects.ts` and re-running the build. Portrait URLs under `/public/storage/faculty_images/` and `/public/storage/student_images/` answer 410 Gone.

Search, the sitemap, and the social-card images are produced by `corepack pnpm build`. They update on the public site at the next release.

## 9. When a command fails

- `pnpm content` names the CSV column and the allowed values. Fix that cell. Usual causes are a category or thrust area that is not one of the slugs in `forms/google-forms.md`, a date that is not `YYYY-MM-DD`, or a link that is not a site path or an `http(s)` URL.
- The import prints `error:` lines and does not treat that run as clean. `warning:` lines (no consent, an unmatched superseded row, a missing image) leave the rest of the import in place.
- `No published sheet URLs are set` means every line in `forms/published-sheets.env` is blank. The CSVs are left untouched. A line that names one form and is blank skips that form and imports the others.
- A form row that should have updated a project created a second project instead: the update answer did not match the current title or id. Set it to the existing id (the first column of `data/projects.csv`) and import again. Set the duplicate's `moderation` to `FALSE` if it was added.
- The HTML loads and the pictures do not. View source. A `src` or `href` that starts with `/_img/` or `/assets/` is asking the host root for a file that lives next to the HTML. Pull the current tree and run `corepack pnpm build` again so those paths are relative (`../_img/...` on a nested page). Then run the `chmod` commands in section 7. If the paths are already relative and the files 404, `web/dist/_img/` is missing or Apache cannot read it.
