# AZ-305 Study Guides

Versions of the AZ-305 Cram Guide.

| Version | Date | Notes |
|---|---|---|
| [v1](v1/) | June 2026 | Initial release — unversioned filenames |
| [v2](v2/) | June 2026 | Migration heavy edition — versioned filenames |

## Regenerate PDF

```bash
cd az305/v2/
python3 md2pdf.py
# Output: AZ-305-Cram-Guide-v2.pdf
```

## Adding a new version

1. `cp -r az305/v{N} az305/v{N+1}`
2. Edit the markdown inside `az305/v{N+1}/`
3. Run `python3 md2pdf.py` to regenerate the PDF
4. Update this README
