import { PrismaClient, ApplicationStage, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash
    }
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create sample applications
  const applications = [
    {
      company: "Acme Corp",
      title: "Senior Frontend Developer",
      location: "Remote",
      url: "https://acme.example.com/careers/123",
      stage: ApplicationStage.APPLIED,
      appliedDate: new Date("2026-01-15"),
      source: "LinkedIn",
      tags: ["react", "typescript", "remote"]
    },
    {
      company: "TechStart Inc",
      title: "Full Stack Engineer",
      location: "San Francisco, CA",
      url: "https://techstart.example.com/jobs/456",
      stage: ApplicationStage.INTERVIEW,
      appliedDate: new Date("2026-01-10"),
      source: "Company Website",
      tags: ["node", "react", "postgresql"],
      salaryMin: 120000,
      salaryMax: 160000
    },
    {
      company: "BigCo",
      title: "Software Engineer II",
      location: "New York, NY",
      stage: ApplicationStage.SAVED,
      source: "Referral",
      tags: ["python", "aws"]
    },
    {
      company: "StartupXYZ",
      title: "Backend Developer",
      location: "Austin, TX",
      url: "https://startupxyz.example.com/careers",
      stage: ApplicationStage.OFFER,
      appliedDate: new Date("2026-01-05"),
      source: "Indeed",
      tags: ["go", "kubernetes"],
      salaryMin: 140000,
      salaryMax: 180000
    },
    {
      company: "MegaTech",
      title: "Junior Developer",
      location: "Seattle, WA",
      stage: ApplicationStage.REJECTED,
      appliedDate: new Date("2025-12-20"),
      source: "LinkedIn",
      tags: ["java", "spring"]
    }
  ];

  for (const appData of applications) {
    const app = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        ...appData
      }
    });
    console.log(`✅ Created application: ${app.company} - ${app.title}`);

    // Add a sample note to each application
    await prisma.note.create({
      data: {
        userId: user.id,
        applicationId: app.id,
        content: `Initial research notes for ${app.company}. Company looks promising.`
      }
    });

    // Add sample tasks for some applications
    if (app.stage === ApplicationStage.INTERVIEW) {
      await prisma.task.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          title: "Prepare for technical interview",
          dueDate: new Date("2026-01-30"),
          status: TaskStatus.OPEN
        }
      });
      await prisma.task.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          title: "Research company culture",
          status: TaskStatus.DONE
        }
      });
    }

    if (app.stage === ApplicationStage.APPLIED) {
      await prisma.task.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          title: "Follow up if no response in 1 week",
          dueDate: new Date("2026-01-22"),
          status: TaskStatus.OPEN
        }
      });
    }
  }

  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
