---
title: "Sustainable and Scalable Computing (Ongoing Projects)"
source_url: "https://sit.iitd.ac.in/show-news/58"
original_nav: "Academics > Ongoing Projects > Sustainable and Scalable Computing"
status: "scraped"
---
# Sustainable and Scalable Computing (Ongoing Projects)

[https://sit.iitd.ac.in/show-news/54](../../research/areas/sustainable-and-scalable-computing.md)

**Cost-effective and sustainable ML workflows (Abhilash and Kaustubh):** Recent advances in ML are enabling automation of tedious tasks, such as document processing. These automations are expressed as ML workflows in frameworks, like LangChain, which mix traditional software processing with ML model inference. [Our recent work](http://abhilash-jindal.com/assets/popper) presents Popper that provides convenient abstractions to tradeoff runtime (or cost) and accuracy by letting the programmers provide lighter (or cheaper) ML models as alternatives to heavier (or expensive) ML models. We want to research ways of further improving the efficiency of Popper, especially in doing incremental computations.

*Necessary background:* Proficiency with Python, reasoning about performance of systems, declarative languages like SQL

*Optional background:* dataflow systems, provenance, distributed systems

*Sponsor: R Systems CoE on Sustainable AI*

***Predoc: Yes***

*More details:* [*http://cse.iitd.ernet.in/popper/*](http://cse.iitd.ernet.in/popper/)

**Very Low power/energy for Simultaneous Localization and Mapping on small drones (Kolin):**

The task is to design a navigation module using neuromorphic hardware. The system must perform real-time SLAM in GPS-denied environments. The primary constraint is power consumption, which is capped at 5 Watts. We intend to formulate this as a spiking neural network (SNN) executing natively on neuromorphic hardware

*Necessary background:  Computer Arch Basics, HDL familiarity and some ML*

***Predoc: Yes***

**Quantum Compute Transpiler (Kolin):**

The key idea is to do a mapping of classical Boolean functions to Reversible Logic Synthesis and then do the quantum circuit implementation.This circuit description of the algorithms often assumes that any type of interaction between qubits is conceivable and does not take into account the physical location of the qubits. The target technology is an array of  2-D array of qubits with just NN-interactions. This requires that physical 2-qubit operations can only occur between neighboring qubits and hence has implications for logical qubit placement as well. The compilation/transpilation and optimisation pipeline, which converts applications into the smallest, most efficient versions of themselves to run on quantum  hardware,is the research and development problem that we will work on in this project.

*Background expected: Extensive experience with C/C++ programming,  Compilation Systems, Back end optimizations, Physical CAD, LLVM*

**Predoc: yes**

**Multimodal data processing (Maya Ramanath)**

With the growth of data lakes storing a variety of data modalities—structured (e.g., relational tables), semi-structured (e.g., JSON), and unstructured (e.g., images, videos, and text)—multi-modal search has become a critical task. The ability to efficiently retrieve relevant information across these modalities, based on keyword queries or other forms of input, is key to unlocking the full potential of data lakes. However, multi-modal search is computationally intensive, requiring the simultaneous processing and integration of different data types, which leads to high energy consumption. Energy-efficient multi-modal search involves challenges related to embedding large datasets from diverse modalities into a common space, performing efficient retrieval across these embeddings, and managing the computational cost of search operations across potentially enormous datasets. Given the increasing concerns about the environmental and financial costs of large-scale AI and data processing systems, this proposal focuses on developing methods to optimize the energy efficiency of multi-modal search within data lakes.

*Expected background*: Background in ML (thorough theoretical understanding of machine learning architectures such as CNN, RNN and transformers, algorithms to train and test for classification, regression, etc.), and Database Systems (storage layouts, on-disk algorithms)

*Contact: Maya Ramanath (ramanath@cse.iitd.ac.in)*
