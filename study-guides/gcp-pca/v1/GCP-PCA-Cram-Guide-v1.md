# GCP Professional Cloud Architect (PCA) — Cram Guide
## Google Cloud Certification
**Version: v1 | October 2025 Exam (v6.1) | 2026**

---

## 📋 Exam at a Glance

| | |
|---|---|
| **Questions** | 50–60 (scenario + multiple choice + multi-select) |
| **Duration** | 120 minutes |
| **Passing** | ~70% (Google doesn't publish exact score) |
| **Cost** | $200 USD |
| **Validity** | 2 years |
| **Prerequisite** | None officially — ACE recommended |
| **Renewal** | Pass current exam before expiration |

> ⚠️ **READ THE CASE STUDIES BEFORE THE EXAM.** They are pre-published at cloud.google.com/certification/guides/professional-cloud-architect. The exam tests your ability to make decisions for these fictional companies.

---

## 🎯 Domain Weightings (v6.1 — October 2025)

| Domain | Weight | Key Focus |
|---|---|---|
| **1. Designing & Planning Cloud Architecture** | ~24% | Requirements → GCP services, multi-region, cost estimation |
| **2. Managing & Provisioning Infrastructure** | ~15% | IaC (Terraform, Deployment Manager), CI/CD, GKE |
| **3. Designing for Security & Compliance** | ~18-20% | IAM, CMEK, VPC-SC, Zero Trust, audit logging |
| **4. Analyzing & Optimizing Technical/Business** | ~18% | Cost optimization, Recommender API, Dataflow, sustainability |
| **5. Managing Implementation** | ~11% | Traffic splitting, Config Connector, tool selection, governance |
| **6. Ensuring Solution Reliability** | ~12-14% | HA/DR, RPO/RTO, SLOs, Cloud Monitoring, SRE |

---

## 🔑 The PCA Mindset

**PCA ≠ ACE.** ACE tests commands (HOW). PCA tests decisions (WHY).

- Every question is a **business scenario** with constraints
- Always eliminate answers that violate stated constraints first
- Choose the **simplest solution that meets all requirements**
- GCP's managed services are almost always the right answer over self-managed

---

## 🏗️ Official Case Studies

Four fictional companies — know these cold:

### 1. Mountkirk Games
- **Type:** Mobile gaming platform
- **Key issues:** Real-time analytics, session management, player leaderboards
- **GCP services:** BigQuery, Cloud Spanner, Cloud Datastore, Compute Engine, Cloud CDN, Memorystore
- **Architecture pattern:** Real-time game analytics, globally distributed leaderboards, micro-services backend

### 2. Dress4Win
- **Type:** Online clothing retailer
- **Key issues:** Legacy on-premises app migration, containerization, online store
- **GCP services:** GKE (Kubernetes), Cloud SQL, Cloud Storage, VPC, Cloud Build, Migration
- **Architecture pattern:** Lift-and-shift → re-architect toward containers, CI/CD pipeline

### 3. TerramEarth
- **Type:** Heavy equipment manufacturer (IoT)
- **Key issues:** 500K vehicles transmitting data, bandwidth constraints, global fleet
- **GCP services:** BigQuery, Cloud IoT Core, Pub/Sub, Dataflow, Cloud Storage, Bigtable, ML
- **Architecture pattern:** IoT ingestion pipeline, edge computing, ML for predictive maintenance

### 4. Helix (when present)
- **Type:** Healthcare/life sciences
- **Key issues:** HIPAA compliance, data residency, secure data sharing
- **GCP services:** VPC Service Controls, Cloud Armor, CMEK, DLP API, Binary Authorization

---

## 📁 DOMAIN 1 — Designing & Planning Cloud Architecture (~24%)

### Requirements → GCP Service Mapping

**"Need to store unstructured files at scale, globally accessible"**
→ Cloud Storage (GCS) — Standard/Multi-Regional/Regional/Nearline/Coldline/Archive tiers

**"Need a managed NoSQL document database for a mobile app"**
→ Firestore (Datastore mode) — for mobile/web, auto-scale

**"Need a managed relational DB, PostgreSQL/MySQL compatible"**
→ Cloud SQL — for standard OLTP, managed backups, HA
→ AlloyDB — for PostgreSQL at scale with AI/ML integration
→ Spanner — for global scale, strong consistency, 99.999% SLA

**"Need a globally distributed relational DB with horizontal scaling"**
→ Cloud Spanner — strong consistency, automatic sharding, multi-region

**"Need a data warehouse for analytics at petabyte scale"**
→ BigQuery — serverless, auto-scales, flat-rate vs. on-demand pricing

**"Need real-time streaming analytics"**
→ Pub/Sub → Dataflow (Apache Beam) → BigQuery/Cloud Storage

**"Need to run containerized workloads"**
→ GKE (Kubernetes) — production-grade, auto-scale, Autopilot option
→ Cloud Run — serverless containers, if stateless HTTP workloads
→ Cloud Functions — serverless functions, event-driven

**"Need to deploy serverless HTTP APIs"**
→ Cloud Run — containerized, scales to zero, pay per use
→ App Engine — if you need a platform instead of containers
→ Cloud Endpoints → API Gateway — for API management

**"Need machine learning at scale"**
→ Vertex AI — training, tuning, prediction, AutoML, endpoints
→ BigQuery ML — run ML in BigQuery using SQL
→ AI Platform (legacy) — now fully Vertex AI

### Multi-Region & Global Architecture

| Need | GCP Solution |
|---|---|
| Active-active multi-region | Cloud Load Balancing (global), Cloud CDN, Cloud Spanner |
| Active-passive failover | Cloud DNS, Traffic Director, regional managed instance groups |
| Disaster recovery in <1hr RTO | Cloud SQL HA, Spanner, regional persistent disks |
| Data archive, cheap storage | GCS Nearline/Coldline/Archive + Lifecycle policies |
| Global content delivery | Cloud CDN + Global External Load Balancer |

### Compute Options — Decision Tree

```
Is it a container?
├── YES — Is it stateless HTTP?
│   └── YES → Cloud Run
│   └── NO → GKE (Autopilot for managed)
└── NO — Is it a function (event-driven)?
    └── YES → Cloud Functions
    └── NO — Is it a full app platform?
        └── YES → App Engine
        └── NO — Is it a VM?
            └── YES → Compute Engine
            └── NO — Is it HPC/batch?
                └── YES → Compute Engine + Spot VMs + Batch
```

### Storage Decision Tree

```
Is it structured relational data?
├── YES — Global scale needed?
│   ├── YES → Cloud Spanner
│   └── NO → Cloud SQL (HA for production)
└── NO — Is it unstructured files/blobs?
    └── YES → Cloud Storage (choose tier by access frequency)
    └── NO — Is it NoSQL document?
        └── YES → Firestore/Datastore
        └── NO — Is it wide-column?
            └── YES → Bigtable
            └── NO — Is it analytics/data warehouse?
                └── YES → BigQuery
```

### Pricing Tools You Must Know

**Google Cloud Pricing Calculator:** Estimate costs before deploying. PCA expects you to estimate.

**Key pricing models:**
- **On-demand** — pay per usage (BigQuery, Cloud Functions)
- **Committed Use Discounts (CUDs)** — 1 or 3 year, up to 57% savings
- **Spot VMs** — up to 91% off, preemptible, suitable for batch/ stateless
- **Sustained Use Discounts (SUDs)** — automatic discount for running VMs >25% of month
- **Flat-rate (BigQuery)** — for high-volume, predictable queries
- **Reservations** — for GKE node pools, Cloud SQL

---

## ⚙️ DOMAIN 2 — Managing & Provisioning Infrastructure (~15%)

### Infrastructure as Code (IaC)

**Terraform vs. Deployment Manager:**

| | Deployment Manager | Terraform |
|---|---|---|
| Language | YAML + Jinja2 templates | HCL (HashiCorp Configuration Language) |
| State | Managed by Google | You manage state file (remote: GCS) |
| Community | Smaller | Massive, cross-cloud |
| Recommended? | Legacy projects | ✅ Preferred for new projects |

**Best practice for Terraform state:**
```hcl
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "prod"
  }
}
```
State file should be in a versioned GCS bucket, not local.

**Config Connector:** Kubernetes-native way to manage GCP resources — use when you're already running GKE and want to manage GCP resources as K8s objects.

### GKE — What You Must Know

**GKE Autopilot:** Google manages the nodes. You pay per pod resource request. No node management overhead. Recommended for production.

**GKE Standard:** You manage nodes, node pools, scaling. More control.

**Node pools:**
- System node pool (runs cluster add-ons) — at least 2 nodes
- User node pools — your workloads
- Spot node pools — cheap, preemptible (use with PodDisruptionBudgets)
- Windows node pools — for Windows containers

**Workload Identity:** Recommended way for GKE workloads to access GCP APIs. Binds a Kubernetes service account to a GCP service account. No keys to manage.

**Multicluster:**
- Anthos — Google's hybrid/multi-cloud Kubernetes management platform
- Config Sync — keep GKE clusters in sync with a central config
- Multi-cluster Ingress (MCI) — route traffic across clusters globally

### CI/CD on GCP

| Service | Use When |
|---|---|
| **Cloud Build** | Native GCP CI/CD, serverless, pay-per-minute |
| **Jenkins / GitLab CI** | Existing Jenkins/GitLab investment |
| **ArgoCD** | GitOps for GKE, declarative CD |
| **Spinnaker** | Complex multi-cloud CD pipelines |
| **Cloud Deploy** | GKE-only, managed Spinnaker-based |

### Networking — Core Concepts

**VPC networks:**
- Default network (auto-created) — avoid in production
- Custom mode VPC — you control all subnet ranges
- Shared VPC (org-level) — share VPC across projects

**Subnet CIDR expansion:** You can expand subnet secondary ranges without recreating the VPC. Can't shrink.

**Firewall rules:**
- Implied deny all ingress
- Implied allow all egress
- Always add least-privilege rules
- Use tags and service accounts, not IP ranges (IP-based rules are hard to manage)

**Cloud NAT:** Allow VM instances without external IPs to access the internet (for private instances). Outbound only — no inbound unsolicited connections.

**Cloud DNS:**
- Managed by Google, 100% SLA
- DNSSEC support
- Cloud DNS for GKE → Private DNS zone in the cluster VPC

**Private Google Access:** Allows VMs with only internal IPs to access Google APIs (BigQuery, GCS, etc.) without an external IP. Enable on subnet.

**VPC Service Controls:** Security perimeter around GCP resources. Prevents data exfiltration from services like BigQuery, Cloud Storage when accessed via approved endpoints.

---

## 🔒 DOMAIN 3 — Designing for Security & Compliance (~20%)

### IAM — The Foundation

**Principal types:**
- Google Account (user)
- Service Account (application/workload)
- Google Group
- Cloud Identity domain
- Workspace domain

**Resource hierarchy:**
```
Organization (top)
├── Folder
│   ├── Folder / Subfolder
│   └── Project
│       ├── Resource (VM, GCS bucket, etc.)
```

IAM policy inheritance: Organization → Folder → Project → Resource. **More restrictive policies win.**

**Custom roles:** Create from primitive roles (Owner/Editor/Viewer) or define at org level with fine-grained permissions. Best practice: least-privilege — use custom roles with minimum permissions.

**Service Account best practices:**
- Don't generate keys if you can use workload identity (GKE) or service account impersonation
- If keys needed: rotate them, store in Secret Manager
- Use service accounts per application (not shared)
- Never make a service account a Project Owner unless absolutely necessary

**IAM Recommender:** Shows unused permissions — use it to tighten policies.

### Encryption — Know the Layers

| Layer | Key Type | Who Manages Key |
|---|---|---|
| **Storage encryption** | Google-managed (AES-256) | Google |
| **Customer-managed keys (CMEK)** | Cloud KMS | You |
| **Customer-supplied keys (CSK)** | You provide key | You (key never touches Google) |
| **Encryption in transit** | TLS / VPN | Both parties |
| **DLP API** | Data inspection | You (define rules) |

**Cloud KMS:**
- Key rings → Crypto keys → Key versions
- Crypto keys can be regional, global, or external (Cloud External Key Manager)
- Use Cloud KMS for: CMEK for GCS/BigQuery, secrets in Secret Manager, signing Docker images (Binary Authorization)

### Zero Trust — Beyond the Perimeter

- **BeyondCorp** — Google's internal Zero Trust model
- **IAP (Identity-Aware Proxy)** — proxy that enforces IAM-based access to VM/web apps. No VPN needed.
- **Context-Aware Access** — restrict access based on device compliance, IP, location
- **Cloud Armor** — WAF, DDoS protection, geo-based IP restrictions

### Compliance & Audit

**Common frameworks tested:**
- **HIPAA** — healthcare (US)
- **PCI-DSS** — payment cards
- **FedRAMP** — US government
- **GDPR** — EU data protection
- **ISO 27001** — information security management

**Cloud DLP API:** Inspect, classify, de-identify sensitive data (PII, credit cards, etc.)

**Audit Logs:**
- Admin Activity logs — always recorded, can't be disabled
- Data Access logs — Cloud Storage, BigQuery (can be expensive, often disabled by default)
- Enable based on compliance needs

**Binary Authorization:**
- Enforce that only signed, trusted container images are deployed to GKE
- Use Cloud KMS to sign images
- Policy modes: Allowlist (default deny) vs. Trust store

---

## 📊 DOMAIN 4 — Analyzing & Optimizing (~18%)

### BigQuery — Deep Dive

**Architecture:**
- Serverless — no infrastructure to manage
- Separates compute and storage
- Columnar storage (Capacitor — Colossus)
- Petabyte scale

**Pricing:**
- On-demand: $5/TB scanned (you pay for what you scan)
- Flat-rate: based on slot hours (for heavy, predictable workloads)
- Free: 1TB/month on-demand, 10GB storage, ML queries in BigQuery

**Partitioning and Clustering:**

| Feature | Partitioning | Clustering |
|---|---|---|
| What it does | Splits table into logical segments | Sorts data by column(s) |
| Use for | Time-series data, date-based queries | High-cardinality columns |
| Benefits | Reduces bytes scanned, improves performance | Reduces data scanned per query |
| Auto-reclustering | Yes (in the background) | No — manual recluster needed |

**Best practice:** Partition by date/timestamp, cluster by commonly filtered columns.

**Materialized Views:** Pre-computed results that auto-refresh. Great for frequently aggregated data.

**BigQuery ML:**
- Run ML models using SQL in BigQuery
- Supported: Linear regression, XGBoost, K-means, ARIMA, PCA, Matrix Factorization, etc.
- No data movement — ML happens where data lives

### Dataflow — Apache Beam

**What it is:** Unified stream and batch processing. Serverless. Auto-scales.

**Key concepts:**
- **Pipelines:** Data processing job (reading → transform → write)
- **PTransforms:** Apply transforms to PCollections
- **Windowing:** Fixed, sliding, session-based windows for streaming
- **Triggers:** When to emit results (default, early, late firings)

**Templates:**
- Streaming templates — for production jobs
- Flex templates — custom templates for complex pipelines
- Dataflow SQL — SQL interface for beam pipelines

**Use cases:**
- Streaming ETL: Pub/Sub → Dataflow → BigQuery
- Log processing: GCS → Dataflow → BigQuery
- Real-time analytics

### Pub/Sub — Messaging

**Pub/Sub Lite:** Lower cost, Zonal only (not cross-region). Use for very high throughput where cross-region isn't needed.

**Pub/Sub (standard):**
- At-least-once delivery (with acknowledgements)
- Exactly-once delivery (in-order, with deduplication)
- Push and pull subscriptions
- Dead-letter topics for failed messages

**Ordering keys:** Ensure messages with same key are delivered in order.

### Cloud Logging & Monitoring

**Cloud Logging:**
- Log-based metrics
- Log sink to: GCS, BigQuery, Pub/Sub (for third-party SIEM)
- Log router: include/exclude filters by log name, severity

**Cloud Monitoring:**
- **Uptime checks:** HTTP/TCP/SSL checks from multiple locations
- **Alerting policies:** Metric thresholds, health checkers
- **SLO monitoring:** Define SLOs, burn rate alerts
- **Dashboards:** Custom dashboards with charts

**SRE Practices for PCA:**
- **SLIs (Service Level Indicators):** What you measure (latency, error rate, throughput)
- **SLOs (Service Level Objectives):** Target values for SLIs (99.9% availability)
- **Error budgets:** 100% - SLO = error budget. Spend it wisely.
- **Burn rate alerts:** Alert when SLO is burning faster than acceptable

### Cost Optimization

| Technique | Savings | When to Use |
|---|---|---|
| **Committed Use Discounts (CUDs)** | Up to 57% | Steady, predictable VMs |
| **Spot VMs** | Up to 91% | Batch, fault-tolerant workloads |
| **Sustained Use Discounts** | Up to 30% | VMs running >25% of month (automatic) |
| **Custom machine types** | Variable | Right-size to actual need |
| **Preemptible VMs** | Up to 91% | Stateless, interruption-tolerant batch |
| **GKE Autopilot** | ~30-40% vs standard | Don't want to manage nodes |
| **Cloud Run** | Scales to zero | Infrequent, event-driven |
| **GCS lifecycle policies** | Archive cold data | Auto-transition Hot → Nearline → Cold → Archive |
| **BigQuery flat-rate** | For heavy query workloads | Predictable, high-volume |

---

## 🚀 DOMAIN 5 — Managing Implementation (~11%)

### Deployment Patterns

**Traffic splitting / Blue-Green / Canary:**

| Pattern | How It Works | Use When |
|---|---|---|
| **Blue-Green** | Full cutover at once | Complete, immediate switch |
| **Canary** | Small % traffic to new version | Test with real users before full rollout |
| **Rolling** | Gradually replace instances | No downtime, lower risk |
| **Feature flags** | Toggle features per user segment | Gradual feature rollout |

**Cloud Deploy:** Managed delivery pipeline for GKE. Supports progressive delivery with Skaffold. Integrates with Cloud Run.

### Tool Selection — When to Use What

| Need | GCP Service |
|---|---|
| Deploy containers, serverless | Cloud Run |
| Deploy to Kubernetes | GKE + Cloud Deploy / ArgoCD |
| IaC for any GCP resource | Terraform |
| Infrastructure in YAML for GCP | Deployment Manager |
| Manage GCP resources from K8s | Config Connector |
| CI/CD (any platform) | Cloud Build |
| Secrets management | Secret Manager |
| Orchestrate multi-step workflows | Cloud Composer (Airflow) |
| Event-driven serverless | Cloud Functions |
| APIs and backend services | Cloud Endpoints / API Gateway |
| CDN and global load balancing | Cloud CDN + Global External Load Balancer |

### API Management

**Cloud Endpoints (ESPv2):**
- API gateway for GKE/Cloud Run/Cloud Functions
- Extensible Service Proxy — handles auth, logging, caching
- OpenAPI spec-based

**API Gateway (newer):**
- Fully managed API gateway
- Quota management, API keys, monitoring
- Based on Envoy proxy

**Choosing:**
- Cloud Run/GKE → API Gateway or Cloud Endpoints
- Existing Apigee investment → Apigee (enterprise-grade API management)

---

## 🛡️ DOMAIN 6 — Ensuring Solution Reliability (~12-14%)

### High Availability vs. Disaster Recovery

| Level | What It Protects Against | GCP Features |
|---|---|---|
| **Single zone** | Local disk failure | Persistent Disk snapshots |
| **Multi-zone (within region)** | AZ outage | Managed instance groups (MIG) with multi-zone |
| **Multi-region** | Region outage | Global load balancing, Cloud Spanner, Cloud Storage multi-region |
| **Cross-cloud** | Provider outage | Anthos (multi-cloud Kubernetes) |

### RPO and RTO — Know the Difference

| Metric | Definition | GCP Service/Feature |
|---|---|---|
| **RPO** (Recovery Point Objective) | How much data you can afford to lose | Backup frequency = RPO |
| **RTO** (Recovery Time Objective) | How long until service is back | Failover speed = RTO |

**RPO = 0:** Synchronous replication (Cloud Spanner, Zonal PD, Cloud SQL HA)
**RPO < 1 hour:** Near-synchronous (async replica, ~minutes)
**RPO = 1-24 hours:** Backup-based (Cloud Storage, BigQuery snapshots)

### Backup & DR Service

**GCP Backup and DR Service:**
- Centralized backup management for GKE, Compute Engine, Cloud SQL
- Policy-driven: schedule, retention, encryption
- Supports cross-region disaster recovery
- Backup DR service replicates to secondary region

**Cloud SQL Backup:**
- Automated backups: daily, configurable time window
- On-demand backups
- Point-in-time recovery (PITR) — up to 7 days (35 days with extended retention)
- Cross-region read replica for DR

**GCS Backup:**
- Versioning — keep old versions of objects
- Object Lifecycle Management — auto-delete or transition based on age
- Replication: CRR (Cross-region) and dual-region

### GKE Reliability

**Health checks:**
- **Liveness probe:** Is the container alive? Restart if failing
- **Readiness probe:** Is the container ready to serve traffic?
- **Startup probe:** For slow-starting containers (disables liveness during startup)

**PodDisruptionBudgets (PDBs):** Ensure minimum pods available during voluntary disruptions (node upgrades, autoscaling). Combine with Spot VMs for cost + availability.

**Vertical Pod Autoscaler (VPA):** Recommends or automatically adjusts CPU/memory requests based on actual usage.

**Horizontal Pod Autoscaler (HPA):** Scales pods based on CPU/memory/custom metrics.

### Cloud Monitoring — SRE Patterns

**Uptime checks:** Monitor HTTP/TCP endpoints from Google's global locations. Alert when check fails.

**SLO monitoring:**
```python
# Define SLO
SLI: request_latency < 100ms (p99)
SLO: 99.5% of requests meet SLI over 30-day window
Alert: burn rate > 14.4x (1% budget burned per hour = alert before full burn)
```

**Alert policies:**
- Metric threshold alerts
- Multi-condition alerts (AND/OR logic)
- Alert frequency and notification channels

---

## 🤖 AI/ML on GCP — PCA Must-Know

**Vertex AI — The Platform:**

- **AutoML:** No-code model training (images, text, tabular, video)
- **Custom training:** Bring your own ML framework (TensorFlow, PyTorch, scikit-learn)
- **Vertex AI Workbench:** Jupyter-based development environment
- **Model Registry:** Centralized model versioning and deployment
- **Feature Store (Vertex AI):** Share and reuse ML features across teams

**BigQuery ML — When to Use:**
- Quick prototyping with SQL
- Data already in BigQuery
- Models: XGBoost, Linear regression, K-means, ARIMA
- NOT for deep learning or very large-scale training

**Pre-trained APIs (AI Platform):**
- Vision AI — image classification, object detection, OCR
- Video Intelligence API — scene changes, object tracking, explicit content
- Natural Language API — entity analysis, sentiment, syntax, content classification
- Translation API — translate between 100+ languages
- Speech-to-Text / Text-to-Speech

**Choosing ML approach:**
```
Is your data already in BigQuery?
├── YES — Will BQML models suffice? (linear, XGB, k-means, ARIMA)
│   └── YES → BigQuery ML
│   └── NO → Vertex AI Custom Training
└── NO — Do you need pre-built vision/language/speech?
    └── YES → Pre-trained APIs (Vision, NLP, Speech)
    └── NO — Do you have labeled training data?
        └── YES → Vertex AI AutoML or custom training
        └── NO → Consider data labeling service, then AutoML
```

---

## ⚡ Decision Trees — Quick Reference

### Which Compute?

```
Stateless container HTTP service?
└── YES → Cloud Run (serverless containers, scales to zero)

Kubernetes needed?
└── YES → GKE (Autopilot for prod, Standard for more control)

Event-driven function?
└── YES → Cloud Functions (if single-purpose) or Cloud Run (if needs containers)

Full application platform?
└── YES → App Engine (standard or flex)

HPC / GPU workloads?
└── YES → Compute Engine with GPU/TPU nodes

Batch / fault-tolerant?
└── YES → Compute Engine Spot VMs + Managed instance group
```

### Which Database?

```
Need relational?
├── Global scale + strong consistency + 99.999% SLA?
│   └── YES → Cloud Spanner
│   └── NO → Cloud SQL (HA for production)
└── NO — Need NoSQL?
    ├── Document (mobile/web)?
    │   └── YES → Firestore
    ├── Wide-column (IoT, time-series)?
    │   └── YES → Bigtable
    └── In-memory cache?
        └── YES → Memorystore (Redis/Memcached)
        NO → BigQuery (analytics) or Cloud Storage (files)
```

### Which Networking?

```
Need to connect on-prem to GCP?
├── Dedicated private connection?
│   └── YES → Cloud Interconnect (Dedicated or Partner)
│   └── NO → Cloud VPN (IPSec over internet)
Need global load balancing + CDN?
└── YES → Global External Load Balancer + Cloud CDN
Need API gateway?
└── YES → API Gateway or Cloud Endpoints (ESP)
Need to restrict access to GCP services?
└── YES → VPC Service Controls + Private Google Access
```

---

## 📝 Exam Day Tips

1. **Read the case study first** — 2-3 minutes. Note constraints: budget, compliance, team skills, timeline
2. **Eliminate first** — remove answers that violate stated requirements
3. **"Most cost-effective"** → managed services + CUDs/Spot + right-sizing
4. **"Least operational overhead"** → managed services (Cloud Run, Cloud SQL, BigQuery)
5. **"Global, highly available"** → Spanner, global LB, multi-region storage
6. **"Lift-and-shift"** → Compute Engine + Migrate for Compute Engine
7. **"Real-time analytics"** → Pub/Sub → Dataflow → BigQuery
8. **"Zero-trust"** → IAP + IAM + VPC Service Controls
9. **"Microservices on Kubernetes"** → GKE + Anthos + Config Sync
10. **"Data residency/compliance""** → VPC Service Controls + CMEK + DLP API + Binary Authorization

---

## 📚 Official Resources

- [PCA Exam Guide v6.1 (PDF)](https://services.google.com/fh/files/misc/v6.1_pca_professional_cloud_architect_exam_guide_english.pdf)
- [Case Studies](https://cloud.google.com/case-studies)
- [Google Cloud Architecture Center](https://cloud.google.com/architecture)
- [Qwiklabs / Google Cloud Skills Boost](https://www.cloudskillsboost.google/)

---

*Study hard. Pass the exam. 🐉*
*Last updated: June 2026*
