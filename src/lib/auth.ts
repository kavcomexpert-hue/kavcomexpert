import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { logAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    // Avoid a DB round-trip on every getSession / middleware check.
    // Cache lives in an httpOnly cookie; expired cache falls back to DB.
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
      strategy: "compact",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "author",
        required: false,
        input: false,
      },
      suspended: {
        type: "boolean",
        defaultValue: false,
        required: false,
        input: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  advanced: {
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip",
        "x-forwarded-for",
        "x-real-ip",
      ],
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [row] = await db
            .select({ suspended: schema.user.suspended })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
            .limit(1);

          if (row?.suspended) {
            return false;
          }
        },
        after: async (session) => {
          await logAudit({
            userId: session.userId,
            action: "login_success",
            entityType: "session",
            entityId: session.id,
            ip: session.ipAddress ?? null,
          });
        },
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: "Kavcom Expert",
      backupCodeOptions: {
        amount: 10,
        length: 10,
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
