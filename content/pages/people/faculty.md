---
title: "Faculty"
route: "/people/faculty"
description: "Joint, associated, adjunct and visiting faculty of SIT, IIT Delhi."
review: "data in data/people/faculty.csv"
---

# Faculty

SIT faculty hold **joint** or **associated** appointments alongside their home departments at IIT Delhi, and are joined by **adjunct and visiting** faculty from AIIMS, Microsoft, STMicroelectronics, UMBC and elsewhere. Filter by thrust area to find people working on what interests you.

::people{source="faculty" filter="active=TRUE" group_by="category" group_order="joint,associated,adjunct-visiting" filters="thrust_areas" search="true"}

## Former faculty

::people{source="faculty" filter="active=FALSE" layout="compact" collapsed="true"}
