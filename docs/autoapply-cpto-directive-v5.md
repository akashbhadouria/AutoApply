# AutoApply CPTO Directive

Version: v5.0  
Date: March 8, 2026  
Author: CPTO, AutoApply

## Purpose

This document replaces any ambiguous or conflicting recommendations from prior consulting drafts. It captures the final product, platform, onboarding, automation, and commercial direction that engineering and consulting teams must follow.

This is the version to review against. Any prior statement that conflicts with this document should be treated as superseded.

## Executive Decision

AutoApply will launch with LinkedIn from day 1.

AutoApply will not expose scheduling, platform-specific timing, batching, throttling, or automation operations to the user. The user connects accounts, completes onboarding, sets job preferences, and the system handles the rest in the background.

The product must be designed around three priorities:

1. Lowest practical operating cost.
2. High customer appeal and strong conversion.
3. Maximum automation with minimum user interruption.

This is not a browser-extension-only product. This is a backend-managed automation platform with user-authorized platform connections.

## Final Product Principles

### 1. User Does Not Operate the System

The user must never be asked to:

- schedule platform-specific application windows
- choose which platform runs at which hour
- manually throttle per-platform actions
- configure queue priorities
- manage retries or re-run failed applications

The user only does the following:

- signs up
- completes onboarding
- uploads resume
- connects one or more platforms
- sets profile details and job preferences
- responds only when truly new questions are discovered

Everything else is backend-owned.

### 2. Platform Connection Is Mandatory for Automation

Platform connection must happen inside onboarding.

If the user has not connected at least one platform, automation cannot start.

Required blocking message:

`At least one job platform must be connected before AutoApply can discover or apply to jobs on your behalf.`

Behavior:

- onboarding may continue
- activation may not complete
- dashboard must show a warning banner
- auto-apply must remain disabled

### 3. Onboarding Must Minimize Later Interruptions

The onboarding system must collect the maximum useful structured information up front so that later interruptions are rare.

The goal is not just profile completion. The goal is reducing future unknown fields during applications.

### 4. LinkedIn Is Mandatory From Day 1

LinkedIn will be supported at launch.

It must be treated as a high-risk, heavily controlled platform with stricter safeguards than Naukri, Instahyre, or Hirist.

LinkedIn may be labeled `Beta`, but it must still be available from day 1.

## Final LinkedIn Policy

The following LinkedIn limits are non-negotiable:

- `25 Easy Apply per user per day`
- `5 Full Apply per user per day`

These are separate counters and must be enforced independently.

Additional LinkedIn rules:

- limits enforced in both scheduler logic and database/accounting logic
- applications spread across the day in the user timezone
- no burst behavior
- randomized delays and browsing behavior
- automatic pause on restriction, repeated failure, or abnormal detection signals
- user consent required before LinkedIn activation
- global kill switch required
- per-user pause/resume required

The platform must not market LinkedIn as unlimited or unrestricted automation.

## Backend-Owned Automation Policy

AutoApply must use a central policy engine that decides:

- which connected platform to scan
- which jobs to prioritize
- which jobs to skip
- when an application should run
- whether a job should use HTTP, browser, or fallback mode
- how retries are scheduled
- when a platform should pause

The user should not see platform scheduler controls.

The user-facing model is:

- connect accounts
- define preferences
- automation runs automatically

## Onboarding Product Specification

### Design Standard

The onboarding flow must feel premium, simple, and conversion-focused.

Requirements:

- stepper-based layout
- strong desktop and mobile usability
- large clear input controls
- fast transitions between steps
- autosave at every step
- resume-based prefilling
- review/edit workflow instead of forcing manual entry where possible
- low cognitive load
- polished visual design

This should not look like an internal admin form. It is a consumer growth surface and must be treated like one.

### Required Onboarding Flow

#### Step 1: Welcome and Value Setup

Purpose:

- explain what AutoApply does
- set expectations
- reduce drop-off before asking for effort

Content:

- one-line value proposition
- short trust explanation
- privacy and consent summary
- CTA to begin onboarding

#### Step 2: Resume Upload and Smart Prefill

Purpose:

- extract as much structured profile data as possible

Requirements:

- PDF/DOCX upload
- parsing with low-cost API-first approach
- show extracted data clearly
- allow quick corrections

#### Step 3: Core Identity and Contact Details

Fields:

- first name
- last name
- primary email
- phone number
- country code
- current city
- work authorization

#### Step 4: Work Profile

Fields:

- current company
- current designation
- total years of experience
- additional months of experience
- current CTC or salary
- expected CTC or salary
- notice period
- willing to relocate
- preferred relocation cities if applicable

These are high-frequency application fields and should not be postponed.

#### Step 5: Job Preferences

Fields:

- desired job titles
- preferred locations
- minimum salary
- work type
- employment type
- target industries if applicable

#### Step 6: Education, Skills, and Links

Fields:

- highest degree
- university
- graduation year
- field of study
- skills
- certifications
- LinkedIn profile URL
- GitHub URL
- portfolio URL

#### Step 7: Common Application Answers

Purpose:

- reduce future interruptions from recurring ATS questions

Suggested fields:

- cover letter template
- short professional summary
- why looking for a new role
- notice period phrasing
- relocation statement
- sponsorship/work authorization statement
- other repeated open-ended answers

This step may be partially skippable, but its value should be explained clearly.

#### Step 8: Connect Platforms

This step is mandatory for activation.

Supported day-1 platform connections:

- LinkedIn
- Naukri
- Instahyre
- Hirist

Rules:

- user may connect one or many
- at least one connected platform is required
- system will automatically use all connected platforms
- no user-side scheduling

LinkedIn-specific UX:

- show `Beta` badge
- require explicit consent
- clearly explain guarded limits and platform risk

#### Step 9: Review and Activate

Activation only succeeds when:

- required profile fields are complete
- at least one platform is connected
- consent is accepted

Activation message should make it clear that the system will begin background discovery and automated applications automatically.

## Platform Connection Specification

The official product language must be:

`user-authorized platform session capture and reuse`

Do not use phrases like:

- session hijacking
- hijack cookies
- impersonation

Formal documents, user-facing copy, legal copy, and investor materials must use precise and defensible wording.

Primary connection flow:

- Chrome extension captures cookies and required local/session storage
- data is sent securely to backend
- backend encrypts and stores session material
- automation reuses the session in browser or HTTP contexts as needed

Fallback:

- remote browser capture for users who cannot use the extension

## Platform Strategy

### LinkedIn

- launch from day 1
- browser-based automation
- highest risk profile
- strictest safeguards

### Naukri

- HTTP-first where possible
- browser fallback for custom flows
- one of the lowest-cost sources of volume

### Instahyre

- HTTP-first
- very efficient operationally

### Hirist

- HTTP-first where possible
- browser fallback only when required

### ATS Platforms

- browser automation
- driven by discovered job URLs
- no user session connection required in the same way as marketplace platforms

## Automation and Scheduling Requirements

The scheduler must be centralized and policy-driven.

Minimum rules:

- only connected platforms are active
- each platform has its own caps and timing rules
- jobs are prioritized by fit, freshness, and applyability
- HTTP routes are preferred when available
- browser work is reserved for platforms and forms that require it
- duplicate company/job guardrails exist per user
- paused or unhealthy platforms are skipped automatically

This system must be invisible to the user.

## Unknown Field Handling

Unknown field handling must remain non-blocking.

Required behavior:

- do not keep the browser blocked waiting for user input
- capture field context and screenshot
- notify user in a bundled format
- parse response
- update profile or answer store
- re-queue automatically with urgent priority

Goal:

- ask only when necessary
- learn globally when safe
- reduce future interruptions across the user base

## Cost and Infrastructure Direction

The following principles remain approved:

- PostgreSQL queueing is acceptable at this stage
- Docker Compose is acceptable at this stage
- Redis is not required if Postgres-backed queueing is sufficient for actual throughput
- Kubernetes is unnecessary at this stage
- HTTP-first apply paths are critical for cost control
- browser concurrency must be treated as the scarce resource

The infrastructure plan should optimize for:

- low compute cost
- simplicity of operations
- easy observability
- safe scaling path

## Pricing and Business Guardrails

Previous pricing assumptions are directionally aggressive and must be validated against real operations.

The pricing model must account for:

- support costs
- LinkedIn risk operations
- proxy costs
- session expiry and reconnection burden
- platform breakage maintenance
- notification costs
- browser-heavy workloads

Working guidance:

- do not assume extremely high margins until real support and proxy costs are measured
- do not anchor the US offer too low without validating operational burden
- do not market unlimited behavior if hidden caps and practical safeguards exist

The product can still be priced aggressively, but projections must be operationally honest.

## Legal and Compliance Direction

Before launch, formal review is required on:

- platform ToS exposure
- consent language
- session storage language
- liability wording
- India data handling requirements
- US market implications where relevant
- WhatsApp Business API compliance

All consent flows must be explicit and auditable.

## Required Changes to Earlier Consulting Drafts

The following changes are mandatory:

1. Replace all LinkedIn limits that conflict with:
   `25 Easy Apply/day/user + 5 Full Apply/day/user`
2. Remove any recommendation to delay LinkedIn beyond launch.
3. Make backend-owned automation policy explicit.
4. Make platform connection inside onboarding explicit.
5. Make at-least-one-platform-required activation rule explicit.
6. Upgrade onboarding from a basic form flow to a premium, stepper-based product flow.
7. Remove legally weak language such as `session hijacking`.
8. Rework business projections to include realistic operational costs.
9. Clarify that all connected platforms are automatically used by the system.

## Final Non-Negotiables

- LinkedIn is in the product from day 1.
- LinkedIn runs under guarded limits:
  `25 Easy Apply/day/user` and `5 Full Apply/day/user`.
- User does not manage platform scheduling.
- User connects platforms during onboarding.
- At least one connected platform is required before activation.
- The system automatically uses all connected platforms.
- Onboarding must collect as much useful structured information as possible up front.
- The onboarding experience must be high quality, stepper-based, and conversion-oriented.
- Cost discipline matters, but customer appeal cannot come at the expense of hidden operational collapse.

## Final CPTO Verdict

The consulting direction is broadly correct on architecture, queueing, and HTTP-first platform strategy.

However, prior drafts were not yet aligned enough on the actual AutoApply product vision.

This directive is the final correction:

- LinkedIn is not optional post-launch work.
- User-operated scheduling is not part of the product.
- Onboarding is not a formality; it is a core automation enabler.
- Platform connection is mandatory for activation.
- The product must look polished and premium, not merely functional.

Future proposals, implementation plans, UX flows, technical docs, and delivery plans should be updated to match this directive exactly.
