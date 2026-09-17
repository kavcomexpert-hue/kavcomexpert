import { config } from "dotenv";

config({ path: ".env.local" });

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env.local",
    );
    process.exit(1);
  }

  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db/index");
  const schema = await import("../src/lib/db/schema");
  const { betterAuth } = await import("better-auth");
  const { drizzleAdapter } = await import("better-auth/adapters/drizzle");

  const existing = await db
    .select({ id: schema.user.id, role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].role !== "admin") {
      await db
        .update(schema.user)
        .set({ role: "admin" })
        .where(eq(schema.user.id, existing[0].id));
      console.log(`Admin role ensured for ${email}.`);
    } else {
      console.log(`Admin user already exists for ${email}.`);
    }
    return;
  }

  const seedAuth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "author",
          required: false,
          input: false,
        },
      },
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL,
  });

  const result = await seedAuth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Admin",
    },
  });

  const userId = result.user?.id;
  if (!userId) {
    throw new Error("Sign-up succeeded but no user id was returned");
  }

  await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.id, userId));

  console.log(`Admin user created for ${email} with role=admin.`);
}

seedAdmin()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
