# Study Guides

Printable cram/cheat sheet PDFs for certification exams.

```
study-guides/
├── README.md
├── az305/
│   ├── README.md
│   ├── v1/              ← June 2026
│   │   ├── AZ-305-Cram-Guide.md
│   │   ├── AZ-305-Cram-Guide.pdf
│   │   └── md2pdf.py
│   └── v2/              ← June 2026 — Migration Heavy Edition
│       ├── AZ-305-Cram-Guide-v2.md
│       ├── AZ-305-Cram-Guide-v2.pdf
│       └── md2pdf.py
├── gcp-pca/
│   ├── README.md
│   └── v1/              ← June 2026 — v6.1 exam (Oct 2025)
│       ├── GCP-PCA-Cram-Guide-v1.md
│       ├── GCP-PCA-Cram-Guide-v1.pdf
│       └── md2pdf.py
└── ai103/
    ├── README.md
    └── v1/              ← June 2026 — Beta April 2026 / Live June 2026
        ├── AI-103-Cram-Guide-v1.md
        ├── AI-103-Cram-Guide-v1.pdf
        └── md2pdf.py
```

## Available Guides

| Exam | Version | Status | PDF |
|---|---|---|---|
| AZ-305 Azure Solutions Architect | v1 | ✅ | `az305/v1/` |
| AZ-305 Azure Solutions Architect | **v2 (Migration Heavy)** | ✅ | `az305/v2/` |
| GCP Professional Cloud Architect | v1 (v6.1) | ✅ | `gcp-pca/v1/` |
| AI-103 Azure AI App & Agent Developer | v1 | ✅ | `ai103/v1/` |

## Regenerate a PDF

```bash
cd <exam>/<version>/
python3 md2pdf.py
```

Requires: `pip install reportlab markdown`
