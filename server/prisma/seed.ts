import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Demo Recruiter
  const demoEmail = 'recruiter@demo.interviewshield.dev';
  const passwordHash = await bcrypt.hash('demo123', 10);

  const recruiter = await prisma.recruiter.upsert({
    where: { email: demoEmail },
    update: {
      name: 'Demo Recruiter',
      passwordHash,
    },
    create: {
      email: demoEmail,
      name: 'Demo Recruiter',
      passwordHash,
    },
  });

  console.log(`Demo recruiter created/updated: ${recruiter.email} (${recruiter.id})`);

  // 2. Sample Demo Interview
  const existingInterview = await prisma.interview.findFirst({
    where: { recruiterId: recruiter.id, title: '[Demo] Full Stack Screening' },
  });

  if (!existingInterview) {
    const joinToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const interview = await prisma.interview.create({
      data: {
        recruiterId: recruiter.id,
        title: '[Demo] Full Stack Screening',
        candidateName: 'Jordan Taylor (Demo)',
        candidateEmail: 'jordan.taylor@example.com',
        joinToken,
        tokenExpiresAt,
        status: 'pending',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    console.log(`Demo interview created: ${interview.title} with token: ${interview.joinToken}`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
