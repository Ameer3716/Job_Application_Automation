# AI Job Application Automation System - Backend

NestJS backend for the AI Job Application Automation System using Supabase for database.

## Features (Phase 1 - MVP)

- ✅ Manual job paste input with AI extraction endpoint (ready for integration)
- ✅ CV library management with file upload
- ✅ CV matching algorithm (keyword-based, ready for AI enhancement)
- ✅ Application tracking with full CRUD operations
- ✅ Duplicate detection
- ✅ JWT Authentication
- ✅ Supabase PostgreSQL integration via TypeORM
- ✅ Rate limiting configuration placeholders

## Tech Stack

- **Framework**: NestJS
- **Database**: Supabase PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **File Upload**: Multer

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the environment variables:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `GEMINI_API_KEY`: Your Google Gemini API key (free tier available)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: For future Supabase Auth integration

## Running the App

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Applications
- `POST /api/applications` - Create new application
- `GET /api/applications` - Get all applications (optional: `?status=` or `?company=`)
- `GET /api/applications/:id` - Get single application
- `PATCH /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `POST /api/applications/paste` - Process job description paste (AI extraction)
- `GET /api/applications/duplicates/check?company=&jobTitle=&jobUrl=` - Check for duplicates

### CVs
- `POST /api/cvs` - Upload CV (multipart/form-data with 'file' field)
- `GET /api/cvs` - Get all active CVs
- `GET /api/cvs/:id` - Get single CV
- `PATCH /api/cvs/:id` - Update CV metadata
- `DELETE /api/cvs/:id` - Soft delete CV
- `POST /api/cvs/match` - Find best CV match for a job description

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/test-protected` - Test JWT authentication

## Database Schema

The system uses the schema defined in Part 7 of the spec:

```sql
applications (
  id, date_applied, source, apply_method, company, job_title,
  location, work_mode, employment_type, recipient_email,
  application_url, recruiter_name, job_url, job_description,
  required_skills, job_category, selected_cv, cv_match_confidence,
  email_subject, email_body, email_status, application_status,
  follow_up_date, screenshot_path, notes
)

cvs (
  id, uploaded_at, file_name, file_path, skills, experience,
  education, years_of_experience, target_roles, is_active, metadata
)
```

## Next Steps (Phase 1 Completion)

1. **AI Integration**: Implement Gemini Flash API calls in:
   - `ApplicationsService.processJobPaste()` - Extract structured data from job descriptions
   - `CvsService.findBestMatch()` - Semantic CV matching
   - Email generation service (to be created)

2. **Email Service**: Create Gmail API OAuth integration for sending personalized emails

3. **Dashboard**: Build frontend dashboard (React/Next.js or keep Streamlit for MVP)

4. **Job Discovery Module**: Implement Crawl4AI scraper for Tier-A sources (Greenhouse, Lever, Ashby, RemoteOK, WWR)

5. **Browser Automation**: Implement Playwright scripts for ATS form auto-fill

## Roadmap

- [x] Phase 0: Existing cold-outreach engine (in separate repo)
- [x] Phase 1 MVP: Backend foundation (this project)
- [ ] Phase 1 Complete: AI extraction + CV matching + Email generation + Gmail OAuth
- [ ] Phase 2: Job Discovery Module (Crawl4AI)
- [ ] Phase 3: Browser Automation (Playwright)
- [ ] Phase 4: Auto-Send/Auto-Submit Mode with guardrails
- [ ] Phase 5: Optional browser extension for LinkedIn

## Security Notes

- Never commit `.env` file
- Use OAuth for Gmail (no passwords stored)
- Validate all file uploads (type, size)
- Rate limit all outbound actions
- Keep LinkedIn off automated paths (see spec Part 1)
