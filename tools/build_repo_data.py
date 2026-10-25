#!/usr/bin/env python3
"""Generate data/*.csv and assets/ for the new SIT website content repo from the scraped archive."""
import csv, os, re, shutil, sys

ARC = sys.argv[1]   # sit-content-archive
REPO = sys.argv[2]  # sit-website-content

def w(rel, rows, fields):
    p = os.path.join(REPO, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", newline="", encoding="utf8") as f:
        wr = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        wr.writeheader()
        for r in rows:
            wr.writerow({k: r.get(k, "") for k in fields})

def r(rel):
    return list(csv.DictReader(open(os.path.join(ARC, rel), encoding="utf8")))

# ---------------------------------------------------------------- images
for sub in ["people/faculty", "people/students", "people/admin-staff", "research", "logos", "site"]:
    src = os.path.join(ARC, "images", sub)
    dst = os.path.join(REPO, "assets/images", sub)
    if os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
os.makedirs(os.path.join(REPO, "assets/documents"), exist_ok=True)
shutil.copy2(os.path.join(ARC, "documents/sit-brochure-2023-24.pdf"), os.path.join(REPO, "assets/documents/"))
for d in ["impact", "banners", "news", "events", "projects", "labs", "partners", "people/alumni", "people/staff"]:
    os.makedirs(os.path.join(REPO, "assets/images", d), exist_ok=True)

def img(p):  # archive path images/... -> repo path relative to assets/
    return p if not p else p  # already "images/..."

# ---------------------------------------------------------------- faculty
AREA = {"ssd": "sustainability-and-social-development", "ssc": "sustainable-and-scalable-computing",
        "hsc": "health-and-social-care-technologies", "src": "safe-and-responsible-computing"}
FAC_AREAS = {  # only where the scraped research/project pages name the faculty member
    "Aaditeshwar Seth": "ssd;hsc", "Abhilash Jindal": "ssc;src", "Rijurekha Sen": "ssc;src",
    "Kaustubh Beedkar": "ssc;src", "Preeti Ranjan Panda": "ssc", "Aarat P. Kalra": "ssc",
    "Smruti Ranjan Sarangi": "ssc", "Kolin Paul": "ssc;hsc;src", "Maya Ramanath": "ssc",
    "Sumeet Agarwal": "hsc", "P V M Rao": "hsc", "Rohan Paul": "hsc", "Chetan Arora": "hsc",
    "Rahul Garg": "hsc", "Vireshwar Kumar": "src", "Sorav Bansal": "src", "Piyush Kumar Sharma": "src",
    "Subodh Sharma": "src", "Rajendra Kumar": "src",
}
CAT = {"Joint Faculty": "joint", "Associated Faculty": "associated",
       "Adjunct and Visiting Faculty": "adjunct-visiting", "Former SIT Faculty": "former"}
fac = []
for row in r("data/people/faculty.csv"):
    if row["group"] == "Head of the School":
        continue                       # duplicate of the Joint Faculty entry; role column carries it
    whole = (row["degree"] + " " + row["research_interests"]).strip()
    whole = re.sub(r"\s+", " ", whole)
    deg, interests = "", whole
    m = re.match(r"^((?:Ph\.?\s?D|D\.?\s?Phil|Sc\.?D|ph\.D|M\.B\.B\.S)[^)]*\)(?:\s*,[^)]*\))?)\s*(.*)$", whole, re.I)
    if m and len(m.group(1)) < 90:
        deg, interests = m.group(1), m.group(2)
    if "M.B.B.S" in whole:
        deg, interests = "M.B.B.S., M.Ch., D.N.B., M.N.A.M.S.", whole.split("M.N.A.M.S.", 1)[-1].strip()
    name = row["name"]
    aff = ""
    m2 = re.match(r"(.*?)\s*\(([^)]+)\)$", name)
    if m2:
        name, aff = m2.group(1), m2.group(2)
    name = " ".join(x.capitalize() if x.isupper() or x.islower() else x for x in name.split())
    areas = ";".join(AREA[a] for a in FAC_AREAS.get(name, "").split(";") if a)
    fac.append({
        "name": name, "category": CAT[row["group"]],
        "role": "Head of School" if name == "Aaditeshwar Seth" else "",
        "affiliation": aff or ("IIT Delhi" if CAT[row["group"]] != "adjunct-visiting" else ""),
        "degree": deg, "research_interests": interests.strip(" ,"), "thrust_areas": areas,
        "profile_url": row["profile_url"].replace("&amp;", "&"), "email": "",
        "photo": row["photo"], "display_order": "", "active": "FALSE" if row["group"] == "Former SIT Faculty" else "TRUE",
    })
w("data/people/faculty.csv", fac, ["name", "category", "role", "affiliation", "degree", "research_interests",
                                   "thrust_areas", "profile_url", "email", "photo", "display_order", "active"])

# ---------------------------------------------------------------- students / alumni / staff
PROG = {"PhD Students": "phd", "MS (Research) Students": "msr", "PhD": "phd", "MS (Research)": "msr"}
stu = [{"name": s["name"], "programme": PROG.get(s["group"], s["group"]), "research_interests": s["research_interests"],
        "supervisor": "", "thrust_areas": "", "profile_url": s["profile_url"], "photo": s["photo"],
        "year_joined": "", "active": "TRUE"} for s in r("data/people/students.csv")]
w("data/people/students.csv", stu, ["name", "programme", "research_interests", "supervisor", "thrust_areas",
                                    "profile_url", "photo", "year_joined", "active"])
alu = [{"name": a["name"], "programme": PROG.get(a["group"], a["group"]), "graduation_year": a["year"],
        "thesis_title": a["thesis_or_area"], "supervisor": "", "current_position": "", "profile_url": a["profile_url"],
        "photo": "", "story_md": ""} for a in r("data/people/alumni.csv")]
w("data/people/alumni.csv", alu, ["name", "programme", "graduation_year", "thesis_title", "supervisor",
                                  "current_position", "profile_url", "photo", "story_md"])
staff = [{"name": s["name"], "type": "administrative", "designation": s["designation"], "email": "", "phone": "",
          "photo": s["photo"], "active": "TRUE"} for s in r("data/people/admin-staff.csv")]
w("data/people/staff.csv", staff, ["name", "type", "designation", "email", "phone", "photo", "active"])
w("data/people/advisory-board.csv", [], ["name", "designation", "organisation", "profile_url", "photo", "display_order"])

# ---------------------------------------------------------------- projects
P = []
def proj(**k):
    k.setdefault("status", "ongoing"); k.setdefault("stage", "project"); k.setdefault("featured", "FALSE")
    s = re.sub(r"[^a-z0-9]+", "-", k["title"].lower()).strip("-")
    k["id"] = k.get("id") or (s[:60].rsplit("-", 1)[0] if len(s) > 60 else s)
    P.append(k)

# Ecosystem / initiative-scale flagships (also have impact case studies)
proj(title="CoRE stack: digital public infrastructure for climate adaptation in rural communities",
     thrust_area=AREA["ssd"], stage="ecosystem", status="ongoing", featured="TRUE",
     summary="An open technology stack that turns satellite, drone and hydrology data into actionable insights and tools that help rural communities plan for water security and sustainable landscapes.",
     faculty="Aaditeshwar Seth", partners="Network of development and ecological-restoration organisations",
     website="https://core-stack.org/", image="images/research/sustainability-and-social-development-1.png",
     impact_story="core-stack", seeking="PhD;MSR;Predoc;RA;Software engineer")
proj(title="Assistive Technologies Laboratory (Assistech)", thrust_area=AREA["hsc"], stage="ecosystem", featured="TRUE",
     summary="Research, product design and scaling of assistive technologies — navigation, braille displays, tactile graphics and AI-based assistants — for persons with disabilities.",
     faculty="P V M Rao;Rohan Paul;Piyush Chanana", website="https://assistech.iitd.ac.in/",
     image="images/research/health-and-social-care-technologies-2.jpg", impact_story="assistech")
proj(title="Energy-efficient computing and system-on-chip architecture", thrust_area=AREA["ssc"], stage="initiative",
     summary="Next-generation memory systems, AI/ML hardware and 3D chip stacking, developed in close collaboration with industry for integration into products.",
     faculty="Preeti Ranjan Panda", website="https://marg.iitd.ac.in/",
     image="images/research/sustainable-and-scalable-computing-2.png", impact_story="architecture-and-security")
proj(title="Security and Privacy Innovation Group (SPRING)", thrust_area=AREA["src"], stage="initiative",
     summary="ML-based intrusion detection for cyber-physical systems, lightweight authentication for constrained devices, and privacy-preserving techniques for sensitive data.",
     faculty="Vireshwar Kumar", website="https://spring.iitd.ac.in/",
     image="images/research/safe-and-responsible-computing-1.png", impact_story="architecture-and-security")

# Research-area projects (scraped research pages)
proj(title="Immunisation uptake modelling and data collation", thrust_area=AREA["hsc"],
     summary="Geospatial machine learning and statistical computing to locate pockets of under-vaccination and explain their behavioural and social drivers.",
     faculty="Sumeet Agarwal;Aaditeshwar Seth", partners="University of Montreal;London School of Hygiene and Tropical Medicine",
     image="images/research/health-and-social-care-technologies-1.jpg")
proj(title="Systems for sustainable machine learning", thrust_area=AREA["ssc"],
     summary="Improving latency, throughput and cost of ML inference serving so that the shift from training to inference does not cost the planet.",
     faculty="Abhilash Jindal;Rijurekha Sen;Kaustubh Beedkar", website="http://abhilash-jindal.com/assets/popper",
     image="images/research/sustainable-and-scalable-computing-1.png")
proj(title="Biomaterial-based computing", thrust_area=AREA["ssc"],
     summary="Fabricating computing devices from protein polymers such as microtubules — reading, storing and converting photochemical information for green computing.",
     faculty="Aarat P. Kalra", website="https://www.kalralab.org/", image="images/research/sustainable-and-scalable-computing-3.png")
proj(title="ML-based technologies for industrial design", thrust_area=AREA["ssc"],
     summary="Generative-AI and GPU-accelerated simulation to automatically produce PCB and 3D engineering designs.",
     faculty="Smruti Ranjan Sarangi", image="images/research/sustainable-and-scalable-computing-4.jpg")
proj(title="AR/VR for Industry 4.0", thrust_area=AREA["ssc"],
     summary="A new kind of 3D design tool that combines AR, VR, haptics and LLMs so engineers can 'design 3D in 3D'.",
     faculty="Smruti Ranjan Sarangi", image="images/research/sustainable-and-scalable-computing-5.jpg")
proj(title="Federated data discovery", thrust_area=AREA["src"],
     summary="Privacy-preserving search and intelligent indexing so valuable datasets can be found across organisations without centralising them, in line with GDPR and India's DPDP Act.",
     faculty="Kaustubh Beedkar", image="images/research/safe-and-responsible-computing-2.png")
proj(title="Compliant data systems", thrust_area=AREA["src"],
     summary="Making regulatory compliance a first-class citizen in how data is stored, processed and queried.",
     faculty="Kaustubh Beedkar", image="images/research/safe-and-responsible-computing-3.png")

# Ongoing projects open to students (scraped 'Ongoing Projects' pages)
proj(title="Agentic-ready planetary-scale distributed geodata structure", thrust_area=AREA["ssd"], status="open-for-students",
     summary="Data structures and a programming model for querying a planetary-scale graph of landscape entities — largely by AI agents — over a federated network of cloud, on-prem and personal nodes.",
     faculty="Aaditeshwar Seth", contact_email="aseth@iitd.ac.in", seeking="PhD;MSR;Predoc",
     background="Python, data science, data structures, passion for societal impact", website="https://core-stack.org/")
proj(title="Data flow and algorithm management for geospatial data processing", thrust_area=AREA["ssd"], status="open-for-students",
     summary="Version control and recomputation standards for DAGs of datasets and algorithms that span distributed hosting and compute nodes, including GPU-scaled algorithms.",
     faculty="Aaditeshwar Seth", contact_email="aseth@iitd.ac.in", seeking="PhD;MSR;Predoc",
     background="Python, data science, data structures, passion for societal impact",
     website="https://www.cse.iitd.ernet.in/~aseth/ongoing-projects-24-25.html")
proj(title="Cost-effective and sustainable ML workflows (Popper)", thrust_area=AREA["ssc"], status="open-for-students",
     summary="Abstractions that let programmers trade off runtime, cost and accuracy in LLM workflows, and make them incremental.",
     faculty="Abhilash Jindal;Kaustubh Beedkar", sponsor="R Systems CoE on Sustainable AI", seeking="Predoc;PhD;MSR",
     background="Python, systems performance, SQL; optional: dataflow systems, provenance, distributed systems",
     website="http://cse.iitd.ernet.in/popper/")
proj(title="Very low-power SLAM on small drones", thrust_area=AREA["ssc"], status="open-for-students",
     summary="Real-time localisation and mapping in GPS-denied environments under a 5 W power cap, using spiking neural networks on neuromorphic hardware.",
     faculty="Kolin Paul", seeking="Predoc;PhD;MSR", background="Computer architecture basics, HDL, some ML")
proj(title="Quantum compute transpiler", thrust_area=AREA["ssc"], status="open-for-students",
     summary="Mapping classical Boolean functions through reversible logic synthesis to efficient circuits for 2-D nearest-neighbour qubit arrays.",
     faculty="Kolin Paul", seeking="Predoc;PhD;MSR", background="C/C++, compilers, back-end optimisation, physical CAD, LLVM")
proj(title="Energy-efficient multimodal search in data lakes", thrust_area=AREA["ssc"], status="open-for-students",
     summary="Reducing the energy cost of embedding and retrieving across structured, semi-structured and unstructured data.",
     faculty="Maya Ramanath", contact_email="ramanath@cse.iitd.ac.in", seeking="PhD;MSR",
     background="Machine learning architectures; database systems")
proj(title="Computer vision and foundation models for healthcare and mobility", thrust_area=AREA["hsc"], status="open-for-students",
     summary="Cancer detection, surgical video intelligence and driver assistance, deployed with AIIMS Delhi, PGI Chandigarh, Honda, Yamaha and others.",
     faculty="Chetan Arora", partners="AIIMS Delhi;PGI Chandigarh;Honda;Yamaha", seeking="PhD;MSR;Predoc",
     website="https://aih-iitd.github.io/")
proj(title="Real-time genomic classification from nanopore reads on edge hardware", thrust_area=AREA["hsc"], status="open-for-students",
     summary="A co-designed streaming pipeline that calls species from raw nanopore signal in under 60 seconds at under 30 W, for point-of-care diagnostics.",
     faculty="Kolin Paul", seeking="PhD;MSR", background="Interest in sequencing, computer architecture and systems")
proj(title="LLM-based mobile applications for aphasia diagnosis and therapy", thrust_area=AREA["hsc"], status="open-for-students",
     summary="Building on a Hindi adaptation of Melodic Intonation Therapy developed with AIIMS Delhi, evaluating LLM-based mobile apps for diagnosis and treatment.",
     faculty="Rahul Garg", partners="AIIMS Delhi", seeking="MSR;PhD;Predoc",
     background="ML, programming, mobile app development, LLMs, interest in medical applications")
proj(title="Machine learning on physiological data", thrust_area=AREA["hsc"], status="open-for-students",
     summary="Open, reproducible, medical-grade models on ECG and PPG data — atrial fibrillation, rhythm monitoring, non-invasive glucose estimation, stroke-type detection.",
     faculty="Rahul Garg", partners="AIIMS Delhi", seeking="MSR;PhD;Predoc", background="ML/DL, programming, interest in medical applications")
proj(title="AI-guided code analysis and optimisation", thrust_area=AREA["src"], status="open-for-students",
     summary="Coupling AI models with dataflow analysis and formal methods to find safety and security defects, optimise performance and transpile to quantum circuits.",
     faculty="Sorav Bansal", website="https://compiler.ai/", seeking="PhD;MSR")
proj(title="Verifying distributed storage systems", thrust_area=AREA["src"], status="open-for-students",
     summary="Scaling model checkers and proof tools to gray and metastable failures, with LLM-based proof agents to reduce verification effort.",
     faculty="Subodh Sharma;Abhilash Jindal", seeking="Predoc;PhD;MSR",
     background="Reasoning about correctness and performance; optional: distributed systems, model checking")
proj(title="Tamper-evident reproducible executions", thrust_area=AREA["src"], status="open-for-students",
     summary="A container abstraction that lets a verifier independently reproduce experiments that depend on remote services such as LLM APIs.",
     faculty="Rijurekha Sen;Abhilash Jindal", seeking="Predoc;PhD;MSR", background="Operating systems; optional: seccomp, confidential computing")
proj(title="Privacy-enhancing technologies and the online fraud ecosystem", thrust_area=AREA["src"], status="open-for-students",
     summary="Analysing VPNs, Tor and mixnets, regional app security and privacy, and building defences against online scams.",
     faculty="Piyush Kumar Sharma", contact_email="piyush@iitd.ac.in", website="https://www.piyushs.in/",
     seeking="Predoc;PhD;MSR", background="Applied networking, coding and scripting")

# R-Systems CoE projects
for t, link in [("Accessible indoor information and navigation system with AI", "https://owncloud.iitd.ac.in/nextcloud/index.php/s/bcqgdnDBD2SDsQq"),
                ("Energy-efficient on-chip AI accelerators", "https://owncloud.iitd.ac.in/nextcloud/index.php/s/2BNgDiL6iNEirA8"),
                ("Automatic selection of models for cost-effective and sustainable ML workflows", "https://owncloud.iitd.ac.in/nextcloud/index.php/s/JxoH6KeRiw6Q9QN"),
                ("Framework for comprehensive assessment of social-ecological systems", "https://owncloud.iitd.ac.in/nextcloud/index.php/s/nQZddmb7qi8M6qa")]:
    area = AREA["hsc"] if "navigation" in t else AREA["ssd"] if "social-ecological" in t else AREA["ssc"]
    proj(title=t, thrust_area=area, sponsor="R-Systems CoE for Applied AI for Sustainable Systems", website=link,
         summary="TODO: one-line summary from the PI (currently only available as an owncloud document).")

# Example proposed project (template row)
proj(title="EXAMPLE — Proposed project seeking collaborators", thrust_area=AREA["ssd"], stage="project", status="proposed",
     summary="Delete this row. Proposed ideas are listed publicly with the label 'Seeking collaborators'.",
     faculty="Name of lead faculty", seeking="Collaborators;Funding", published="FALSE")

PROJ_FIELDS = ["id", "title", "thrust_area", "stage", "status", "summary", "description_md", "faculty", "partners",
               "sponsor", "seeking", "background", "contact_email", "website", "image", "impact_story",
               "start_year", "featured", "published", "last_updated"]
for p in P:
    p.setdefault("published", "TRUE"); p.setdefault("last_updated", "2026-10-23")
w("data/projects.csv", P, PROJ_FIELDS)

# ---------------------------------------------------------------- news
N = [
 ("2026-10", "announcement", "SIT launches annual Research-to-Impact Collaboration (RIC) workshops",
  "The first RIC workshop brings faculty from across IIT Delhi together to turn promising projects into initiatives, and initiatives into ecosystem-level change.", "", "draft", "TRUE"),
 ("2026", "achievement", "Three PhD graduates in 2026: Rohan Raju Dhanakshirur, Chahat Bansal and Ayushi Agarwal",
  "Congratulations to our 2026 PhD graduates, whose theses span AI in healthcare, satellite-based development monitoring and hardware accelerators.", "", "draft", "FALSE"),
 ("2025-08", "event", "IIT Delhi and Arm workshop: Edge AI and inference on Arm platforms",
  "A three-day hands-on workshop (22–24 August 2025) for college and university teachers in engineering, CS, electronics and AI/ML.",
  "https://docs.google.com/forms/d/e/1FAIpQLSdlSt7gtg7unvqykephxUkA_8c3G-L1OjGzyaXW8g_80EhBmg/viewform", "published", "FALSE"),
 ("2025-01", "announcement", "Preparatory Research Fellows Programme launched",
  "A funded 6–12 month research fellowship, with no GATE requirement, that prepares capable candidates for admission to SIT's MS (Research) and PhD programmes.",
  "/academics/research-fellows", "published", "TRUE"),
 ("2025-01-31", "event", "PhD viva: Dr Krithika Rangarajan on deep learning in breast-cancer imaging in India",
  "Thesis work on detection networks trained on Indian mammography data, a generative training tool for radiology residents, and a rapid reporting tool evaluated in clinical practice.", "", "published", "FALSE"),
 ("2024-11", "event", "Landscape Solvability Workshop on CoRE stack data and tools",
  "Over 50 participants from 20 organisations spent three days (5–7 November 2024) designing data, decision logics and learning tools that community stewards can use to plan for their landscapes.",
  "https://core-stack.org/landscape-solvability-workshop/", "published", "TRUE"),
 ("2024-06", "event", "Five-day workshop on cybersecurity",
  "A five-day workshop on cybersecurity from 10 June 2024, coordinated by Prof. Kolin Paul and Prof. Vireshwar Kumar.",
  "https://owncloud.iitd.ac.in/nextcloud/index.php/s/egTW28pEfbQpjfH", "published", "FALSE"),
 ("2023", "achievement", "Survey on device fingerprinting for cyber-physical systems published in ACM Computing Surveys",
  "PhD scholar Vijay Kumar and Prof. Kolin Paul's survey is published in ACM Computing Surveys.",
  "https://dl.acm.org/doi/10.1145/3584944", "published", "FALSE"),
 ("2022", "achievement", "PhD scholar Subhani receives the Batch of 1969 Innovation Fellow Award",
  "Recognising the CompilerAI Labs effort to turn research on a certified compiler and AI-based deep semantic code analyser into a product prototype, under the guidance of Prof. Sorav Bansal.",
  "https://compiler.ai/", "published", "FALSE"),
 ("2021", "achievement", "SIT PhD scholars win PMRF and Google PhD Fellowships",
  "Arnab Mondal, Ayushi Agarwal and Siddharth Shrivastava received the Prime Minister's Research Fellowship, and Anshul Mittal the Google PhD Fellowship.", "", "published", "FALSE"),
 ("2021", "announcement", "New interdisciplinary M.Tech. in Cybersecurity",
  "SIT hosts a new interdisciplinary M.Tech. programme in Cybersecurity from academic year 2021–22, with CSE, EE, Mathematics and Management Studies.",
  "https://csia.iitd.ac.in/", "published", "FALSE"),
 ("2020", "achievement", "Dr Manik Varma wins the Shanti Swarup Bhatnagar Prize",
  "SIT adjunct faculty member and Microsoft Distinguished Scientist Dr Manik Varma receives the Bhatnagar Prize in Engineering Sciences (2019) for contributions to machine learning and computer vision.",
  "https://www.microsoft.com/en-us/research/blog/everything-you-always-wanted-to-know-about-extreme-classification-but-were-afraid-to-ask/", "published", "FALSE"),
 ("2020", "achievement", "Suman Muralikrishnan wins FITT Award for best industry-relevant thesis",
  "MS (Research) student Suman Muralikrishnan's thesis is recognised with the FITT Award.", "", "published", "FALSE"),
]
news = []
for i, (d, c, t, s, link, st, feat) in enumerate(N):
    s_ = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    news.append({"id": s_[:60].rsplit("-", 1)[0] if len(s_) > 60 else s_, "date": d, "category": c, "title": t,
                 "summary": s, "body_md": "", "link": link, "image": "", "thrust_area": "", "featured": feat,
                 "status": st, "submitted_by": "migrated from old site" if st == "published" else "draft by website team"})
w("data/news.csv", news, ["id", "date", "category", "title", "summary", "body_md", "link", "image", "thrust_area",
                          "featured", "status", "submitted_by"])

# ---------------------------------------------------------------- events / openings / admissions
EV = [
 {"id": "ric-workshop-2026", "title": "Research-to-Impact Collaboration (RIC) Workshop 2026", "type": "workshop",
  "start_date": "2026-10", "end_date": "", "venue": "SIT, IIT Delhi", "audience": "IIT Delhi faculty and invited collaborators",
  "summary": "Sessions on new projects, initiatives seeking co-owners, and ecosystem roadmaps — a place to form collaborations for a larger mission.",
  "registration_url": "", "status": "draft"},
 {"id": "edge-ai-arm-2025", "title": "Edge AI and Inference on Arm Platforms — A Practical Approach", "type": "workshop",
  "start_date": "2025-08-22", "end_date": "2025-08-24", "venue": "IIT Delhi", "audience": "College and university teachers",
  "summary": "Hands-on faculty development workshop with Arm.", "registration_url": "", "status": "published"},
 {"id": "viva-krithika-rangarajan", "title": "PhD viva voce: Utility of deep learning in breast-cancer imaging in India",
  "type": "talk", "start_date": "2025-01-31", "end_date": "", "venue": "Seminar Room, SIT Building", "audience": "Open",
  "summary": "Dr Krithika Rangarajan's PhD defence.", "registration_url": "", "status": "published"},
 {"id": "landscape-solvability-2024", "title": "Landscape Solvability Workshop", "type": "workshop", "start_date": "2024-11-05",
  "end_date": "2024-11-07", "venue": "IIT Delhi", "audience": "Ecological restoration and development organisations",
  "summary": "50+ participants from 20 organisations; six working-session breakouts on CoRE stack data and tools.",
  "registration_url": "https://core-stack.org/landscape-solvability-workshop/", "status": "published"},
 {"id": "cybersecurity-workshop-2024", "title": "Five-day workshop on cybersecurity", "type": "workshop",
  "start_date": "2024-06-10", "end_date": "2024-06-14", "venue": "IIT Delhi", "audience": "",
  "summary": "Coordinated by Prof. Kolin Paul and Prof. Vireshwar Kumar.", "registration_url": "", "status": "published"},
]
w("data/events.csv", EV, ["id", "title", "type", "start_date", "end_date", "venue", "audience", "summary",
                          "registration_url", "image", "status"])

OP = [
 {"id": "research-fellows", "title": "Preparatory Research Fellows (pre-PhD / pre-MS(R))", "type": "fellowship",
  "summary": "Funded 6–12 month research positions under faculty-proposed projects; no GATE requirement; a pathway to full-time admission.",
  "apply_url": "https://forms.gle/Fgrjtj4cxAhGHa79A", "contact": "SIT faculty in your area of interest", "deadline": "rolling", "status": "open"},
 {"id": "core-stack-team", "title": "Students, research assistants, post-docs and software engineers — CoRE stack",
  "type": "position", "summary": "Join the team building an open digital public infrastructure for climate adaptation in rural communities.",
  "apply_url": "https://core-stack.org/openings-software-engineer-geospatial-technologies/", "contact": "aseth@iitd.ac.in",
  "deadline": "rolling", "status": "open"},
 {"id": "pqc-project-staff-2025", "title": "Sr Project Scientist & Sr Project Assistant (Tech) — post-quantum cryptography for network infrastructure",
  "type": "position", "summary": "Project RP04902G, PI Prof. Rajendra Kumar.",
  "apply_url": "https://ird.iitd.ac.in/sites/default/files/jobs/project/IITD-IRD-049-2025.pdf", "contact": "r_kumar@iitd.ac.in",
  "deadline": "2025-03-05", "status": "closed"},
 {"id": "ignite-call", "title": "IGNITE seed grants — call for proposals", "type": "call",
  "summary": "Seed funding for ambitious, high-risk interdisciplinary applied-computing ideas with clear societal relevance, led by SIT faculty with collaborators across departments and institutions.",
  "apply_url": "", "contact": "Head, SIT", "deadline": "", "status": "draft"},
]
w("data/openings.csv", OP, ["id", "title", "type", "summary", "apply_url", "contact", "deadline", "status"])

AD = [
 {"cycle": "2026-27 Semester I", "programme": "phd", "item": "Shortlisting criteria — PhD full-time", "date": "",
  "link": "https://owncloud.iitd.ac.in/nextcloud/index.php/s/iN4C3YD82pFa2X5", "status": "current"},
 {"cycle": "2026-27 Semester I", "programme": "phd", "item": "Shortlisting criteria — PhD part-time", "date": "",
  "link": "https://owncloud.iitd.ac.in/nextcloud/index.php/s/MkS7rR9dgWafpkB", "status": "current"},
 {"cycle": "2026-27 Semester I", "programme": "msr", "item": "Shortlisting criteria — MS (Research) full-time", "date": "",
  "link": "https://owncloud.iitd.ac.in/nextcloud/index.php/s/8HqMgf2ALHrdwzx", "status": "current"},
 {"cycle": "2026-27 Semester I", "programme": "msr", "item": "Shortlisting criteria — MS (Research) part-time", "date": "",
  "link": "https://owncloud.iitd.ac.in/nextcloud/index.php/s/pa9Za96tRL3EaTb", "status": "current"},
 {"cycle": "2026-27 Semester I", "programme": "phd", "item": "List of shortlisted candidates — PhD", "date": "",
  "link": "https://owncloud.iitd.ac.in/nextcloud/index.php/s/K862xF5DMpoAgiD", "status": "current"},
 {"cycle": "2026-27 Semester I", "programme": "msr", "item": "List of shortlisted candidates — MS (Research)", "date": "",
  "link": "https://owncloud.iitd.ac.in/nextcloud/index.php/s/iW8wXf8P3YW2jGg", "status": "current"},
 {"cycle": "2026-27 Semester I", "programme": "phd;msr", "item": "Interviews", "date": "2026-05-18 to 2026-05-19",
  "link": "", "status": "current"},
]
w("data/admissions.csv", AD, ["cycle", "programme", "item", "date", "link", "status"])

# ---------------------------------------------------------------- stats, labs, hero, partners, courses
ST = [
 {"label": "Founded", "value": "2004", "suffix": "", "note": "with an endowment from alumnus Vinod Khosla", "source": "About page"},
 {"label": "Villages using CoRE stack tools", "value": "2000", "suffix": "≈", "note": "within ~1.5 years of scale-up", "source": "RIC note, Oct 2026 — VERIFY"},
 {"label": "Countries reached by Assistech products", "value": "19", "suffix": "", "note": "", "source": "RIC note, Oct 2026 — VERIFY"},
 {"label": "People reached by Gram Vaani platforms", "value": "millions", "suffix": "", "note": "", "source": "RIC note — replace with exact figure"},
 {"label": "Research alumni (PhD and MS(R))", "value": "91", "suffix": "+", "note": "", "source": "Alumni page, Oct 2026"},
 {"label": "Faculty across IIT Delhi engaged with SIT", "value": "40", "suffix": "+", "note": "joint, associated, adjunct and visiting", "source": "Faculty page, Oct 2026"},
]
w("data/stats.csv", ST, ["label", "value", "suffix", "note", "source"])

LABS = [
 ("Assistech", AREA["hsc"], "Assistive technologies for persons with disabilities — from Smartcane to a national hub.", "https://assistech.iitd.ac.in/", "P V M Rao;Rohan Paul;Piyush Chanana"),
 ("CoRE stack / ACT4D", AREA["ssd"], "Appropriate computing technologies for development; open digital public infrastructure for climate adaptation.", "https://core-stack.org/", "Aaditeshwar Seth"),
 ("SPRING — Security and Privacy Innovation Group", AREA["src"], "Security and privacy for cyber-physical systems.", "https://spring.iitd.ac.in/", "Vireshwar Kumar"),
 ("MARG — Embedded systems and SoC architecture", AREA["ssc"], "Memory systems, AI/ML hardware, 3D chip stacking.", "https://marg.iitd.ac.in/", "Preeti Ranjan Panda"),
 ("AI in Healthcare (AIH)", AREA["hsc"], "Computer vision and foundation models for healthcare and mobility.", "https://aih-iitd.github.io/", "Chetan Arora"),
 ("Kalra Lab", AREA["ssc"], "Biomaterial-based computing with protein polymers.", "https://www.kalralab.org/", "Aarat P. Kalra"),
 ("CompilerAI", AREA["src"], "AI-guided compilers and code analysis.", "https://compiler.ai/", "Sorav Bansal"),
]
w("data/labs.csv", [{"name": a, "thrust_area": b, "summary": c, "website": d, "faculty": e, "logo": ""} for a, b, c, d, e in LABS],
  ["name", "thrust_area", "summary", "website", "faculty", "logo"])

HERO = [
 {"order": 1, "kicker": "Impact at scale", "title": "From a student project to water-security planning in ~2,000 villages",
  "text": "How the CoRE stack grew from research on remote sensing into digital public infrastructure.", "cta_label": "Read the story",
  "cta_link": "/impact/core-stack", "image": "images/banners/core-stack-hero.jpg", "active": "TRUE"},
 {"order": 2, "kicker": "Impact at scale", "title": "Assistive technology from IIT Delhi, used in 19 countries",
  "text": "Smartcane became Assistech, a hub that mentors and scales innovations for persons with disabilities.", "cta_label": "Read the story",
  "cta_link": "/impact/assistech", "image": "images/banners/assistech-hero.jpg", "active": "TRUE"},
 {"order": 3, "kicker": "Admissions", "title": "Do research that changes things",
  "text": "PhD and MS (Research) admissions, and a funded Research Fellows pathway with no GATE requirement.", "cta_label": "Apply",
  "cta_link": "/academics/admissions", "image": "images/site/home-slider-1.jpg", "active": "TRUE"},
 {"order": 4, "kicker": "For faculty", "title": "We invest in ideas that aim for change",
  "text": "Seed grants, collaboration workshops and programme staff for initiatives that scale.", "cta_label": "Why SIT",
  "cta_link": "/why-sit", "image": "images/banners/why-sit-hero.jpg", "active": "TRUE"},
]
w("data/hero-slides.csv", HERO, ["order", "kicker", "title", "text", "cta_label", "cta_link", "image", "active"])
w("data/partners.csv", [], ["name", "type", "logo", "website", "display_order"])

# courses from scraped page
crs = open(os.path.join(ARC, "pages/academics/courses.md"), encoding="utf8").read()
rows = []
for m in re.finditer(r"^#### (.+?) ([A-Z]{3}\d{3})\n\n##### Credits: (\d+)\n\n(.+?)(?=\n#### |\Z)", crs, re.M | re.S):
    rows.append({"code": m.group(2), "title": m.group(1).strip(), "credits": m.group(3), "description": m.group(4).strip(),
                 "offered": "", "faculty": ""})
w("data/courses.csv", rows, ["code", "title", "credits", "description", "offered", "faculty"])
print("faculty", len(fac), "students", len(stu), "alumni", len(alu), "projects", len(P), "news", len(news), "courses", len(rows))
