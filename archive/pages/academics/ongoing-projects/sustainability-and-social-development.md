---
title: "Sustainability and Social Development (Ongoing Projects)"
source_url: "https://sit.iitd.ac.in/show-news/57"
original_nav: "Academics > Ongoing Projects > Computing for Sustainability and Social Development"
status: "scraped"
---
# Sustainability and Social Development (Ongoing Projects)

[https://sit.iitd.ac.in/show-news/53](../../research/areas/sustainability-and-social-development.md)

**Building an agentic-ready planetary scale distributed geodata structure (Aaditeshwar Seth):**

The [CoRE stack](https://core-stack.org/) has taken a novel approach to geospatial programming by providing ready-to-use pre-computed data of various landscape entities – micro-watersheds, waterbodies, forests, agroforestry plantations – organized in nested and connected spatial units, and populated with tons of datapoints about these entities to build a comprehensive place-based social-ecological understanding. Ecologists and landscape planners therefore do not need to worry about running complex geospatial workflows to generate all this data – they can rather just focus on asking the right questions from the data. These datapoints include changes over the years in cropping intensity, water-table levels, health of waterbodies, forests and plantations, welfare fund allocation, with many more under development, and can power very interesting landscape analysis of interactions between different entities. Working out the underlying data structures that can support querying this graph at scale and the programming model for data analysis can transform how we work with geospatial data. With much of this querying slated to be performed by AI-agents, it further opens up new problems in distributed systems to run such a planetary scale data structure off a hybrid federated network of cloud platforms, on-prem supernodes, and local personal nodes.

*Necessary background:* Python, data science, data structures, passion for societal impact

*What you can expect to learn:* distributed systems, performance measurement, graph and spatial databases, ML/AI applied to climate science and environmental/biodiversity monitoring, working in a team, translating technology to real-world deployment

*Who should apply*: PhD/MSR/pre-doc candidates

*Supervisor:* [Aaditeshwar Seth](https://www.cse.iitd.ernet.in/~aseth/), [aseth@iitd.ac.in](mailto:aseth@iitd.ac.in)

**Data flow and algorithm management for geospatial data processing (Aaditeshwar Seth):**

Building geospatial datasets and indicators can involve complex data flow pipelines that start with base datasets, on which algorithms including data-driven algorithms like ML models are applied, to produce new downstream datasets, on which further algorithms are applied, and so on. This results in a directed acyclic graph on which data and algorithm version control is critical to implement to manage the datasets. If a base dataset changes or an intermediate algorithm is updated, it should trigger a re-computation in impacted downstream paths. Similarly, some of these datasets are temporal in nature and need to be updated on a regular frequency. A thesis that builds out these data and algorithm standards, generalizes it to operate over the web so that the data flow and algorithm graph can span a distributed system of multiple data hosting and computation nodes, allows scaling to novel data flow and algorithm graphs built by AI agents, and implements scalable versions of many algorithms that can [leverage GPUs](https://www.cse.iitd.ernet.in/~aseth/ongoing-projects-24-25.html), will be a very relevant contribution.

More details: <https://www.cse.iitd.ernet.in/~aseth/ongoing-projects-24-25.html>, <https://core-stack.org/>

*Necessary background:* Python, data science, data structures, passion for societal impact

*What you can expect to learn:* distributed systems, performance measurement, graph and spatial databases, ML/AI applied to climate science and environmental/biodiversity monitoring, working in a team, translating technology to real-world deployment

*Who should apply*: PhD/MSR/pre-doc candidates

*Supervisor:* [Aaditeshwar Seth](https://www.cse.iitd.ernet.in/~aseth/), [aseth@iitd.ac.in](mailto:aseth@iitd.ac.in)
