import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Badges ────────────────────────────────────────────────────────────────
  const badges = [
    { slug: "early_adopter", name: "Early Adopter", description: "Joined SplitSmart in the first wave", icon: "🚀", color: "#0ea5e9", rarity: "RARE" as const, criteria: { type: "signup_before", date: "2025-12-31" } },
    { slug: "first_split", name: "First Split", description: "Added your first expense", icon: "✂️", color: "#10b981", rarity: "COMMON" as const, criteria: { type: "expense_count", min: 1 } },
    { slug: "streak_7", name: "Week Streak", description: "Paid on time 7 days in a row", icon: "🔥", color: "#f59e0b", rarity: "COMMON" as const, criteria: { type: "payment_streak", days: 7 } },
    { slug: "streak_30", name: "Month Streak", description: "30-day payment streak", icon: "⚡", color: "#8b5cf6", rarity: "RARE" as const, criteria: { type: "payment_streak", days: 30 } },
    { slug: "streak_100", name: "Century Streak", description: "100-day payment streak", icon: "💎", color: "#ec4899", rarity: "LEGENDARY" as const, criteria: { type: "payment_streak", days: 100 } },
    { slug: "debt_free", name: "Debt Free", description: "Settled all outstanding balances", icon: "🏆", color: "#10b981", rarity: "EPIC" as const, criteria: { type: "balance_zero" } },
    { slug: "group_creator", name: "Community Builder", description: "Created 5 or more groups", icon: "👥", color: "#0ea5e9", rarity: "RARE" as const, criteria: { type: "group_count", min: 5 } },
    { slug: "big_spender", name: "Big Spender", description: "Tracked over ₹1,00,000 in expenses", icon: "💰", color: "#f59e0b", rarity: "EPIC" as const, criteria: { type: "total_tracked", min: 100000 } },
  ];

  for (const badge of badges) {
    await db.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    });
  }
  console.log(`  ✓ ${badges.length} badges`);

  // ── Demo admin user ───────────────────────────────────────────────────────
  const adminEmail = "admin@splitsmart.app";
  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash("Admin@123", 12);
    const admin = await db.user.create({
      data: {
        name: "SplitSmart Admin",
        email: adminEmail,
        passwordHash: hash,
        role: "SUPER_ADMIN",
        plan: "TEAM",
        planStatus: "ACTIVE",
        currency: "INR",
        emailVerified: new Date(),
      },
    });
    console.log(`  ✓ Admin user: ${admin.email}`);
  } else {
    console.log(`  – Admin user already exists`);
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
