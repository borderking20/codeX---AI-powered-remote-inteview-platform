import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const { userId: clerkId, sessionClaims } = req.auth();

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      let user = await User.findOne({ clerkId });

      // If user doesn't exist, or has a placeholder email, fetch real data from Clerk API
      if (!user || user.email.endsWith("@clerk.local")) {
        // Fetch real user info from Clerk API to guarantee we get the correct email
        const clerkUser = await clerkClient.users.getUser(clerkId);
        
        const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@clerk.local`;
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "New User";
        const profileImage = clerkUser.imageUrl || "";

        if (!user) {
          user = await User.create({
            clerkId,
            email,
            name,
            profileImage,
          });
        } else {
          // Update stale placeholder email
          user.email = email;
          user.name = name;
          user.profileImage = profileImage;
          await user.save();
        }

        // Best effort: ensure Stream user exists too.
        await upsertStreamUser({
          id: clerkId,
          name: user.name,
          image: user.profileImage,
        });
      }

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
