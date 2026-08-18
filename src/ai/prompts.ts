/**
 * Prompt templates for AI operations.
 * Each prompt enforces safety rules: never invent missing data, write "Unknown" instead.
 */

export const EXTRACTION_PROMPT = `You are an expert job posting analyzer. Extract structured information from the following job description text.

CRITICAL SAFETY RULES:
- NEVER invent or guess information that is not explicitly stated in the text
- If a field is not mentioned, set it to "Unknown" or null
- NEVER fabricate email addresses, recruiter names, or company names
- Extract ONLY what is clearly stated in the text

Return a valid JSON object with exactly these fields:
{
  "company": "string - Company name or 'Unknown'",
  "jobTitle": "string - Job title/position or 'Unknown'",
  "location": "string - Work location or 'Unknown'",
  "workMode": "string - 'Remote' | 'Hybrid' | 'On-site' | 'Unknown'",
  "employmentType": "string - 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship' | 'Unknown'",
  "recipientEmail": "string - Contact/application email found in text, or 'Unknown'",
  "recruiterName": "string - Recruiter/hiring manager name found in text, or 'Unknown'",
  "requiredSkills": "string - Comma-separated list of required skills/technologies",
  "experienceLevel": "string - 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Unknown'",
  "salaryRange": "string - Salary info if mentioned, or 'Unknown'",
  "applicationUrl": "string - Application URL if mentioned, or null",
  "summary": "string - Brief 2-3 sentence summary of the role"
}

Job Description Text:
---
{JOB_TEXT}
---

Return ONLY the JSON object, no markdown, no code fences, no explanation.`;


export const CATEGORIZATION_PROMPT = `You are a job category classifier. Based on the job title and description, assign one or more categories from this list:

Categories: Full Stack, Frontend, Backend, AI/ML, DevOps/Cloud, Mobile, Data Engineering, Data Science, QA/Testing, Security, UI/UX Design, Product Management, Project Management, Technical Writing, Other

Return a JSON object:
{
  "categories": ["string", "string"],
  "primaryCategory": "string - The single best-fit category"
}

Job Title: {JOB_TITLE}
Job Description Summary: {JOB_SUMMARY}
Required Skills: {REQUIRED_SKILLS}

Return ONLY the JSON object, no markdown, no code fences.`;


export const EMAIL_GENERATION_PROMPT = `You are writing a job application email on behalf of a software developer. 

CRITICAL RULES:
- Keep it SHORT (3-4 paragraphs max, under 200 words)
- Be honest — NEVER exaggerate experience or claim skills the candidate doesn't have
- NEVER invent companies, projects, or achievements
- Be professional but human — no buzzword soup
- Reference specific aspects of the job that match the candidate's skills
- End with a clear call to action

Candidate's CV Skills: {CV_SKILLS}
Candidate's Experience: {CV_EXPERIENCE}
Candidate's Target Roles: {CV_TARGET_ROLES}

Job Details:
- Company: {COMPANY}
- Position: {JOB_TITLE}
- Required Skills: {REQUIRED_SKILLS}
- Job Summary: {JOB_SUMMARY}

Write the email body only (no subject line, no "Dear" greeting — those are handled separately).
Return ONLY the email text, no markdown formatting.`;


export const SUBJECT_LINE_PROMPT = `Generate a professional email subject line for a job application.

Company: {COMPANY}
Position: {JOB_TITLE}
Candidate Name: {CANDIDATE_NAME}

Rules:
- Professional and specific
- Include the position title
- Under 80 characters
- No clickbait or gimmicks

Return ONLY the subject line text, nothing else.`;


export const CV_MATCHING_PROMPT = `You are a CV-to-job matching expert. Analyze how well the candidate's CV matches the job requirements.

Job Requirements:
- Title: {JOB_TITLE}
- Required Skills: {REQUIRED_SKILLS}
- Experience Level: {EXPERIENCE_LEVEL}
- Job Description: {JOB_DESCRIPTION}

Candidate CV:
- Skills: {CV_SKILLS}
- Experience: {CV_EXPERIENCE}
- Education: {CV_EDUCATION}
- Years of Experience: {CV_YEARS}
- Target Roles: {CV_TARGET_ROLES}

Return a JSON object:
{
  "confidence": number (0-100, where 100 is perfect match),
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "reasoning": "string - Brief explanation of the match score",
  "recommendation": "string - 'strong_match' | 'good_match' | 'partial_match' | 'weak_match'"
}

Be realistic — don't inflate scores. A 70+ score means the candidate is genuinely qualified.
Return ONLY the JSON object, no markdown, no code fences.`;
