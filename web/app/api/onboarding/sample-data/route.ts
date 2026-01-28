import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

// Sample data for realistic job applications
const sampleApplications = [
  {
    company: "Google",
    title: "Senior Software Engineer",
    stage: "INTERVIEW" as const,
    location: "Mountain View, CA",
    url: "https://careers.google.com/jobs/12345",
    source: "LinkedIn",
    salaryMin: 180000,
    salaryMax: 250000,
    tags: ["python", "distributed-systems", "big-tech"],
    daysAgo: 8,
    notes: ["Had initial phone screen with recruiter. Very positive!", "Technical interview scheduled for next week."],
    tasks: [{ title: "Prepare system design examples", dueInDays: 2 }],
    contacts: [{ name: "Sarah Chen", email: "sarah.chen@google.com", role: "Technical Recruiter" }]
  },
  {
    company: "Stripe",
    title: "Full Stack Engineer",
    stage: "APPLIED" as const,
    location: "Remote (US)",
    url: "https://stripe.com/jobs/listing/full-stack",
    source: "Company Website",
    salaryMin: 170000,
    salaryMax: 220000,
    tags: ["typescript", "react", "fintech", "remote"],
    daysAgo: 3,
    tasks: [{ title: "Follow up if no response by Friday", dueInDays: 4 }]
  },
  {
    company: "Shopify",
    title: "Backend Developer",
    stage: "OFFER" as const,
    location: "Remote",
    url: "https://shopify.com/careers/backend",
    source: "Referral",
    salaryMin: 150000,
    salaryMax: 180000,
    tags: ["ruby", "rails", "remote", "ecommerce"],
    daysAgo: 21,
    notes: ["Received offer! $165k base + equity. Need to respond by end of week."],
    contacts: [{ name: "Mike Thompson", email: "mike.t@shopify.com", role: "Engineering Manager" }]
  },
  {
    company: "Microsoft",
    title: "Software Engineer II",
    stage: "INTERVIEW" as const,
    location: "Seattle, WA",
    url: "https://careers.microsoft.com/swe2",
    source: "LinkedIn",
    salaryMin: 145000,
    salaryMax: 195000,
    tags: ["c#", "azure", "big-tech"],
    daysAgo: 14,
    notes: ["Completed coding assessment. Waiting for on-site."],
    tasks: [{ title: "Review Azure fundamentals", dueInDays: 5 }]
  },
  {
    company: "Airbnb",
    title: "Frontend Engineer",
    stage: "REJECTED" as const,
    location: "San Francisco, CA",
    url: "https://careers.airbnb.com/frontend",
    source: "Indeed",
    salaryMin: 160000,
    salaryMax: 210000,
    tags: ["react", "typescript", "travel-tech"],
    daysAgo: 30,
    notes: ["Rejected after final round. Feedback: Need more experience with large-scale React apps."]
  },
  {
    company: "Notion",
    title: "Product Engineer",
    stage: "APPLIED" as const,
    location: "New York, NY",
    url: "https://notion.so/careers/product-engineer",
    source: "AngelList",
    salaryMin: 155000,
    salaryMax: 200000,
    tags: ["typescript", "react", "productivity"],
    daysAgo: 5
  },
  {
    company: "Vercel",
    title: "Developer Experience Engineer",
    stage: "SAVED" as const,
    location: "Remote",
    url: "https://vercel.com/careers/dx-engineer",
    source: "Twitter",
    salaryMin: 140000,
    salaryMax: 180000,
    tags: ["nextjs", "react", "devtools", "remote"],
    daysAgo: 0
  },
  {
    company: "Datadog",
    title: "Site Reliability Engineer",
    stage: "INTERVIEW" as const,
    location: "Boston, MA",
    url: "https://datadog.com/careers/sre",
    source: "Glassdoor",
    salaryMin: 165000,
    salaryMax: 215000,
    tags: ["kubernetes", "python", "observability"],
    daysAgo: 10,
    notes: ["First round complete. Moving to technical deep-dive."],
    tasks: [{ title: "Study K8s networking concepts", dueInDays: 3 }],
    contacts: [{ name: "Lisa Park", email: "lisa.park@datadog.com", role: "Recruiter" }]
  },
  {
    company: "Plaid",
    title: "API Platform Engineer",
    stage: "APPLIED" as const,
    location: "San Francisco, CA",
    url: "https://plaid.com/careers/api-platform",
    source: "LinkedIn",
    salaryMin: 175000,
    salaryMax: 225000,
    tags: ["golang", "api-design", "fintech"],
    daysAgo: 7
  },
  {
    company: "Figma",
    title: "Software Engineer, Collaboration",
    stage: "SAVED" as const,
    location: "San Francisco, CA",
    url: "https://figma.com/careers/collab-eng",
    source: "Company Website",
    salaryMin: 170000,
    salaryMax: 230000,
    tags: ["typescript", "webrtc", "design-tools"],
    daysAgo: 1
  },
  {
    company: "Coinbase",
    title: "Blockchain Engineer",
    stage: "REJECTED" as const,
    location: "Remote",
    url: "https://coinbase.com/careers/blockchain",
    source: "LinkedIn",
    salaryMin: 180000,
    salaryMax: 260000,
    tags: ["solidity", "web3", "crypto", "remote"],
    daysAgo: 45,
    notes: ["Did not pass technical screen. Need to study smart contract patterns more."]
  },
  {
    company: "Twilio",
    title: "Senior Developer Advocate",
    stage: "APPLIED" as const,
    location: "Remote",
    url: "https://twilio.com/careers/dev-advocate",
    source: "Twitter",
    salaryMin: 140000,
    salaryMax: 175000,
    tags: ["devrel", "public-speaking", "api", "remote"],
    daysAgo: 2,
    attachments: [{ label: "Portfolio Website", url: "https://myportfolio.dev" }]
  },
  {
    company: "Slack",
    title: "Platform Engineer",
    stage: "INTERVIEW" as const,
    location: "Denver, CO",
    url: "https://slack.com/careers/platform",
    source: "Referral",
    salaryMin: 155000,
    salaryMax: 200000,
    tags: ["java", "microservices", "messaging"],
    daysAgo: 18,
    notes: ["Referral from college friend working there. Had great culture chat."],
    contacts: [{ name: "Jordan Smith", email: "jordan@slack.com", role: "Senior Engineer (Referrer)" }]
  },
  {
    company: "Linear",
    title: "Founding Engineer",
    stage: "SAVED" as const,
    location: "Remote",
    url: "https://linear.app/careers",
    source: "Hacker News",
    salaryMin: 160000,
    salaryMax: 200000,
    tags: ["typescript", "react", "startup", "remote"],
    daysAgo: 0
  },
  {
    company: "Netflix",
    title: "Senior UI Engineer",
    stage: "APPLIED" as const,
    location: "Los Gatos, CA",
    url: "https://jobs.netflix.com/ui-engineer",
    source: "LinkedIn",
    salaryMin: 200000,
    salaryMax: 300000,
    tags: ["react", "performance", "streaming", "big-tech"],
    daysAgo: 4
  },
  {
    company: "Supabase",
    title: "Database Engineer",
    stage: "INTERVIEW" as const,
    location: "Remote",
    url: "https://supabase.com/careers/db-engineer",
    source: "GitHub",
    salaryMin: 150000,
    salaryMax: 190000,
    tags: ["postgresql", "typescript", "open-source", "remote"],
    daysAgo: 12,
    notes: ["Open source contributions helped. They liked my PR to the repo."],
    tasks: [{ title: "Prepare Postgres internals presentation", dueInDays: 1 }]
  },
  {
    company: "Epic Games",
    title: "Game Engine Developer",
    stage: "SAVED" as const,
    location: "Cary, NC",
    url: "https://epicgames.com/careers/engine-dev",
    source: "Company Website",
    salaryMin: 130000,
    salaryMax: 180000,
    tags: ["c++", "unreal", "gaming", "graphics"],
    daysAgo: 2
  }
];

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const existing = await prisma.jobApplication.count({ where: { userId, deletedAt: null } });
  if (existing > 0) {
    return jsonError(400, "BAD_REQUEST", "Sample data can only be added to an empty workspace.");
  }

  const now = new Date();

  const apps = await prisma.$transaction(async (tx) => {
    const createdApps = [];

    for (const sample of sampleApplications) {
      const app = await tx.jobApplication.create({
        data: {
          userId,
          company: sample.company,
          title: sample.title,
          stage: sample.stage,
          location: sample.location,
          url: sample.url,
          source: sample.source,
          salaryMin: sample.salaryMin,
          salaryMax: sample.salaryMax,
          appliedDate: sample.stage !== "SAVED" ? new Date(now.getTime() - sample.daysAgo * 24 * 3600 * 1000) : null,
          tags: sample.tags
        }
      });

      // Add notes
      if (sample.notes) {
        for (const noteContent of sample.notes) {
          await tx.note.create({
            data: { userId, applicationId: app.id, content: noteContent }
          });
        }
      }

      // Add tasks
      if (sample.tasks) {
        for (const task of sample.tasks) {
          await tx.task.create({
            data: {
              userId,
              applicationId: app.id,
              title: task.title,
              status: "OPEN",
              dueDate: new Date(now.getTime() + task.dueInDays * 24 * 3600 * 1000)
            }
          });
        }
      }

      // Add contacts
      if (sample.contacts) {
        for (const contact of sample.contacts) {
          await tx.contact.create({
            data: {
              userId,
              applicationId: app.id,
              name: contact.name,
              email: contact.email,
              role: contact.role,
              company: sample.company
            }
          });
        }
      }

      // Add attachments
      if (sample.attachments) {
        for (const attachment of sample.attachments) {
          await tx.attachmentLink.create({
            data: {
              userId,
              applicationId: app.id,
              label: attachment.label,
              url: attachment.url
            }
          });
        }
      }

      createdApps.push(app);
    }

    return createdApps;
  });

  await audit(req, userId, AuditAction.APPLICATION_CREATED, { meta: { via: "sample_data_seed", created: apps.length } });

  return NextResponse.json({ ok: true, created: apps.length });
}
