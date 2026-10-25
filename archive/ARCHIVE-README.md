# sit.iitd.ac.in — scraped content archive

Scraped from the live site on **23 Oct 2026** (raw mirror produced by `sit_scrape.py`, converted by `tools/build_archive.py`).
Every file carries the `source_url` it came from in its front-matter.

## Layout

```
site-map.md                 navigation hierarchy (top bar, mega-menu, hidden menu items, footer)
pages/                      one markdown file per page, foldered by the current menu hierarchy
  home.md, contact.md
  about/ people/ research/areas/ academics/{programmes,ongoing-projects}/ admissions/ coe/
news/                       real news/notices (show-news/N pages that are not menu pages)
  _placeholders-and-tests/  test, duplicate, 'DRAFT', 'Coming soon' and stub items (not for migration)
data/people/*.csv           faculty, students, alumni, admin staff — structured, one row per person
images/logos/               logo + favicon
images/people/<group>/      portraits, renamed to the person's name
images/research/            figures embedded in research-area pages
images/site/                home banner, people-section icons
documents/                  PDFs hosted on sit.iitd.ac.in itself (brochure)
styles/                     design tokens + the SIT-specific original CSS
```

Linking policy: images and documents hosted **on sit.iitd.ac.in** are stored locally. Figures on research pages
were pasted from Google Docs and live on `lh7-rt.googleusercontent.com` with expiring keys, so they are also stored
locally. **Everything on other domains (owncloud, faculty home pages, core-stack.org, IRD, manage.iitd.ac.in, csia…)
is linked to its origin URL**, not downloaded.

## Page inventory

| Current menu location | Archive file | Source | Status |
|---|---|---|---|
| Home | `pages/home.md` | https://sit.iitd.ac.in/ | ok |
| About > Vision | `pages/about/vision.md` | https://sit.iitd.ac.in/frontend/vision | ok |
| People | `pages/people/index.md` | https://sit.iitd.ac.in/people | ok |
| Research | `pages/research/index.md` | https://sit.iitd.ac.in/research | empty |
| Research > Sustainability and Social Development | `pages/research/areas/sustainability-and-social-development.md` | https://sit.iitd.ac.in/show-news/53 | ok |
| Research > Sustainable and Scalable Computing | `pages/research/areas/sustainable-and-scalable-computing.md` | https://sit.iitd.ac.in/show-news/54 | ok |
| Research > Health and Social Care Technologies | `pages/research/areas/health-and-social-care-technologies.md` | https://sit.iitd.ac.in/show-news/55 | ok |
| Research > Safe and Responsible Computing | `pages/research/areas/safe-and-responsible-computing.md` | https://sit.iitd.ac.in/show-news/56 | ok |
| Academics > Degree Programs > PhD Program | `pages/academics/programmes/phd.md` | https://sit.iitd.ac.in/phd | ok |
| Academics > Degree Programs > MS (by Research) Program | `pages/academics/programmes/ms-research.md` | https://sit.iitd.ac.in/msr | ok |
| Academics > Degree Programs > M.Tech. in Cybersecurity | `pages/academics/programmes/mtech-cybersecurity.md` | https://sit.iitd.ac.in/mtechcs | ok |
| Academics > Research fellows | `pages/academics/research-fellows.md` | https://sit.iitd.ac.in/show-news/47 | ok |
| Academics > Ongoing Projects > Computing for Sustainability and Social Development | `pages/academics/ongoing-projects/sustainability-and-social-development.md` | https://sit.iitd.ac.in/show-news/57 | ok |
| Academics > Ongoing Projects > Sustainable and Scalable Computing | `pages/academics/ongoing-projects/sustainable-and-scalable-computing.md` | https://sit.iitd.ac.in/show-news/58 | ok |
| Academics > Ongoing Projects > Health and Social Care Technologies | `pages/academics/ongoing-projects/health-and-social-care-technologies.md` | https://sit.iitd.ac.in/show-news/59 | ok |
| Academics > Ongoing Projects > Safe and Responsible Computing | `pages/academics/ongoing-projects/safe-and-responsible-computing.md` | https://sit.iitd.ac.in/show-news/60 | ok |
| Academics > Admissions > Latest Admissions Info | `pages/admissions/latest-admissions-info.md` | https://sit.iitd.ac.in/admission | ok |
| Academics > Admissions > How to Apply | `pages/admissions/how-to-apply.md` | https://sit.iitd.ac.in/how | ok |
| Footer > Courses (not in main menu) | `pages/academics/courses.md` | https://sit.iitd.ac.in/courses | ok |
| CoE > R-Systems CoE | `pages/coe/r-systems-coe.md` | https://sit.iitd.ac.in/show-news/63 | ok |
| Contact | `pages/contact.md` | https://sit.iitd.ac.in/contact | ok |
| People > Faculty | `pages/people/faculty.md` | https://sit.iitd.ac.in/faculty | 63 entries |
| People > Students | `pages/people/students.md` | https://sit.iitd.ac.in/students | 46 entries |
| People > Alumni | `pages/people/alumni.md` | https://sit.iitd.ac.in/alumni | 91 entries |
| People > Administrative Staff | `pages/people/admin-staff.md` | https://sit.iitd.ac.in/adminstaff | 4 entries |
| People > Research Staff | `pages/people/research-staff.md` | https://sit.iitd.ac.in/researchstaff | empty |

## News: 33 real items, 29 placeholders/tests

| id | category | title | file |
|---|---|---|---|
| 2 | placeholder | Glyn Hughes to Take the Reins of TIACA as Its First Director General | `news/_placeholders-and-tests/002-glyn-hughes-to-take-the-reins-of-tiaca-as-its-first-director-general.md` |
| 3 | placeholder | Volga-Dnepr Group strengthens its Global Healthcare Team | `news/_placeholders-and-tests/003-volga-dnepr-group-strengthens-its-global-healthcare-team.md` |
| 4 | placeholder | Volga-Dnepr Group strengthens its Global Healthcare Team | `news/_placeholders-and-tests/004-volga-dnepr-group-strengthens-its-global-healthcare-team.md` |
| 5 | placeholder | Air France KLM Martinair Cargo ready to distribute Covid-19 vaccines | `news/_placeholders-and-tests/005-air-france-klm-martinair-cargo-ready-to-distribute-covid-19-vaccines.md` |
| 6 | achievement | Dr. Manik Varma wins Shanti Swarup Bhatnagar Award | `news/006-dr-manik-varma-wins-shanti-swarup-bhatnagar-award.md` |
| 7 | achievement | Suman Muralikrishnan wins FITT Award | `news/007-suman-muralikrishnan-wins-fitt-award.md` |
| 8 | announcement | SIT hosts new M. Tech. program on Cybersecurity | `news/008-sit-hosts-new-m-tech-program-on-cybersecurity.md` |
| 9 | announcement | New Website launched! | `news/009-new-website-launched.md` |
| 10 | achievement | SIT PhD students win prestigious PMRF and Google Fellowships | `news/010-sit-phd-students-win-prestigious-pmrf-and-google-fellowships.md` |
| 11 | achievement | PhD student win prestigious PMRF Fellowship | `news/011-phd-student-win-prestigious-pmrf-fellowship.md` |
| 12 | achievement | Siddharth Shrivastava PhD scholar wins prestigious PMRF Fellowship | `news/012-siddharth-shrivastava-phd-scholar-wins-prestigious-pmrf-fellowship.md` |
| 13 | achievement | Anshul Mittal PhD scholar wins prestigious Google Fellowship | `news/013-anshul-mittal-phd-scholar-wins-prestigious-google-fellowship.md` |
| 14 | achievement | Arnab Mondal PhD scholar wins prestigious PMRF Fellowship | `news/014-arnab-mondal-phd-scholar-wins-prestigious-pmrf-fellowship.md` |
| 15 | achievement | Ayushi Agarwal PhD scholar wins prestigious PMRF Fellowship | `news/015-ayushi-agarwal-phd-scholar-wins-prestigious-pmrf-fellowship.md` |
| 16 | admissions-notice | Interview Date | `news/016-interview-date.md` |
| 17 | placeholder | ICTD group | `news/_placeholders-and-tests/017-ictd-group.md` |
| 18 | placeholder | ICTD group | `news/_placeholders-and-tests/018-ictd-group.md` |
| 19 | placeholder | ICTD group | `news/_placeholders-and-tests/019-ictd-group.md` |
| 20 | placeholder | Assistec group | `news/_placeholders-and-tests/020-assistec-group.md` |
| 21 | placeholder | Medical lab group | `news/_placeholders-and-tests/021-medical-lab-group.md` |
| 22 | placeholder | IoT group | `news/_placeholders-and-tests/022-iot-group.md` |
| 23 | achievement | Batch of 1969 Innovation Fellow Award 2022 | `news/023-batch-of-1969-innovation-fellow-award-2022.md` |
| 24 | admissions-notice | MS (Research) / Ph.D. Interview | `news/024-ms-research-ph-d-interview.md` |
| 25 | achievement | Congratulations! Dr. Geeta on achieving your doctorate | `news/025-congratulations-dr-geeta-on-achieving-your-doctorate.md` |
| 26 | placeholder | ICTD Lab | `news/_placeholders-and-tests/026-ictd-lab.md` |
| 27 | placeholder | Medical Application of IT | `news/_placeholders-and-tests/027-medical-application-of-it.md` |
| 28 | placeholder | Medical Application of IT | `news/_placeholders-and-tests/028-medical-application-of-it.md` |
| 29 | placeholder | Medical Application of IT | `news/_placeholders-and-tests/029-medical-application-of-it.md` |
| 30 | placeholder | Medical Application of IT | `news/_placeholders-and-tests/030-medical-application-of-it.md` |
| 31 | placeholder | Medical Application of IT | `news/_placeholders-and-tests/031-medical-application-of-it.md` |
| 32 | achievement | A paper Published in ACM Computing Survey | `news/032-a-paper-published-in-acm-computing-survey.md` |
| 33 | admissions-notice | MSR / PhD Interview | `news/033-msr-phd-interview.md` |
| 34 | admissions-notice | MS (Research) / Ph.D. interview | `news/034-ms-research-ph-d-interview.md` |
| 35 | event | 5 days workshop on Cyber Security | `news/035-5-days-workshop-on-cyber-security.md` |
| 36 | opportunity | ANNOUNCEMENT | `news/036-announcement.md` |
| 37 | placeholder | Announcement | `news/_placeholders-and-tests/037-announcement.md` |
| 38 | placeholder | Announcement | `news/_placeholders-and-tests/038-announcement.md` |
| 39 | opportunity | Announcement | `news/039-announcement.md` |
| 40 | admissions-notice | Announcement | `news/040-announcement.md` |
| 42 | event | Landscape Solvability Workshop | `news/042-landscape-solvability-workshop.md` |
| 43 | opportunity | Announcement | `news/043-announcement.md` |
| 44 | placeholder | Happy New Year 2024 | `news/_placeholders-and-tests/044-happy-new-year-2024.md` |
| 45 | placeholder | Happy New Year 2025 | `news/_placeholders-and-tests/045-happy-new-year-2025.md` |
| 46 | opportunity | Advertisement  for Sr Project Scientist & Sr Project Assistant (Tech) on contractual basis | `news/046-advertisement-for-sr-project-scientist-sr-project-assistant-tech-on-co.md` |
| 48 | opportunity | Preparatory Research Fellows Programme | `news/048-preparatory-research-fellows-programme.md` |
| 49 | announcement | RESEARCH | `news/049-research.md` |
| 50 | announcement | RESEARCH | `news/050-research.md` |
| 51 | placeholder | Coming Soon | `news/_placeholders-and-tests/051-coming-soon.md` |
| 52 | placeholder | Coming Soon | `news/_placeholders-and-tests/052-coming-soon.md` |
| 61 | placeholder | DRAFT | `news/_placeholders-and-tests/061-draft.md` |
| 62 | placeholder | DRAFT | `news/_placeholders-and-tests/062-draft.md` |
| 64 | opportunity | Preparatory Research Fellows Programme | `news/064-preparatory-research-fellows-programme.md` |
| 65 | event | PhD Viva Voce presentaiton by Dr Krithika Rangarajan | `news/065-phd-viva-voce-presentaiton-by-dr-krithika-rangarajan.md` |
| 66 | placeholder | DRAFT | `news/_placeholders-and-tests/066-draft.md` |
| 67 | placeholder | DRAFT | `news/_placeholders-and-tests/067-draft.md` |
| 68 | placeholder | DRAFT | `news/_placeholders-and-tests/068-draft.md` |
| 69 | placeholder | DRAFT | `news/_placeholders-and-tests/069-draft.md` |
| 70 | placeholder | DRAFT | `news/_placeholders-and-tests/070-draft.md` |
| 71 | admissions-notice | MSR - PhD Admission | `news/071-msr-phd-admission.md` |
| 72 | event | Edge AI and Inference on ARM Platforms — A Practical Approach IIT Delhi and ARM | `news/072-edge-ai-and-inference-on-arm-platforms-a-practical-approach-iit-delhi-.md` |
| 73 | admissions-notice | M.S. (Research) / Ph.D. Interview | `news/073-m-s-research-ph-d-interview.md` |
| 74 | admissions-notice | M.S. (Research) / Ph.D. Interview | `news/074-m-s-research-ph-d-interview.md` |

## People data

- `data/people/faculty.csv`: 63 rows (groups: Adjunct and Visiting Faculty, Associated Faculty, Former SIT Faculty, Head of the School, Joint Faculty)
- `data/people/students.csv`: 46 rows (groups: MS (Research) Students, PhD Students)
- `data/people/alumni.csv`: 91 rows (groups: MS (Research), PhD)
- `data/people/admin-staff.csv`: 4 rows (groups: )
- `data/people/research-staff.csv`: 0 rows — page empty on live site

## Issues noticed on the live site (worth fixing in the new site)

- `Research` landing page, `Research Staff` page and the home-page *News & Announcements* carousel are **empty**.
- *Advisory Board* tile on the People page links nowhere; there is no advisory-board content anywhere.
- News pages carry **no dates** (the publish-date line is commented out), so chronology is lost; ids give rough order only.
- ~30 `show-news` entries are tests ('Volga-Dnepr Group…', 'TEST'), duplicates, 'DRAFT' or 'Coming soon' stubs.
- Research-fellow announcement exists in 4 near-identical copies (ids 43, 47, 48, 64).
- Contact email differs between Contact page (`rajeshk@cse.iitd.ernet.in`) and footer (`eoaesit[@]admin.iitd.ernet.in`); old `ernet.in` domains throughout.
- Head of School appears twice on the Faculty page (as Head and as Joint Faculty) with different profile links.
- Several alumni have placeholder images (`BLANK_*.jpg`) or broken image paths; these were skipped.
- Footer copyright says 2020; brochure is 2023-24; courses list mixes 1-credit special modules with retired courses.
- Many key documents (admission criteria, shortlists, R-Systems CoE project descriptions, research summaries) sit behind owncloud links rather than on the site.
- Research-area figures are hot-linked from Google Docs (`lh7-rt.googleusercontent.com`) and will eventually break.

## External documents linked from the site (4) — kept as origin links

- http://core-stack.org/wp-content/uploads/2024/11/know-your-landscape-oct-2024.pdf
- https://manage.iitd.ac.in/public/storage/uploads/School%20of%20IT%20&%20CoE-CSIA%20Courses_1727939016.pdf
- https://www.cse.iitd.ernet.in/~aseth/research-at-act4d.pdf
- https://www.cse.iitd.ernet.in/~aseth/research_associate_position_eo.pdf

## All outbound links found (239)

<details><summary>expand</summary>

- http://abhilash-jindal.com/
- http://abhilash-jindal.com/assets/popper
- http://anshulmittal.org/
- http://csc.iitd.ac.in/
- http://cse.iitd.ernet.in/popper/
- http://linkedin.com/in/dhruvi-goyal/
- http://linkedin.com/in/sagar-singh-726104149
- http://manikvarma.org/
- http://sorav.compiler.ai/
- http://web.iitd.ac.in/~sumeet/
- http://www.cse.iitd.ac.in/~aseth/
- http://www.cse.iitd.ac.in/~diksha/
- http://www.cse.iitd.ac.in/~geetayadav/
- http://www.cse.iitd.ac.in/~ramanath/
- http://www.cse.iitd.ac.in/~saroj/
- http://www.cse.iitd.ac.in/~srsarangi
- http://www.cse.iitd.ac.in/~sumantra
- http://www.cse.iitd.ac.in/~vijay/
- http://www.cse.iitd.ernet.in/~anshul/
- http://www.cse.iitd.ernet.in/~bnj/
- http://www.cse.iitd.ernet.in/~chetan/
- http://www.cse.iitd.ernet.in/~kolin/Kolins_Web_Home/My_Home.html
- http://www.cse.iitd.ernet.in/~mausam/
- http://www.cse.iitd.ernet.in/~mbala/
- http://www.cse.iitd.ernet.in/~panda/
- http://www.cse.iitd.ernet.in/~parags/
- http://www.cse.iitd.ernet.in/~pkalra/
- http://www.cse.iitd.ernet.in/~rahulgarg/
- http://www.cse.iitd.ernet.in/~rijurekha/
- http://www.cse.iitd.ernet.in/~sanjiva/
- http://www.cse.iitd.ernet.in/~saran/
- http://www.cse.iitd.ernet.in/~srikanta/
- http://www.cse.iitd.ernet.in/~suban/
- http://www.cse.iitd.ernet.in/~subodh/
- http://www.tapangandhi.com/
- https://abhilash-jindal.com/
- https://agarwal-ayushi.github.io/
- https://anweshb.github.io/
- https://assistech.iitd.ac.in/
- https://cbme.iitd.ac.in/faculty-profile/19
- https://chemistry.iitd.ac.in/faculty/jayaram.html
- https://chemistry.iitd.ac.in/faculty/ramaswamy.html
- https://compiler.ai/
- https://core-stack.org/
- https://core-stack.org/landscape-solvability-workshop/
- https://core-stack.org/openings-software-engineer-geospatial-technologies/
- https://csia.iitd.ac.in/
- https://dl.acm.org/doi/10.1145/3584944
- https://dms.iitd.ac.in/faculity_type/prof-m-p-gupta/
- https://docs.google.com/forms/d/e/1FAIpQLSdlSt7gtg7unvqykephxUkA_8c3G-L1OjGzyaXW8g_80EhBmg/viewform
- https://ee.iitd.ac.in/faculty-profile/16
- https://embeddedvisionsummit.com/archive/archive/speaker/vinod-kathail/
- https://en.wikipedia.org/wiki/Ram_Sewak_Sharma
- https://forms.gle/Fgrjtj4cxAhGHa79A
- https://garimachhikara128.github.io/
- https://github.com/anannyamathur
- https://home.iitd.ac.in/
- https://home.iitd.ac.in/curriculum.php
- https://home.iitd.ac.in/piyush-interview.php
- https://homecse.iitd.ac.in/team/aaditeshwar-seth/
- https://homecse.iitd.ac.in/team/adarsh-barik/
- https://homecse.iitd.ac.in/team/piyush-kumar-sharma/
- https://iitd.irins.org/profile/16660
- https://in.linkedin.com/in/anshumitts
- https://in.linkedin.com/in/arathi-nair-m-3a0844166
- https://in.linkedin.com/in/arnab-mondal-a4448a18
- https://in.linkedin.com/in/chayanika-bhattacharjee-961209193
- https://in.linkedin.com/in/dr-b-chandra-192523141
- https://in.linkedin.com/in/dr-pankaj-gupta-8ab31323
- https://in.linkedin.com/in/radhikad
- https://kr.linkedin.com/in/jackinx
- https://linkedin.com/in/aman-bhardwaj-iitd/?originalSubodomain=in
- https://linkedin.com/in/saurjain
- https://linkedin.com/in/shreyansh-jain-4b9615229
- https://marg.iitd.ac.in/
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/2BNgDiL6iNEirA8
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/2zNd3xxFZAPCPr3
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/8HqMgf2ALHrdwzx
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/JxoH6KeRiw6Q9QN
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/K862xF5DMpoAgiD
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/MkS7rR9dgWafpkB
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/WSPa9bKJMZL6Zi9
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/bcqgdnDBD2SDsQq
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/egTW28pEfbQpjfH
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/iN4C3YD82pFa2X5
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/iW8wXf8P3YW2jGg
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/nQZddmb7qi8M6qa
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/pa9Za96tRL3EaTb
- https://owncloud.iitd.ac.in/nextcloud/index.php/s/tsxWfnds5ebwCd6
- https://plaksha.edu.in/faculty-details/dr-anupam-sobti
- https://profile.iitd.ac.in//~kodamana/HariprasadKodamana.html
- https://researchportal.helsinki.fi/en/persons/ashwin-rao
- https://rohanrd.github.io/
- https://sandeep007734.github.io/
- https://satyamjay-iitd.github.io/
- https://scholar.google.co.in/citations?user=oKrfw8QAAAAJ&hl=en
- https://scholar.google.com/citations?user=9oW4S-8AAAAJ&hl=en
- https://sites.google.com/site/danishcontractor1/home
- https://sites.google.com/site/jharshan
- https://sites.google.com/view/prathosh
- https://sites.google.com/view/rajendrak/home
- https://sites.google.com/view/sme-faculty/faculty/manish-agarwal?authuser=0
- https://spring.iitd.ac.in/
- https://ssklearns.tech/
- https://subodhvsharma.github.io/
- https://sumitdiware.github.io/
- https://tarunmangla.github.io/
- https://textile.iitd.ac.in/faculty-detail.php?faculty_id=21
- https://vijaykeswani.github.io/
- https://web.iitd.ac.in/~achawla/
- https://web.iitd.ac.in/~avaidya/
- https://web.iitd.ac.in/~gosain/
- https://web.iitd.ac.in/~jay/
- https://web.iitd.ac.in/~kbeedkar/
- https://web.iitd.ac.in/~niladri/
- https://web.iitd.ac.in/~pvmrao/
- https://web.iitd.ac.in/~santanuc/
- https://web.iitd.ac.in/~sumeet/
- https://www.aiims.edu/index.php?option=com_content&amp;view=article&amp;id=1409&lang=en
- https://www.amity.edu/faculty-detail.aspx?facultyID=785
- https://www.bits-pilani.ac.in/hyderabad/dipanjan/Profile
- https://www.cse.iitb.ac.in/~vinayr/
- https://www.cse.iitd.ac.in/~bhalla/
- https://www.cse.iitd.ac.in/~gayathri/index.html
- https://www.cse.iitd.ac.in/~narain/
- https://www.cse.iitd.ac.in/~panda/
- https://www.cse.iitd.ac.in/~rijurekha/
- https://www.cse.iitd.ac.in/~rohanpaul/
- https://www.cse.iitd.ac.in/~rohanpaul/bio.html
- https://www.cse.iitd.ac.in/~shashank/
- https://www.cse.iitd.ac.in/~srsarangi
- https://www.cse.iitd.ac.in/~vijay/
- https://www.cse.iitd.ac.in/~vikas/
- https://www.cse.iitd.ac.in/~viresh/
- https://www.cse.iitd.ernet.in/~aseth/
- https://www.cse.iitd.ernet.in/~aseth/index.html
- https://www.cse.iitd.ernet.in/~aseth/ongoing-projects-24-25.html
- https://www.cse.iitd.ernet.in/~aseth/phd-topics-24-25.html
- https://www.cse.iitd.ernet.in/~viresh/
- https://www.csee.umbc.edu/~joshi/
- https://www.fsm.ac.in/peoples/faculty/prof-rakhi-tripathi
- https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7009.753137414139!2d77.18843032519435!3d28.54342952981189!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1df6b9055fb5%3A0x81c10b266b1ea3c0!2sIndian%20Institute%20of%20Technology%20Delhi!5e0!3m2!1sen!2sin!4v1584627293739!5m2!1sen!2sin
- https://www.hipeac.net/~sohan/
- https://www.iiitd.ac.in/piyus
- https://www.kalralab.org/
- https://www.linkedin.com/in/aayush-singha-roy-062a8612a/?originalSubdomain=in
- https://www.linkedin.com/in/abhinav-nagpal/
- https://www.linkedin.com/in/abhishrut-vaidya/
- https://www.linkedin.com/in/aditi-bhateja-a33718123/?originalSubdomain=in
- https://www.linkedin.com/in/aditi-kapoor-824250a/?originalSubdomain=in
- https://www.linkedin.com/in/agarwalpuneet/?originalSubdomain=in
- https://www.linkedin.com/in/akashdeep-bansal-47128127/
- https://www.linkedin.com/in/aman-bhardwaj-iitd/?originalSubdomain=in
- https://www.linkedin.com/in/amber-hayat-5248b422/?originalSubdomain=in
- https://www.linkedin.com/in/amit-prasad-951081119/?originalSubdomain=in
- https://www.linkedin.com/in/anamitrasingha/?originalSubdomain=in
- https://www.linkedin.com/in/anant-vishnoi/
- https://www.linkedin.com/in/aneja/
- https://www.linkedin.com/in/ankit-singhal-ab258618/?originalSubdomain=in
- https://www.linkedin.com/in/anureet-chhabra-bb86271bb?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app
- https://www.linkedin.com/in/apezoidal/
- https://www.linkedin.com/in/arghachakraborty92/?originalSubdomain=in
- https://www.linkedin.com/in/arunkumarjindal/
- https://www.linkedin.com/in/ashima-mittal-iitd/
- https://www.linkedin.com/in/b-shanker-jaiswal-151590189/?originalSubdomain=in
- https://www.linkedin.com/in/britty-baby-85735118/?originalSubdomain=in
- https://www.linkedin.com/in/bsharatcv/
- https://www.linkedin.com/in/chahat-bansal-dec23/?originalSubdomain=in
- https://www.linkedin.com/in/chakresh-sahu-9a012b5a/
- https://www.linkedin.com/in/chetan-madan
- https://www.linkedin.com/in/dr-aruna-bansal-55830a5b/?trk=public_post_main-feed-card_reshare_feed-actor-image&originalSubdomain=in
- https://www.linkedin.com/in/dr-priti-jagwani-21923a12/?originalSubdomain=in
- https://www.linkedin.com/in/dr-shubhani-gupta-ab105765/?originalSubdomain=in
- https://www.linkedin.com/in/hameedah-sultan-70373561/
- https://www.linkedin.com/in/harshit-budhiraja-68b4a8166/
- https://www.linkedin.com/in/heba-s-80021436b/
- https://www.linkedin.com/in/himali-bajaj/
- https://www.linkedin.com/in/iam-manoj
- https://www.linkedin.com/in/ierum-imam-0449046/
- https://www.linkedin.com/in/jaspreet-bhatia-490a981a/
- https://www.linkedin.com/in/jigyasa-gupta-9359a445/?originalSubdomain=in
- https://www.linkedin.com/in/joydeep-ray-6263b9187?utm_source=share_via&utm_content=profile&utm_medium=member_android
- https://www.linkedin.com/in/kinshuk-sarabhai-13628a22/?originalSubdomain=in
- https://www.linkedin.com/in/krithika-rangarajan-65586039/?originalSubdomain=in
- https://www.linkedin.com/in/kunaldahiya/?originalSubdomain=in
- https://www.linkedin.com/in/kunaldargan/?originalSubdomain=in
- https://www.linkedin.com/in/kuntal-dey-536b9730/?originalSubdomain=in
- https://www.linkedin.com/in/kushal-pal-singh-78b2771a/?originalSubdomain=in
- https://www.linkedin.com/in/maheshchowdhary/
- https://www.linkedin.com/in/manoj-jain-37ba2538/?originalSubdomain=in
- https://www.linkedin.com/in/mansimanjrekar/
- https://www.linkedin.com/in/moksh-malhotra/
- https://www.linkedin.com/in/naman-jain-18288b5b/
- https://www.linkedin.com/in/namitasharma6/
- https://www.linkedin.com/in/narayan-ji-mishra-10b48222a/?originalSubdomain=in
- https://www.linkedin.com/in/nath-priyanka/?originalSubdomain=in
- https://www.linkedin.com/in/nikki-tiwari-53668520b/
- https://www.linkedin.com/in/nishant-bugalia/
- https://www.linkedin.com/in/nishant-gupta-iitd/?originalSubdomain=in
- https://www.linkedin.com/in/nishtha-madaan-21017541/
- https://www.linkedin.com/in/niveditayadav/
- https://www.linkedin.com/in/prajjwalprem/
- https://www.linkedin.com/in/pramod-batni-96ab413?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app
- https://www.linkedin.com/in/pratibhajagnere/?originalSubdomain=my
- https://www.linkedin.com/in/priyanka-chauhan-40362b223/?originalSubdomain=in
- https://www.linkedin.com/in/priyankas05/?originalSubdomain=in
- https://www.linkedin.com/in/purvesh-bhole-001781259
- https://www.linkedin.com/in/rachit-thukral
- https://www.linkedin.com/in/raheen-junaid-wani-b03ba5205/
- https://www.linkedin.com/in/rajkumar-vishwakarma-07446312/?originalSubdomain=in
- https://www.linkedin.com/in/ramya-hebbalaguppe-620b272/?originalSubdomain=in
- https://www.linkedin.com/in/richa-gupta-5a75ba5a/?originalSubdomain=in
- https://www.linkedin.com/in/richa-sharma-b432709/?originalSubdomain=in
- https://www.linkedin.com/in/samiksha-agarwal-24588162/?originalSubdomain=in
- https://www.linkedin.com/in/sanket-uppin-9b06b86a/?originalSubdomain=in
- https://www.linkedin.com/in/saurabh-gupta-9786b320/?originalSubdomain=in
- https://www.linkedin.com/in/sheetal-50a80524a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app
- https://www.linkedin.com/in/shikha-goel-50521960/?originalSubdomain=in
- https://www.linkedin.com/in/shivamkr6?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app
- https://www.linkedin.com/in/shivani-a-mehta-403597127/?originalSubdomain=in
- https://www.linkedin.com/in/shreya-jayaraj/
- https://www.linkedin.com/in/sidharth-ranjan-0541ba24/?originalSubdomain=in
- https://www.linkedin.com/in/sonali-rout-621925227
- https://www.linkedin.com/in/srishti-kulshrestha-875a0a65/?originalSubdomain=in
- https://www.linkedin.com/in/subharshi-roy
- https://www.linkedin.com/in/sukhrajs/?originalSubdomain=in
- https://www.linkedin.com/in/sumit-n-47262413/
- https://www.linkedin.com/in/sunita-tiwari-84a5a28/?originalSubdomain=in
- https://www.linkedin.com/in/tajamul221/?originalSubdomain=in
- https://www.linkedin.com/in/udit-r-iiitm/
- https://www.linkedin.com/in/varunkumarinvent/?originalSubdomain=in
- https://www.linkedin.com/in/vikrant-kapila-24961427/?originalSubdomain=sg
- https://www.linkedin.com/in/vinkle-srivastav/?originalSubdomain=fr
- https://www.linkedin.com/in/yash-narendra-044b5b103/
- https://www.linkedin.com/posts/drpankajdikshit_digitalindia-data-share-activity-7023212191742836737-SeOE?originalSubdomain=sn
- https://www.ncaht.in/
- https://www.neilom.org/neilom-prize/suman-muralikrishnan/
- https://www.tandfonline.com/doi/full/10.1080/02687038.2026.2653029
- https://www.tuko.co.ke/406164-phd-congratulations-messages-quotes-card-graduation-instagram.html

</details>
