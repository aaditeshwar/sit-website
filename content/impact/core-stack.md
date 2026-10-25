---
title: "CoRE stack"
slug: "core-stack"
route: "/impact/core-stack"
tagline: "From student projects on satellite data to an open digital public infrastructure that helps rural communities plan for water security"
thrust_area: "sustainability-and-social-development"
current_stage: "ecosystem"
order: 1
hero_image: "images/banners/core-stack-hero.jpg"
card_image: "images/impact/core-stack-card.jpg"
faculty: ["Aaditeshwar Seth", "Parag Singla", "Abhilash Jindal", "Tarun Mangla"]
website: "https://core-stack.org/"
metrics:
  - { value: "1,500+", label: "villages where community plans draw on CoRE stack data" }      # core-stack.org, Oct 2026; RIC note says ~2,000 — VERIFY latest
  - { value: "9+", label: "Indian states" }
  - { value: "500+", label: "landscape stewards, field workers and community resource persons using the tools" }
  - { value: "25+", label: "collaborating organisations in the network" }
  - { value: "40+", label: "curated geospatial datasets, all open" }
  - { value: "80+", label: "participants at the second Landscape Solvability Workshop (Dec 2025)" }
timeline:
  - stage: project
    period: "c. 2020–2022"            # VERIFY
    text: "Student theses and course projects in the ACT4D group apply machine learning to satellite imagery to map land use, cropping intensity, waterbodies and groundwater change across India. The projects grow out of years of field engagement with rural communities and civil society."
  - stage: initiative
    period: "2022–2024"               # VERIFY
    text: "With philanthropic and CSR support, including from Tower Research Capital, the research outputs are rebuilt as an open, layered stack: pre-computed datasets on nested micro-watersheds, community planning tools such as Commons Connect, and public APIs. Partners such as PRADAN and the Foundation for Ecological Security take the tools to the field."
  - stage: ecosystem
    period: "2025 onwards"
    text: "A network of 25+ organisations, a developer community and annual innovation challenges, and work in 1,500+ villages across 9+ states. The stack is positioned to shape how government and civil society use geospatial data for community-led, equitable natural-resource management."
partners:
  - { name: "Tower Research Capital", role: "CSR partner" }
  - { name: "PRADAN", role: "field partner (Commons Connect, Jharkhand)" }
  - { name: "Foundation for Ecological Security", role: "field partner" }
  - { name: "SUPPORT (Jharkhand)", role: "field partner" }
  - { name: "University of Cambridge (Anil Madhavapeddy)", role: "research collaboration on geospatial AI" }
  # TODO: complete list and logos (assets/images/partners/)
related_projects: ["agentic-ready-planetary-scale-distributed-geodata-structure", "data-flow-and-algorithm-management-for-geospatial-data", "framework-for-comprehensive-assessment-of-social-ecological"]
links:
  - { label: "core-stack.org", href: "https://core-stack.org/" }
  - { label: "Data explorer", href: "https://explorer.core-stack.org/" }
  - { label: "Code on GitHub", href: "https://github.com/core-stack-org" }
  - { label: "Landscape Solvability Workshop", href: "https://core-stack.org/landscape-solvability-workshop/" }
sources:
  - "https://core-stack.org/ (accessed 24 Oct 2026)"
  - "https://tower-research.com/empowering-rural-india-towers-core-stack-partnership-with-iit-delhi/ (Apr 2026)"
  - "https://www.fossunited.org/c/indiafoss/2025/cfp/8h350au2vu"
  - "SIT RIC workshop note, Oct 2026"
review: "expanded with web research (24 Oct 2026); numbers from core-stack.org — VERIFY before launch"
---

## The problem

India's rural communities depend on land and water that are under growing stress. Groundwater tables are falling, waterbodies are silting up, forests and commons are degrading, and climate change is making rainfall less predictable. Every year, large public programmes and civil-society organisations fund watershed works, plantations and water structures. Yet the communities who must choose *what* to build *where*, and who must look after these assets afterwards, rarely have data about their own landscape. The data exists in satellite archives and hydrological models, but it is locked behind specialised geospatial workflows that few people outside research labs can run.

The result is ad hoc planning: works chosen without evidence, benefits that are uneven, and assets that are not maintained.

## What we built

The **CoRE stack** (*Commoning for Resilience and Equality*) is an open, community-centred **digital public infrastructure for climate adaptation in rural India**. It rests on a simple premise. Technology for communities should be designed to be *used and managed by communities*, so that it fits the local context and strengthens local institutions rather than replacing them. Its use-cases come from the field, are built in the lab and go back to the field.

The stack has four layers:

1. **Geospatial data.** Machine learning and computer vision are applied to satellite and drone imagery, alongside hydrological models, to produce India-wide layers tracking change over the years. The layers cover land use and land cover, cropping intensity, water-table levels and groundwater stress, the health of waterbodies, forests and plantations, soil health (at 30 m resolution), and allocations from welfare funds. The data is pre-computed and organised around **nested, connected landscape units** such as micro-watersheds, waterbodies, forests and villages, so that users can ask questions rather than run pipelines.
2. **Analytics.** These layers feed socio-ecological indicators and decision logics, which identify recurring patterns such as a drought-prone, groundwater-stressed micro-watershed where cropping is intensifying.
3. **Community tools.** **Know Your Landscape** lets anyone explore their landscape's data. **Commons Connect** supports community-based planning, all the way to detailed project reports for water and land works. An **ecological restoration toolkit** offers site identification, bioacoustics analysis, drone-based tree-species mapping and continuous ecological monitoring.
4. **Funding integration.** Plug-ins connect community demands and plans to public and private funding for landscapes, so that community stewardship can be resourced.

Everything is **open**: code on GitHub, data in a public explorer and on Google Earth Engine, documented APIs and metadata specifications (including **STACD**, a STAC extension for reproducible data-processing pipelines that now generates all CoRE stack data), and detailed methodology manuals.

## How it grew

::timeline

The CoRE stack is a clear example of SIT's path from project to initiative to ecosystem. It **started as several student projects** on remote sensing for land and water. **Philanthropic capital** then turned the research outputs into products, and over roughly a year and a half these **scaled to well over a thousand villages**. Today the CoRE stack sits inside a growing ecosystem of civil-society organisations, researchers, developers and funders, and is well placed to influence how government uses geospatial data for natural-resource management.

## Impact

::metrics

- **Evidence-based village plans.** Field workers and community resource persons use CoRE stack tools to draft sustainable land and water plans in more than 1,500 villages across states including Jharkhand, Odisha, Rajasthan, Bihar and Karnataka. For example, **PRADAN** uses Commons Connect in Ramgarh district, Jharkhand, integrated with its own planning platform.
- **A convening role.** The **Landscape Solvability Workshops** at IIT Delhi bring practitioners, researchers and technologists together around shared data. In November 2024, more than 50 participants from 20 organisations built decision logics, data-driven storylines and learning tools for community stewards. In December 2025 the second workshop drew more than 80 attendees.
- **An open innovation community.** Innovation challenges (from November 2025), weekly developer calls and a monthly community of practice invite others to build on the stack. Contributions from the first challenge received follow-on support. Hackathons with collaborators such as the University of Cambridge explore new geospatial AI models.
- **Recognition.** The CoRE stack was a top-20 finalist in the *AI for ALL* challenge at the India AI Summit.

## What's next

The team is building **agentic-ready, planetary-scale geodata structures**, so that AI agents and planners can query the landscape graph at scale over a federated network of cloud, institutional and personal nodes. It is also developing **data-flow and algorithm management standards**, so that thousands of datasets stay reproducible and up to date as their inputs change. Both are open to PhD, MS (Research) and pre-doctoral researchers.

::projects{ids="related_projects"}

[Visit core-stack.org →](https://core-stack.org/) · [Explore the data →](https://explorer.core-stack.org/) · [Join the team →](/openings)
