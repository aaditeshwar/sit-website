---
title: "Alumni"
route: "/people/alumni"
description: "PhD and MS (Research) alumni of SIT, IIT Delhi, and their thesis work."
review: "data in data/people/alumni.csv"
---

# Alumni

More than **80 PhD and MS (Research) graduates** have gone on to research, industry, entrepreneurship and public service. <!-- TODO: add 3–4 alumni stories (column story_md) -->

::alumni-stories{source="alumni" filter="story_md!=" limit="4"}

::people{source="alumni" group_by="programme" group_order="phd,msr" sort="graduation_year:desc" layout="table" columns="name,graduation_year,thesis_title" search="true"}
