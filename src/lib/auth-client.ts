import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  twoFactorClient,
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  // Shared nanostore session atom: one /get-session per mounted client lifetime.
  // Do not refetch on every tab focus / route change.
  sessionOptions: {
    refetchOnWindowFocus: false,
    refetchInterval: 0,
  },
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({
      onTwoFactorRedirect() {
        // Handled in the login form UI (step state).
      },
    }),
  ],
});
