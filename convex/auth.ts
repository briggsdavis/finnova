import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"

const admins = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim()),
)

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params) => {
        const email = String(params.email).trim().toLowerCase()
        if (!admins.has(email)) throw new ConvexError("Not allowed")
        return { email }
      },
    }),
  ],
})
