# AZ-305 Azure Solutions Architect — Cram Guide
## Designing Microsoft Azure Infrastructure Solutions
**Version: 2.0 — Migration Heavy Edition | 2026**

---

## 📋 Exam at a Glance

| | |
|---|---|
| **Prerequisite** | AZ-104 Azure Administrator Associate |
| **Questions** | Case-study based (not trivia) |
| **Duration** | 180 minutes |
| **Passing Score** | 700 / 1000 |
| **Cost** | ~$165 USD |
| **Renewal** | Annual — free assessment on Microsoft Learn |

### Domain Weightings (2026)

| Domain | Weight | Key Topics |
|---|---|---|
| **Design Identity & Governance** | 25–30% | Entra ID, RBAC, PIM, Policy, Blueprints, Landing Zones |
| **Design Data Storage** | 25–30% | Storage accounts, Azure Files, Blob, SQL, Cosmos DB, Data Lake |
| **Design Infrastructure** | 25–30% | VMs, Containers, AKS, App Service, Functions, HA/DR |
| **Design Migration** | 5–10% | Azure Migrate, DMS, ASR, HCX, assessment patterns |
| **Design Business Continuity** | 10–15% | Backup, ASR, availability zones, failover |

> ⚠️ **Three domains carry 85–90% of the exam.** Master Identity/Governance, Data Storage, and Infrastructure first.

---

## 🔐 DOMAIN 1 — Identity, Governance & Monitoring (25–30%)

### Microsoft Entra ID (formerly Azure AD)

**What it is:** Cloud-based identity and access management. Handles authentication for all Azure resources, SaaS apps, and custom LOB applications.

#### Tiers & Plans

| Feature | Free | P1 | P2 |
|---|---|---|---|
| Users | 500k | Unlimited | Unlimited |
| SSO (federated) | 10 apps | Unlimited | Unlimited |
| MFA | ❌ | ✅ | ✅ |
| Conditional Access | ❌ | ✅ | ✅ |
| Identity Protection | ❌ | ❌ | ✅ |
| Access Reviews | ❌ | ❌ | ✅ |
| Entitlement Management | ❌ | ❌ | ✅ |
| P2: $6/user/mo | | | |

#### User Identities: Cloud vs. Synchronized vs. Federated

**Cloud-only identities:**
- Pure Azure AD — no on-prem footprint
- Best for: fully cloud-native orgs, new tenants
- Passwords stored hash in Azure AD

**Password Hash Sync (PHS):**
- Azure AD Connect syncs password hashes from on-prem AD
- Enables seamless SSO + cloud auth fallback
- Simple to deploy, low complexity
- Best for: orgs wanting hybrid but avoiding full ADFS

**Pass-Through Authentication (PTA):**
- Agent on-prem validates credentials directly against your AD
- No password hashes stored in cloud
- Best for: high security requirements, no password hash storage in cloud

**Federation (ADFS / Ping / etc.):**
- Full trust chain between on-prem IdP and Entra ID
- Supports complex auth policies, smart card, third-party MFA
- Highest complexity — requires on-prem infrastructure uptime
- Best for: regulatory requirements, existing ADFS investment

#### Hybrid Identity — Azure AD Connect

**Azure AD Connect:** The bridge between on-prem AD and Entra ID.

- **Express Settings:** Single forest, password hash sync, no custom config
- **Custom Settings:** Multi-forest, multiple sync engines, Exchange hybrid, LDAP v3
- **Staging Mode:** Test config without affecting production sync
- **Azure AD Connect Health:** Monitor sync errors, agent health, sign-in activity

**Multi-forest scenarios:**
- Use Azure AD Connect with multiple connectors
- Separate sync servers per forest feeding into single Azure AD tenant
- Consider MIM (Microsoft Identity Manager) for complex identity consolidation

#### Application Identities — Service Principals vs. Managed Identities

**Service Principal:**
- App registration in Entra ID
- Client secret or certificate for auth
- You manage the credential lifecycle (rotation, expiry)
- Used for: DevOps, automation, CI/CD pipelines

**System-assigned Managed Identity:**
- Azure manages the credential
- Auto-rotation of secrets
- Single Azure resource (VM, App Service, Function, etc.)
- No credential management overhead
- Preferred for: Azure-hosted workloads

**User-assigned Managed Identity:**
- Standalone Azure resource
- Can be shared across multiple Azure resources
- Credential lifecycle managed by you
- Best for: multiple VMs / services sharing one identity

#### Conditional Access — The Key Concepts

Conditional Access = **If this → Then that** for access decisions.

**Common signals:**
- User risk (compromised account?)
- Sign-in risk (anomalous login?)
- Device compliance (MDM enrolled? healthy?)
- IP location (trusted locations?)
- Application (which SaaS/app?)

**Grant controls:**
- Require MFA
- Require compliant device
- Require approved client app
- Require app protection policy
- Block access

**Session controls:**
- Sign-in frequency
- Persistent browser session
- Customize app token lifetime

**Exam pattern:** "Users are being prompted for MFA when accessing from unfamiliar locations" → Configure named locations + conditional access policy.

#### Privileged Identity Management (PIM)

PIM = Just-in-time elevated access. No standing privileges.

**Key concepts:**
- **Eligible assignments:** Pre-approved roles you can activate for a time window
- **Activation:** You request, approver grants, you get role for max duration
- **Time-bound:** Roles expire automatically
- **Audit trail:** Every activation is logged
- **Justification required:** Document why you need the role

**Who needs it:** Global Admin, Owner, Contributor on production subscriptions, security roles.

**MFA enforcement in PIM:** Always enforced at activation — even if tenant MFA is off.

#### Access Reviews

Periodic re-certification campaigns:
- "Manager confirms: does this user still need this role?"
- Self-review option
- Auto-remediation: remove access if no response
- Use for: guest accounts, temporary project access, role creep

---

### Azure Policy & Blueprints

#### Azure Policy

Policy = Enforce compliance at scale. Evaluates *existing* and *new* resources.

**Key built-in initiatives:**
- `Audit Windows VMs` → Check for encryption, endpoints
- `Enable Monitoring in Azure Security Center` → ASC recommendations
- `NIST SP 800-53` → Regulatory compliance
- `ISO 27001` → ISO certification alignment

**Policy vs. RBAC:**

| | Policy | RBAC |
|---|---|---|
| **Scope** | Resources (what) | Who can do what |
| **Enforces** | Configuration/compliance | Access rights |
| **Evaluates** | Existing + new resources | At access time |
| **Assignment** | Management groups, subscriptions, RGs | Users, groups, service principals |
| **Effect** | deny, audit, append, modify, deployIfNotExists | allow, deny |

**Policy effects (know for exam):**
- `deny` — Blocks resource creation
- `audit` — Logs non-compliance, doesn't block
- `deployIfNotExists` — Deploys a template if condition met
- `append` — Adds fields to existing resources
- `modify` — Updates existing resource tags or properties

**Exemptions:** You can exempt a scope from a policy for a time period or indefinitely — useful for break-glass scenarios.

#### Azure Blueprints

Blueprint = Package of artifacts (policies, ARM templates, role assignments) that you can assign to *new* subscriptions repeatedly.

**Artifacts in a blueprint:**
- Resource groups
- ARM templates (deploy storage, SQL, etc.)
- Policy assignments
- Role assignments
- ARM template specs

**Assignment vs. definition:**
- Define once in a management group
- Assign to subscriptions — each subscription gets identical baseline

**Difference from Policy:**
- Policy evaluates existing resources
- Blueprint sets up *new* environments with standard baseline
- Blueprint is subscription lifecycle (applies at creation)

---

### Azure Landing Zones (ALZ)

#### What is a Landing Zone?

A landing zone is the **environment foundation** — pre-configured, scalable, secure. It's where your workloads live.

**Core principles:**
- Policy-driven governance from day one
- Network segmentation (hub-and-spoke or Virtual WAN)
- Centralized identity, security, and monitoring
- Subscription vending (on-demand provisioning)

#### Management Group Hierarchy

```
Tenant Root Group
├── Sandbox (never deploy here)
├── Corp (production workloads)
│   ├── Prod (production)
│   │   ├── Prod-EastUS
│   │   └── Prod-WestEurope
│   └── NonProd (dev/test)
│       ├── Dev
│       └── Test
├── Online (public-facing: CDN, Front Door)
└── Decommissioned
```

**Key principles:**
- Top-level management group: org name
- Don't put subscriptions directly under root
- Corp + Online separation: corp = private connectivity, online = public internet
- Don't grant access at root — manage at management group level

#### Hub-and-Spoke Architecture

```
                    ┌─────────────────┐
                    │   HUB VNET     │
                    │ (Hub - Prod)    │
                    │  • Azure FW    │
                    │  • VPN/ER GW    │
                    │  • DNS Resolver │
                    │  • Bastion      │
                    └────────┬────────┘
                             │ VNet Peering
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Spoke 1  │  │ Spoke 2  │  │ Spoke 3  │
        │ (Workload│  │ (Apps)   │  │ (Data)   │
        │  Web)    │  │          │  │          │
        └──────────┘  └──────────┘  └──────────┘
```

**Hub components:**
- Azure Firewall (or third-party NVA) — all traffic inspection
- VPN Gateway or ExpressRoute — on-prem connectivity
- Azure Bastion — jump box replacement
- Private DNS zones — centralized DNS resolution
- VPN Gateway or ER for cross-region redundancy

**When to use hub-spoke:**
- Standard enterprise topology
- Need centralized security inspection
- Multiple workloads need shared services
- Requires network segmentation

**When NOT to use:**
- Very simple single-app scenarios
- Global distributed orgs → consider Virtual WAN instead

#### Azure Virtual WAN

- Fully managed Microsoft-managed SD-WAN
- Hub redundancy built-in
- Global transit network
- Good for: large multi-region orgs, many branch offices
- Replaces traditional hub-spoke for global topology

#### Azure Firewall Premium

| Feature | Standard | Premium |
|---|---|---|
| Stateful firewall | ✅ | ✅ |
| Threat intelligence | ✅ | ✅ |
| FQDN filtering | ✅ | ✅ |
| TLS inspection | ❌ | ✅ |
| IDPS | ❌ | ✅ |
| Web categories | ❌ | ✅ |
| Malware inspection | ❌ | ✅ |

**When Premium:** If you need to inspect outbound TLS traffic, need IDPS, or URL filtering with categories.

---

### Monitoring — Azure Monitor + Sentinel

#### Azure Monitor — The Foundation

**Data sources:**
- Application logs (custom app telemetry)
- VM agents (Log Analytics)
- Azure resource metrics (built-in)
- Activity logs (subscription-level)
- Container insights (AKS)
- Network monitoring (NSG flow logs, VPN diagnostics)

**Log Analytics:**
- Workspace-based architecture
- Multiple subs can send to one workspace (or separate per workload)
- Data retention: 30–730 days (pay per GB after free tier)
- Use Azure Monitor private link scope for private connectivity

**Kusto Query Language (KQL):** You need basic KQL for the exam.

```kusto
// Top 10 failing requests
requests
| where timestamp > ago(1d)
| where success == false
| summarize count() by name, resultCode
| order by count_ desc
| take 10
```

#### Alerts — Know the Types

| Alert Type | When to Use |
|---|---|
| **Metric alerts** | Threshold breach on CPU, memory, latency |
| **Log alerts** | Complex KQL queries on log data |
| **Activity log alerts** | Azure resource lifecycle events |
| **Smart groups** | AI groups related alerts to reduce noise |
| **Prometheus (Container Apps)** | Metrics for AKS |

**Action groups:** Who gets notified and how (email, SMS, webhook, ITSM, automation runbook)

#### Azure Sentinel — SIEM + SOAR

- Cloud-native SIEM (Security Information and Event Management)
- Collects from multiple sources: Entra ID, Office 365, Azure resources, AWS, GCP
- Uses ML/AI to detect threats (Fusion detection)
- **Incidents** = correlated alerts grouped by attack story
- **Playbooks** = automated SOAR responses (Logic Apps)
- **MITRE ATT&CK matrix** — map detected activity to tactics

**When you need Sentinel:**
- Enterprise-wide security monitoring
- Need to correlate across multiple cloud platforms
- Compliance requires SIEM
- Need automated incident response

---

## 💾 DOMAIN 2 — Data Storage Solutions (25–30%)

### Azure Storage Accounts

Every storage account = one resource with multiple data services.

#### SKU Comparison

| SKU | Redundancy Options | Use When |
|---|---|---|
| **Standard General Purpose v2** | LRS, ZRS, GRS, GZRS | Most workloads — blobs, files, tables, queues |
| **Premium Block Blobs** | LRS, ZRS | High throughput, low latency — log files, media |
| **Premium File Shares** | LRS, ZRS | Enterprise file shares, SMB, lift-and-shift |
| **Premium Page Blobs** | LRS only | VHD disks, raw byte storage |

#### Redundancy — Critical for Exam

**Locally Redundant Storage (LRS):**
- 3 copies in ONE availability zone in ONE region
- Cheapest option
- Zone outage = potential data loss
- Good for: non-critical, easily reproducible data

**Zone-Redundant Storage (ZRS):**
- 3 copies across 3 AZs in ONE region
- AZ outage = data survives
- Best balance of cost/resilience for most production
- **Use ZRS for production workloads**

**Geo-Redundant Storage (GRS):**
- LRS locally + async replica to paired region
- Paired region: e.g., East US ↔ West US
- Secondary is read-only unless you initiate failover
- RPO = ~15 minutes (not zero — you lose last 15 min of writes)

**Geo-Zone-Redundant Storage (GZRS):**
- ZRS locally + GRS to paired region
- Best of both: AZ resilience locally + geo redundancy
- Max resilience for standard storage

**Read-Access Geo-Redundant (RA-GRS / RA-GZRS):**
- Secondary region readable always
- Use for: read-only reporting workloads, DR reads
- Only pay for egress on secondary reads

> ⚠️ **Exam trap:** GRS/GZRS — the secondary is NOT readable by default. You must explicitly request RA-GRS if you want read access to secondary.

#### Storage Account Security

**Network access:**
- Public endpoints (default) — allow specific IP or VNet
- Private endpoints — private IP in your VNet, no public internet exposure
- Firewall rules — IP allowlist (on-prem access)
- Resource instance rules — allow specific Azure resources

**Shared Keys (legacy):**
- Two 512-bit access keys
- Full control of everything in the account
- Should be disabled — use Azure AD auth instead

**Azure AD authentication (preferred):**
- Role-based: Storage Blob Data Reader, Contributor, Owner
- Scope: storage account, container, or blob level
- Supports MSI and service principals

**SAS (Shared Access Signatures):**
- Delegate access to specific resources
- User delegation SAS (Azure AD auth) — preferred
- Service SAS (account key) — legacy
- Stored Access Policy — associate SAS with policy for revocation
- Account SAS — broad access across all services

**Encryption:**
- Microsoft-managed keys (default) — AES-256
- Customer-managed keys (CMK) — in Azure Key Vault
- Infrastructure encryption — double encryption at hardware level (compliance requirement)

---

### Azure Blob Storage

#### Blob Tiers

| Tier | Access Tier | Pricing Model | Use When |
|---|---|---|---|
| **Hot** | Frequent access | Storage cost + low access cost | Active workloads, daily reads |
| **Cool** | Infrequent (<30d) | Storage + moderate access | Backup recent data, DR copies |
| **Cold** | Rare (<90d) | Storage + higher access | Archival, compliance data |
| **Archive** | Very rare (<180d) | Very cheap storage + high retrieval cost | Long-term retention, legal hold |

**Lifecycle management rules:**
```json
{
  "rules": [
    {
      "name": "ageOutFiles",
      "enabled": true,
      "prefix": "logs/",
      "expiration": {
        "daysAfterModificationGreaterThan": 90
      },
      "autoTierToHotFromCool": true
    }
  ]
}
```

**Standard HTTP access:** Blob data accessible via URL: `https://<account>.blob.core.windows.net/<container>/<blob>`

**Immutable Blob Storage (WORM):**
- Time-based retention (1 day to forever)
- Legal hold (indefinite until released)
- No delete or overwrite allowed
- Use for: compliance (SEC 17a-4, FINRA), legal discovery

---

### Azure Files

**SMB 3.0+ and NFS support** — lift-and-shift Windows file shares or Linux NFS workloads.

#### File Share Tiers

| Tier | Protocol | Use When |
|---|---|---|
| **Transaction Optimized** | SMB/NFS | Most workloads — balanced |
| **Hot** | SMB only | Frequent access, cloud-native |
| **Cool** | SMB only | Infrequent access patterns |
| **Premium** | SMB/NFS | High IOPS, low latency (enterprise apps) |

**Identity-based access:**
- AD DS (on-prem or Azure AD DS) — traditional NTFS permissions
- Azure AD Kerberos — native Azure AD integration (no AD required)
- Share-level + file-level permissions

**File Sync (Azure File Sync):**
- Deploy File Sync agent on Windows Servers on-prem
- Tiering: hot data stays on-prem, cold data moves to Azure Files
- Bandwidth optimization: only sync delta changes
- Cloud-side sharing: users access files via DFS-N or direct share

**Exam scenario:** "100 remote offices, intermittent connectivity, need local file access + cloud backup" → Azure File Sync with cloud tiering.

---

### Azure Data Lake Storage (ADLS Gen2)

**Hierarchical namespace** — turns blob storage into a proper file system with POSIX-like permissions.

#### Why ADLS Gen2 Over Blob?

| Feature | Blob | ADLS Gen2 |
|---|---|---|
| Hierarchical namespace | ❌ (flat) | ✅ (directories, files) |
| POSIX permissions | ❌ (ACLs at storage level) | ✅ (filesystem ACLs) |
| rename/move atomic | ❌ | ✅ |
| Directory rename cost | O(n) | O(1) |
| Efficient for Spark/Hadoop | ❌ | ✅ |

**Security:**
- Azure RBAC (storage account level)
- POSIX ACLs (file/folder level) — supports Apache Spark, Databricks
- Hierarchical namespace must be **enabled at creation** — cannot be added later

**Use when:**
- Data lake architecture (raw → processed → curated)
- Big data analytics (Synapse, Databricks, HDInsight, Spark)
- Data engineering pipelines
- ML training data

---

### Azure SQL Family

#### SQL Deployment Options — Know the Differences

| Service | Scope | Use When |
|---|---|---|
| **Azure SQL VM** | Full VM with SQL installed | 100% lift-and-shift, SQL features not in PaaS |
| **SQL Elastic Pool** | Shared resources | Many DBs with variable usage, cost pooling |
| **SQL MI (Managed Instance)** | Full SQL Server instance | Lift-and-shift withInstance-level features (linked servers, Agent, CLR) |
| **Azure SQL Database** | Single database | Cloud-native, most PaaS scenarios |

#### Azure SQL Database — Serverless vs. Provisioned

**Provisioned:**
- Fixed compute always running
- Predictable billing (compute + storage)
- Auto-pause not available
- Good for: predictable, steady-state workloads

**Serverless:**
- Auto-pauses when idle (configurable delay, e.g., 1 hour)
- Auto-scales compute based on demand
- Billing per second for compute
- Good for: infrequent, unpredictable, development/test

**Hyperscale:**
- 100GB to 64TB storage
- Read replicas (up to 4) — scale reads horizontally
- Used by: large production DBs (SaaS, e-commerce)
- Not available for managed instance

#### SQL Security — Defense in Depth

1. **Network:** Private endpoint (no public internet) + firewall rules + VNet integration
2. **Authentication:** Azure AD only (preferred) or SQL auth (legacy)
3. **Authorization:** Role-based (db_datareader, db_datawriter) + contained DB users
4. **Threat protection:** Microsoft Defender for SQL (anomaly detection, vulnerability assessment)
5. **Data encryption:** TDE (transparent data encryption) at rest + TLS in transit
6. **Audit:** SQL Audit logs to blob storage or Log Analytics

#### Azure SQL — Geo-Replication

**Active geo-replication:**
- Up to 4 readable secondaries
- Can be in same region or cross-region
- Read-scale out — route reporting queries to secondary
- Manual failover (no automatic failover for geo-replicas)
- **For automatic failover → Auto-failover groups**

**Failover groups:**
- Group of databases on a SQL Database server
- Automatic replication + failover to paired region
- Listener endpoint — app reconnects automatically after failover
- RTO ~1 hour (for geo-secondary to become primary)
- RPO ~1 hour (max data loss)

**Managed Instance geo-replication:**
- Same concept but instance-level
- Linked to primary MI in paired region

#### Azure SQL — Backup

- **Full:** Weekly automatic
- **Differential:** Every 12-24 hours
- **Log backups:** Every 5-10 minutes
- **Point-in-time restore (PITR):** Up to 35 days (LTR up to 10 years)
- **Long-term retention (LTR):** Weekly/monthly backups kept 7 days to 10 years in blob storage

---

### Azure Cosmos DB

Multi-model NoSQL database — globally distributed by default.

#### API Models — Which to Use When

| API | Data Model | Use When |
|---|---|---|
| **SQL (Core)** | Document JSON | Most flexible, any schema, serverless |
| **Cassandra** | Wide column | Migrating from Cassandra, existing drivers |
| **MongoDB** | Document | Migrating from MongoDB, document patterns |
| **Gremlin** | Graph | Social graphs, fraud detection, recommendations |
| **Table** | Key-value | Migrating from Azure Table Storage, key-value |

#### Throughput Models

**Manual RU/s (reserved):**
- Fixed provisioned throughput
- Pay for RU/s regardless of actual usage
- Good for: predictable, steady workloads

**Autoscale RU/s:**
- Scales between min and max RU/s automatically
- Only pays for what you use (scales down when idle)
- Good for: variable, bursty workloads

**Serverless:**
- Pay per operation (no RU provisioning)
- No minimum, no idle cost
- **No multi-region** — single region only
- Good for: < 1TB, unpredictable infrequent access

> ⚠️ **Exam trap:** "Workload goes from 0 traffic to 10,000 RUs burst" → Autoscale, not serverless. Serverless can't handle burst.

#### Consistency Levels

| Level | Description | When |
|---|---|---|
| **Strong** | Linearizability | Financial, inventory — absolute consistency |
| **Bounded Staleness** | Within K versions or T time | Geospatial, reporting |
| **Session** | Own writes readable | User profile, shopping cart |
| **Consistent Prefix** | No out-of-order | Analytics |
| **Eventual** | Best effort | IoT telemetry, comments, likes |

> 💡 **Exam tip:** Most exams use **Session** (default for SQL API) or **Bounded Staleness**. Strong has latency cost.

#### Cosmos DB Global Distribution

- Multi-region writes (conflict resolution strategies: LWW, custom)
- Automatic failover if region goes down
- Manual failover for maintenance
- Conflict resolution: Last Write Wins (LWW) or custom merge stored procedure
- You can add/remove regions at any time — zero downtime

**Multi-region vs. Single-region:**
- Multi-region: $$$

---

### Azure Data Factory (ADF)

**Managed ETL/ELT in the cloud.**

#### Key Components

- **Pipeline:** Orchestrates activities (copy, execute notebook, run lookup)
- **Activity:** Individual operation (copy data, data flow, web hook)
- **Dataset:** Pointer to data (blob, SQL, ADLS, HTTP)
- **Linked Service:** Connection string to data store
- **Integration Runtime:** Compute engine (Azure, on-prem, SSIS)

**Integration Runtimes:**

| IR Type | Use For |
|---|---|
| **Azure IR** | Cloud-to-cloud data movement |
| **Self-hosted IR (SHIR)** | On-prem data sources, VNet-protected data |
| **Azure-SSIS IR** | Lift-and-shift SSIS packages |

**ADF Copy Activity:**
- Source → Sink
- Supports 90+ connectors
- Copy can be parallel (performance tuning)
- Schema mapping and data transformation

**Data Flow (ETL visual):**
- Spark-based transformation in ADF
- No code — visual data flow designer
- Runs on Azure Databricks cluster (auto-provisioned)

---

## 🏗️ DOMAIN 3 — Compute & Application Solutions (25–30%)

### Azure Virtual Machines

#### VM Selection Guide

| Series | Category | Use Case |
|---|---|---|
| **A** | Basic/Development | Dev/test, lightweight workloads |
| **B** | Burstable | Variable CPU usage, burst when needed |
| **D** | General Purpose | Most workloads, balanced CPU/memory |
| **E** | Memory Optimized | SQL, SAP, in-memory DBs |
| **F** | Compute Optimized | Batch processing, gaming servers |
| **G** | GPU | ML training, VDI, rendering |
| **H** | HPC | High-performance computing |
| **Ls** | Storage Optimized | Big data, Data Lake, NoSQL |
| **M** | Memory Large | Large SAP, SQL Server Enterprise |

**Av2-series:** Older, basic tier — avoid for production.

**B-series (Burstable):**
- Base CPU performance + burst credits
- Use credits when you need more CPU
- Good for: dev/test, websites with traffic spikes, small DBs
- Monitor credit balance — if depleted, VM runs at base speed

**M-series:**
- Up to 4TB RAM (M416ms_v2 = 4TB, 416 vCPUs)
- SAP HANA certified instances
- Very expensive — use only when required

#### VM Disks

| Disk Type | Max IOPS | Max Throughput | Use |
|---|---|---|---|
| **Standard HDD** | ~500 | ~60 MB/s | Dev/test, cheap storage |
| **Standard SSD** | ~2,000 | ~60 MB/s | Production dev/test workloads |
| **Premium SSD** | Up to 20,000 | Up to 900 MB/s | Production, business critical |
| **Ultra Disk** | Up to 400,000 | Up to 4,000 MB/s | Highest performance, SAP HANA, big data |

**Ultra Disk:** Attach as data disk only, not OS. Separate compute + storage billing.

**Managed Disks vs. Unmanaged:**
- Managed: Azure manages storage accounts, better SLA, Azure Backup integration
- Unmanaged: You manage storage account — NOT recommended

**Disk encryption:**
- SSE (Storage Service Encryption) — default, Microsoft-managed keys
- CMK via Azure Disk Encryption (ADE) — Windows BitLocker / Linux DM-Crypt
- Encryption at host — VM host server encrypts before data written to disk

#### VM High Availability

**Availability Set:**
- 2 or more VMs in same DC, different fault/update domains
- Protects against hardware failure within a single DC
- FD = different rack
- UD = different power/network
- **SLA: 99.95%** (when using 2+ VMs in same availability set)

**Availability Zones:**
- Physically separate DCs within a region
- 3 zones per region (not all regions have 3)
- Protects against entire DC outage
- VMs in different zones = **99.99% SLA**
- ZRS for managed disks in zone-redundant storage

**Proximity Placement Groups:**
- Keep VMs physically close to minimize latency
- Used for: SAP, HPC, low-latency cluster workloads
- Anti-affinity: spread VMs across zones

#### VM Scale Sets (VMSS)

- Auto-scale based on CPU, memory, custom metrics
- Load balancer or Application Gateway in front
- Uniform vs. Flexible orchestration mode
- Health extension for monitoring VM health
- Overprovisioning: launches extra VMs to ensure desired capacity during scaling

**When to use VMSS:**
- Hundreds of identical VMs
- Auto-scale web apps ( stateless workloads)
- Batch processing
- Microservices infrastructure

---

### Azure App Service

**PaaS for web apps, API apps, and background jobs.** Fully managed, auto-patching, auto-scale.

#### App Service Plans

| Tier | Workers | Use When |
|---|---|---|
| **Free / Shared** | Shared | Dev/test, lightweight apps |
| **Basic (B1/B2/B3)** | 1-3 | Dev/test production, low traffic |
| **Standard (S1/S2/S3)** | 4+ | Production web apps, auto-scale |
| **Premium (P0V3-P5V3)** | 4+ | Enterprise, larger scale, more slots |
| **Isolated (I1-I5)** | Dedicated hosts | Highest security, compliance |

**App Service Environments (ASE):**
- **ASE v3:** Single-tenant, deployed into your VNet (I1-I5 tiers)
- ASE v3 is generally available — no ASE v2
- Good for: high security, compliance, needing VNet integration without constraints
- Premium v3 uses Isolated SKU

**Deployment:**
- ZIP deploy, WAR deploy, Docker container (Web App for Containers)
- Deployment slots (staging/preview/prod)
- Swap with preview (test before production traffic)
- Auto-swap when validated

**Authentication:** EasyAuth — built-in Entra ID / Facebook / Google / Twitter auth, no code required.

**Networking:**
- VNet integration (regional) — call VNet resources without exposing to internet
- Hybrid connections — access on-prem resources via relay
- Private endpoint — access app from VNet only (no public internet)

---

### Azure Kubernetes Service (AKS)

#### Key Concepts

**Cluster architecture:**
- Control plane (managed by Azure): API server, etcd, scheduler, kubelet
- Node pools: set of VMs running kubelet + container runtime
- System node pool (runs system pods): at least 2 nodes for production
- User node pools: your application workloads

**Container runtime:** Azure uses `containerd` by default (not Docker) as of 2024.

**Node pools:**
- System pool: small, at least 2 nodes, don't run app workloads
- User pools: sized for your app, can be Windows or Linux
- Spot pools: cheap, preemptible nodes (Kubernetes supports taints/tolerations)
- Autoscaler: scale node count based on demand

#### AKS Networking Models

**Kubenet (basic):**
- Azure CNI assigns VNet IP to pods
- Simpler, limited pod networking
- Pods get IPs from separate subnet
- VNet integration requires additional config

**Azure CNI (overlay):**
- Pods get IPs from a logical overlay network
- Pod-to-pod communication stays in overlay
- Outbound to VNet/internet via node subnet
- Better for large clusters, advanced networking

**Network Policy:**
- Kubernetes Network Policy (Calico) — namespace/label-based rules
- Azure NSG at subnet level as alternative

#### AKS Security

| Feature | What It Does |
|---|---|
| **Azure AD integration** | Cluster auth via Entra ID |
| **Node pool RBAC** | Role bindings for namespaces |
| **Pod Security Standards** | Restrict pod capabilities |
| **Secrets in Key Vault** | CSI driver mounts Key Vault as volume |
| **Azure Policy addon** | Enforce governance at cluster level |
| **Azure Defender for Containers** | Runtime threat detection |

**Azure Key Vault as volume:**
```yaml
 volumes:
  - name: secrets
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: "azure-kv"
```

---

### Azure Functions

**Serverless compute.** You write code, Azure handles infrastructure.

#### Hosting Plans

| Plan | Cold Start | Billing | Use When |
|---|---|---|---|
| **Consumption** | 1-2 seconds | Per execution, 400,000 GB-s free | Infrequent, variable workloads |
| **Premium** | < 100ms (warm) | Always warm, vCPU/s memory reserved | Always-on, enterprise |
| **Dedicated (App Service)** | N/A | On your App Service plan | Existing plan, long-running |

**Premium features:**
- Always warm instances (no cold start)
- VNet integration
- Unlimited execution duration
- More memory and compute

**Durable Functions:**
- Stateful workflows in serverless
- Orchestrator functions: define workflow
- Activity functions: individual steps
- Entity functions: durable stateful objects
- Use for: approval workflows, long-running processes

**Function App:** Container for functions sharing config, deployment slot, scaling.

---

## 🔄 DOMAIN 4 — MIGRATIONS (5–10%)

> 💥 **This is the heavy section — the user specifically asked for migration depth.**

### Azure Migrate Overview

Azure Migrate = Hub for migration projects. Discovers, assesses, migrates.

#### Discovery

- **Agentless discovery:** VM analyzer connects to vCenter, extracts VM metadata without agents
- **Agent-based discovery:** Lightweight agent on VMs for app-level discovery
- **Hyper-V discovery:** Uses Hyper-V provider
- **Physical server:** Bootable USB or agent
- **Warehouse discovery:** Connect to data warehouses

#### Assessment

**Assessment criteria:**
- Performance-based sizing (right-size based on actual utilization)
- As-on-premises sizing (same specs, lift-and-shift)
- Azure readiness (suitable / partially suitable / suitable with remediation)
- Estimated Azure cost

**Assessment outputs:**
- Azure readiness classification
- Monthly cost estimate (compute + storage)
- Suggested VM size
- Network bandwidth requirements

#### Azure Migrate Appliance

- **VMware/Hyper-V:** Deployed as a VM on-prem
- Runs discovery + assessment agents
- Data sent to Azure Migrate (via internet or private link)
- Appliance requires: 16GB RAM, 6 cores, 80GB disk, internet connectivity

---

### Azure Site Recovery (ASR)

**The disaster recovery engine — not just for migrations, but continuous replication.**

#### What ASR Does

- **Continuous replication** of VMs to Azure (or secondary site)
- **Automated failover** when primary site goes down
- **Test failover** (drill without impacting production)
- **Recovery plans** — orchestrate multi-tier app failover order
- **RPO/RTO configurable** based on replication frequency

#### ASR: Azure-to-Azure (Cross-Region DR)

- Replicate Azure VMs from one region to another
- Fully managed by ASR service
- Enable from Azure Portal in minutes
- Managed disks automatically replicated
- Recovery regions: your choice (usually paired region)

**Replication policy:**
- RPO threshold (e.g., 1 minute — how much data loss is acceptable)
- Recovery point retention (how many recovery points to keep)
- App-consistent snapshots (VSS for Windows, freeze-script for Linux)

**Failover types:**
- **Planned failover** — no data loss, planned maintenance
- **Unplanned failover** — disaster scenario, potential data loss
- **Test failover** — drill, no production impact

**Recovery Plan:**
```markdown
Group 1 (Tier 0): AD + DNS (first)
Group 2 (Tier 1): App servers
Group 3 (Tier 2): Database servers (last)
Group 4: Post-steps (update DNS, runbooks)
```

#### ASR: On-Premises to Azure

**For VMware/Physical:**

1. Deploy **Process Server** (replication appliance) on-prem
2. Deploy **Configuration Server** (manages replication)
3. VMs get **Mobility Agent** installed (push or manual)
4. Replication: On-prem → Process Server → Azure Storage
5. Master Target Server in Azure creates the replicated VMs

**Unified Agent:** Single agent for VMware + physical servers (replaces old separate agents).

**For Hyper-V:**
- No agent needed — uses Hyper-V replica
- Hyper-V host replication → Azure
- System Center VMM supported (if using SCVMM, use SCVMM integration)

#### Azure VMware Solution (AVS) — Migration

AVS = VMware SDDC running natively on Azure. You don't manage the VMware stack.

**HCX (Hybrid Cloud Extension) — The AVS Migration Tool:**

| Migration Method | Downtime | Scale | How It Works |
|---|---|---|---|
| **Cold Migration** | High | Small | VM powered off, NFC copy |
| **HCX vMotion** | None | Small | Live migration, serial |
| **Bulk Migration** | Minimal | Large | Parallel, source off/dest on |
| **Replication Assisted vMotion (RAV)** | None | Large | Parallel, continuous replication |
| **OS Assisted Migration** | Conversion time | Any | KVM/Hyper-V to vSphere |

**HCX Service Mesh:**
- Connect on-prem vCenter to AVS private cloud
- Network extension: L2 stretch from on-prem to AVS
- VM IP/MAC preserved during migration
- **Best for lift-and-shift:** Move VMs without re-IP addressing

**AVS is ideal when:**
- VMware license exhausted / expensive (Broadcom pricing crisis)
- Want Azure benefits but can't re-architect
- Regulatory requirement for VMware
- Migration without redesign

**AVS vs. Native Azure:**
- AVS = VMware on Azure (lift-and-shift)
- Native Azure = re-architect to Azure services
- AVS is expensive but reduces migration complexity

---

### Azure Database Migration Service (DMS)

**Fully managed service for migrating databases to Azure with minimal downtime.**

#### Migration Modes

**Offline migration:**
- Source DB taken offline at migration start
- All data migrated in one shot
- Simpler but requires downtime
- DMS copies schema + data

**Online migration:**
- Continuous replication while source stays live
- Minimal downtime (cutover is quick)
- Uses change data capture (CDC)
- More complex, requires more planning

#### Supported Source → Target Paths

| Source | Target |
|---|---|
| SQL Server (on-prem, Azure VM, AWS RDS) | Azure SQL DB, SQL MI, Azure VM |
| Oracle | Azure SQL DB (Pol利), Oracle on Azure VM |
| PostgreSQL (on-prem, AWS RDS) | Azure Database for PostgreSQL |
| MySQL (on-prem, AWS RDS) | Azure Database for MySQL |
| MongoDB | Azure Cosmos DB (MongoDB API) |
| SAP ASE (Sybase) | SAP ASE on Azure VM |

#### DMS Workflow

1. **Create DMS instance** — choose region, SKU (Standard / Premium)
2. **Create migration project** — source type + target type
3. **Connect to source** — credentials, connection string
4. **Connect to target** — Azure DB connection
5. **Run assessment** — Data Migration Assistant (DMA) checks compatibility
6. **Configure migration** — select tables, mapping
7. **Cutover** — go/no-go based on replication lag
8. **Complete migration** — source offline, target live

#### Data Migration Assistant (DMA)

- Free tool you download locally
- Runs **assessment** before DMS migration
- Reports: compatibility issues, breaking changes, behavior changes
- Example: migrating SQL Server → Azure SQL DB: detects features used that aren't supported in PaaS

**Common compatibility blockers:**
- `sp_executesql` with parameterized queries (varies)
- Linked servers (SQL MI doesn't support)
- SQL Server Agent jobs (need to recreate in Azure)
- CLR assemblies (not supported in SQL DB, only MI)
- Service Broker (not in SQL DB Standard)

#### Azure DMS v3 (New Version)

- Single-phase migration (assessment → migrate in one flow)
- Built-in SKU recommendations
- No VM deployment needed (fully managed)
- Better monitoring and troubleshooting

---

### SQL Server to Azure SQL — Migration Paths

#### Lift-and-Shift: SQL Server on Azure VM

- 100% compatible — runs full SQL Server
- Same tools, same features, same management
- You manage the VM + SQL Server
- **Use when:** need features not in PaaS, complex replication, legacy apps
- Azure Hybrid Benefit: use existing SQL licenses

#### Modernize: SQL Server → Azure SQL DB / MI

**Azure SQL Managed Instance:**
- Near 100% SQL Server compatibility
- Instance-level features: linked servers, SQL Agent, CLR, Service Broker
- **Migrate with DMA:** Assessment → Validate → Migrate via DMS
- Network: ExpressRoute or VPN to VNet, private endpoint

**Azure SQL Database:**
- PaaS — fully managed
- **Does NOT support:** linked servers, Agent jobs, CLR, Service Broker
- **Supports:** SQL auth, contained DB users, elastic pools
- Migration: DMA assessment required first

#### Migration Assessment Checklist

```markdown
□ DMA assessment completed — 0 critical blockers
□ Azure AD auth configured (if migrating from Windows Auth)
□ Network connectivity: ExpressRoute or VPN established
□ Target SKU sized based on assessment (performance-based)
□ Database collation compatible
□ Firewall rules migrated (Azure SQL firewall)
□ Login/USER mapping updated post-migration
□ SQL Agent jobs recreated (if MI)
□ Backups configured on new target
□ Application connection strings updated
□ Monitoring + alerts enabled on new instance
```

---

### AD / Identity Migration

#### Migrating to Microsoft Entra ID

**Azure AD Connect scenarios:**

**Greenfield (new Azure AD):**
- Cloud-only identities from day one
- Simple, no sync complexity

**Brownfield (existing on-prem AD):**
- PHS: Simple, sync password hashes
- PTA: No hash storage in cloud
- Federation: Full ADFS trust (complex)

#### Multi-Forest AD Migration

**Scenario:** Two or more AD forests → single Entra ID tenant.

**Options:**
1. **Multiple Azure AD Connect servers** — each forest has its own sync
   - Each AAD Connect has its own sync scope
   - Cloud anchor: objectSID for users, netbiosdomain\username for UPN conflicts
   - Cannot have conflicting user principal names

2. **MIM (Microsoft Identity Manager)** — complex consolidation
   - For very complex multi-forest scenarios
   - Advanced identity mapping and de-duplication
   - High complexity, high cost

**Exchange Hybrid:**
- Azure AD Connect with Exchange Hybrid configuration
- Mail routing through Exchange Online
- Mailboxes: on-prem + cloud simultaneously
- Required for seamless Exchange → Exchange Online migration

#### Azure AD Connect Health

- Monitor sync errors
- Alert on: object not synced, password hash sync failure, health agent down
- Dashboard: UPN suffix, forest count, object statistics
- **Critical for migrations:** Before cutting over, ensure sync is healthy

---

### Application Migration Patterns

#### Lift-and-Shift (Rehost)

- Move VMs as-is to Azure
- Azure Migrate Server Migration
- Fast, low risk, no code changes
- Not optimized — may overpay for resources

#### Lift-and-Shift with Optimization

- Migrate, then right-size after migration
- Use Azure Migrate to get performance data post-migration
- Adjust VM sizes, remove unused disks

#### Refactor (PaaS Shift)

- Move app tier to App Service / AKS
- Database to Azure SQL / Cosmos DB
- Requires testing, possible code changes
- Long-term cost savings and manageability

#### Re-architect

- Rewrite significant portions for cloud-native
- Microservices on AKS
- Event-driven on Azure Functions
- Expensive, long timeline, maximum benefit

#### Repurchase (SaaS)

- Move to SaaS (e.g., on-prem CRM → Dynamics 365)
- Eliminating management overhead
- Licensing changes

---

### Azure Migration — Network Considerations

#### Connectivity Options for Migration

| Method | Use When |
|---|---|
| **Site-to-Site VPN** | < 1Gbps, single region, low complexity |
| **ExpressRoute** | > 1Gbps, multi-region, private connectivity, SLA |
| **ExpressRoute Global Reach** | On-prem to on-prem via Azure |
| **Azure VWAN** | Large branch-to-cloud, global |
| **Azure Virtual Network Peering** | VNet to VNet within/between regions |
| **Private Link / Private Endpoint** | Access Azure PaaS without going over internet |

#### DNS Migration

- **Azure Private DNS zones:** Auto-registration of VMs
- **On-prem DNS integration:** Conditional forwarders to Azure
- **Hybrid DNS:** Split-brain — different answers for on-prem vs. cloud
- **Private Resolver:** On-prem can query Azure DNS without VPN

#### Traffic Routing After Migration

- **Azure Front Door / App Gateway:** Global load balancer + WAF
- **Traffic Manager:** DNS-based routing (failover, performance, priority)
- **Azure Load Balancer:** Layer 4, any port
- **Application Gateway:** Layer 7, HTTP/HTTPS, URL routing, WAF

---

## 🌐 DOMAIN 5 — Networking (Cross-Cutting)

### VNet & Subnet Design

**VNet:** Private address space in Azure (RFC 1918).
**Subnets:** Segmentation within VNet.

| RFC 1918 Block | Range |
|---|---|
| /16 | 10.0.0.0 – 10.255.255.255 |
| /12 | 172.16.0.0 – 172.31.255.255 |
| /8 | 192.168.0.0 – 192.168.255.255 |

**Best practices:**
- Use /24 or /26 per subnet (don't go too small)
- Reserve address space for growth
- Don't use entire /8 for one VNet

**Subnets:**
- Azure reserves 5 addresses per subnet (first 4 + last 1)
- GatewaySubnet: must be /27 or larger for VPN/ER gateways

### Network Security Groups (NSG)

- Layer 3-4 firewall at subnet or NIC level
- Priority: 100–4096 (lower = higher priority)
- Stateful: return traffic auto-allowed
- Default rules (cannot be deleted):
  - Allow VNet inbound/outbound
  - Allow Azure Load Balancer
  - Deny all else

### Azure Private Link

**Private Endpoint:** Brings Azure PaaS into your VNet with a private IP.

- Storage: `*.privatelink.blob.core.windows.net`
- SQL: `*.privatelink.database.windows.net`
- No public IP on the PaaS resource
- Traffic never leaves Microsoft network
- Zone-level DNS resolution for private connectivity

**Private Link vs. Service Endpoint:**

| | Private Link | Service Endpoint |
|---|---|---|
| Traffic | Through Microsoft backbone | Through Azure backbone |
| Access | Any VNet + on-prem (PEAM) | VNet subnets only |
| MS backbon | ✅ Always | ✅ Within Azure |
| On-prem access | ✅ Via VPN/ER | ❌ VNet only |

### ExpressRoute vs. VPN

| | ExpressRoute | Site-to-Site VPN |
|---|---|---|
| **Connectivity** | Private, dedicated circuit | Over internet |
| **Bandwidth** | Up to 100 Gbps | Up to 1.25 Gbps per tunnel |
| **SLA** | 99.95% (dual-carrier) | 99.9% |
| **Latency** | Lower, deterministic | Variable |
| **Encryption** | MACsec (layer 2) | IPsec (tunnel) |
| **Cost** | Monthly + egress | Metered |
| **Use for** | Enterprise production, hybrid | Smaller, dev/test |

**ExpressRoute Direct:** Connect at Microsoft edge directly, up to 100Gbps.

---

## 🔄 DOMAIN 6 — Business Continuity & Disaster Recovery (10–15%)

### Recovery Objectives

| Metric | What It Measures |
|---|---|
| **RTO** (Recovery Time Objective) | How long until service is back online |
| **RPO** (Recovery Point Objective) | How much data loss is acceptable |
| **RPO = 0** | Zero data loss — synchronous replication |
| **RPO = 1 hour** | Accept losing up to 1 hour of data |

### Azure Backup

**What it backs up:**

| Workload | Agent / Method |
|---|---|
| Azure VMs (Windows/Linux) | VM extension (no agent needed) |
| On-prem VMs | MARS agent |
| SQL Server in VM | SQL VSS Writer + MARS agent |
| Files/folders | MARS agent |
| SAP HANA in VM | HANA backup extension |
| Blobs | Immutable + lifecycle policies |
| Azure Files | Built-in backup (share-level) |

**Backup policies:**
- Daily / weekly / monthly / yearly schedules
- Retention: immediate (snapshot) + long-term (LTR)
- Instant restore: snapshot mounted directly, no copy needed

**Azure Backup for SQL in Azure VM:**
- Full, differential, log backups
- PITR to any point within retention
- Backup to local disk + vault (geo-redundant)

### Azure Site Recovery — DR Design

**DR architecture decision tree:**

```
Is the workload mission-critical?
├── YES → Multi-region DR with ASR
│         - RPO: 1-60 min (configurable)
│         - RTO: < 1 hour (with recovery plan)
│         - Test failover quarterly
│
├── PARTIAL → Single-region with Availability Zones
│            - AZ outage protection
│            - Zone-redundant storage
│            - RTO depends on restart/reprovision
│
└── NON-CRITICAL → Backup only
                    - Azure Backup
                    - RTO: time to restore from vault
```

**DR for multi-tier apps:**
- Use **Recovery Plans** to orchestrate tier-by-tier failover
- Dependencies must be mapped
- Network: Azure Bastion, DNS updates, connection strings
- Test: Run DR drill at least quarterly

### High Availability — Azure-native

**Zonal services (deploy to specific AZ):**
- VMs with Availability Zone (zonal)
- Managed disks with ZRS
- Public IP Standard with zone冗余
- Load Balancer Standard with zone冗余

**Zone-redundant services:**
- Azure SQL (zone-redundant HA)
- Cosmos DB (zone redundancy option)
- ADLS Gen2 (ZRS)
- Event Hubs (zone redundancy)

**Availability Set vs. Zone:**

| | Availability Set | Availability Zone |
|---|---|---|
| Scope | Single DC | Multiple DCs in region |
| Protects | Hardware fault | Entire AZ outage |
| Cost | Included | Per-zone charges |
| Complexity | Lower | Higher |

---

## 💰 COST OPTIMIZATION

### Right-Sizing

- Azure Migrate assessment gives sizing recommendations
- Azure Advisor: Right-size underutilized VMs
- Azure Reserved Instances: 1 or 3 year commitment = 72% savings vs. pay-as-you-go
- Azure Hybrid Benefit: Use existing Windows Server / SQL Server licenses

### Compute Savings Options

| Option | Savings | Use When |
|---|---|---|
| **Reserved Instances (1yr/3yr)** | Up to 72% | Steady, predictable workloads |
| **Savings Plans (1yr/3yr)** | Up to 60% | Flexible, any compute |
| **Spot VMs** | Up to 90% | Interruption-tolerant batch, dev/test |
| **Azure Hybrid Benefit** | 100% of license cost | Existing Windows/SQL licenses |
| **Dev/Test pricing** | Up to 50% | Development/sandbox subscriptions |

### Storage Cost Optimization

- Use Cool/Cold/Archive tiers for infrequently accessed data
- Lifecycle policies: auto-transition from Hot → Cool → Archive
- ZRS only where needed (use LRS for non-critical)
- Soft delete + immutability for compliance at minimum extra cost
- Azure Files snapshots for cheap backup

---

## 🏛️ AZURE WELL-ARCHITECTED FRAMEWORK

| Pillar | Key Focus |
|---|---|
| **Cost** | Right-size, reserve, spot, monitor spend |
| **Resiliency** | HA/DR design, SLA awareness, automatic recovery |
| **Security** | Defense in depth, Zero Trust, least privilege |
| **Performance** | Auto-scale, caching, CDN, async patterns |
| **Operations** | Monitoring, alerting, IaC, automation |

---

## ⚡ QUICK REFERENCE — Decision Trees

### Which Database?

```
Need relational?
├── SQL Server compatibility (full)?
│   ├── Need linked servers / Agent / CLR?
│   │   └── YES → SQL Managed Instance
│   │   └── NO → Azure SQL Database
│   └── Lift-and-shift existing SQL Server VM?
│       └── YES → Azure VM with SQL
└── NoSQL / Flexible schema?
    ├── Global distribution?
    │   └── YES → Cosmos DB
    │   └── NO → Azure Table Storage
    └── Analytics / Data Lake?
        └── YES → ADLS Gen2 + Synapse
```

### Which Migration Path?

```
Is it a VM?
├── Lift-and-shift → Azure Migrate (ASR)
├── Replatform → Azure Migrate + right-size
└── Refactor → App Service / AKS
Is it a database?
├── SQL Server? → DMA → DMS → Azure SQL / MI
├── Oracle? → DMS → Azure VM with Oracle
└── PostgreSQL/MySQL? → DMS → Azure Database for PostgreSQL/MySQL
Is it VMware?
├── AVS compatible? → Azure VMware Solution + HCX
└── Can re-architect? → Native Azure PaaS
```

### Which Identity?

```
On-prem AD exists?
├── YES → Azure AD Connect (PHS / PTA / Federation)
│   ├── Simple sync, cloud fallback → PHS
│   ├── No hash in cloud, MFA on-prem → PTA
│   └── Complex auth, smart card → Federation
└── NO → Cloud-only Entra ID
Need SSO to SaaS?
├── YES → Entra ID Application Proxy / SAML
└── NO → Direct auth
```

---

## 📝 Exam Day Tips

1. **Read the scenario first** — identify the business requirement before looking at options
2. **RTO/RPO questions** — know which service supports which RPO
3. **"Least disruptive"** → prefer lift-and-shift over re-architect
4. **"Most cost-effective"** → right-sizing + reserved capacity
5. **"Zero data loss"** → synchronous replication (Availability Zones)
6. **"Global distribution"** → Cosmos DB, Front Door, Traffic Manager
7. **"Hybrid identity"** → Azure AD Connect + Entra ID
8. **"VMware on Azure"** → Azure VMware Solution (HCX for migration)
9. **"Multi-region DR"** → ASR with failover groups or Cosmos DB multi-region
10. **"Serverless"** → Azure Functions, Logic Apps, Azure SQL Serverless

---

*Study hard. Pass the exam. 🐉*
*Last updated: June 2026*
