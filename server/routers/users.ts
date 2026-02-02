import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const usersRouter = router({
  // Get all users
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    return db.select().from(users).orderBy(users.createdAt);
  }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      return user;
    }),

  // Toggle user status
  toggleStatus: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["active", "pending", "suspended", "blocked"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(users)
        .set({ status: input.status })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Update user
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { id, ...updateData } = input;
      await db.update(users).set(updateData as any).where(eq(users.id, id));
      return { success: true };
    }),
});
