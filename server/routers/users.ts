import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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

  // Update user basic info (including role and status)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum([
          "super_admin",
          "system_admin",
          "projects_office",
          "field_team",
          "quick_response",
          "financial",
          "project_manager",
          "corporate_comm",
          "service_requester",
        ]).optional(),
        status: z.enum(["active", "pending", "suspended", "blocked"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(["super_admin", "system_admin"] as string[]).includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتعديل المستخدمين" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { id, ...updateData } = input;
      await db.update(users).set(updateData as any).where(eq(users.id, id));
      return { success: true };
    }),

  // Update user role
  updateRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum([
          "super_admin",
          "system_admin",
          "projects_office",
          "field_team",
          "quick_response",
          "financial",
          "project_manager",
          "corporate_comm",
          "service_requester",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(["super_admin", "system_admin"] as string[]).includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتغيير الأدوار" });
      }
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Delete user
  delete: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db.delete(users).where(eq(users.id, input.userId));
      return { success: true };
    }),
  
  // Get staff users (employees only, excluding service requesters)
  getStaffUsers: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const staffUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.status, "active"));
    
    return staffUsers.filter(user => user.role !== "service_requester");
  }),
});
