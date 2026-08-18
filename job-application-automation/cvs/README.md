# CV Library Folder Structure

Upload your CVs to the appropriate category folders below. The system will automatically scan these folders and index them in the database.

## Folder Structure

```
cvs/
├── fullstack/          # Full Stack Developer CVs
├── backend/            # Backend Developer CVs
├── frontend/           # Frontend Developer CVs
├── ai-ml/              # AI/ML Engineer CVs
└── devops/             # DevOps Engineer CVs
```

## Supported File Formats
- PDF (`.pdf`) - Recommended
- DOCX (`.docx`)
- TXT (`.txt`)

## Naming Convention
Name your files descriptively for easy identification:
- `senior_fullstack_5yrs.pdf`
- `mid_level_backend_nodejs.pdf`
- `ml_engineer_tensorflow_pytorch.pdf`

## How to Add CVs

### Option 1: Push directly to GitHub
1. Place your CV files in the appropriate category folder
2. Commit and push to the `main` branch (or your working branch)
3. The system will automatically detect new files on the next sync

### Option 2: Upload via Dashboard (Coming Soon)
- Use the admin dashboard to upload CVs directly
- Fill in metadata (skills, experience, etc.)
- System auto-indexes into the CV library

## CV Metadata (Auto-Extracted)
The system extracts the following from each CV:
- Skills/Technologies
- Years of Experience
- Education
- Notable Projects/Companies
- Role Category

## Notes
- Maximum file size: 5MB per CV
- Keep CV count under 10 per category for optimal matching performance
- Update CVs regularly to keep them current
