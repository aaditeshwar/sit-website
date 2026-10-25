# Images

All paths in markdown (`/images/...`) and in CSV / front-matter (`images/...`) are relative to this `assets/` folder.

| Folder | Contents | Status |
|---|---|---|
| `logos/` | SIT logo (455×120 PNG) and favicon (16×16) | from old site; **request an SVG logo and a 512 px favicon** |
| `people/faculty/`, `people/students/`, `people/admin-staff/` | portraits named after the person | from old site |
| `research/` | figures from the research-area pages | from old site |
| `site/` | old home banner, people-section icons, **og-card.jpg** (placeholder), **facilities/** (placeholders) | mixed |
| `banners/` | page and impact-story heroes, thrust-area images | **placeholders** |
| `impact/` | impact-story card images | **placeholders** |
| `news/`, `events/`, `projects/`, `labs/`, `partners/`, `people/alumni/`, `people/staff/` | filled by Google-Form imports or by hand | empty |

## Placeholders, and how to request real photos

Every image the new design needs but the School hasn't supplied yet already exists as a **labelled placeholder at its exact final size**. It states its dimensions, its file path, what photo is wanted, and whom to ask. Hero placeholders also mark the area where the page title will be overlaid, so the photo's subject can be kept clear of it.

The full list is **`PLACEHOLDERS.csv`** (path, width, height, used on, brief, request from). To request photos, filter the CSV by `request_from` and send each person their placeholders. They can see exactly what's needed.

To replace a placeholder, save the real photo **at the same path, at least the same size and in landscape format**, then set its `status` to `supplied` in `PLACEHOLDERS.csv`. The site never shows a labelled placeholder to the public: production builds swap in a neutral generated pattern until the real photo arrives (see `plan.md` §7.6).

Photo guidance: natural light, real people at work (with consent), minimal on-image text, JPG at quality 80–85, under 1 MB for heroes. Placeholders are regenerated with `tools/make_placeholders.py`.
