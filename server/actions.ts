import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as dbModule from "./db";
const db = (dbModule as any).db || (dbModule as any).default;
import { actionSettings, type ActionSetting, type InsertActionSetting } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { STAGE_ACTION_CONFIG } from "../shared/stageActionConfig.js";
const STAGE_ACTIONS = STAGE_ACTION_CONFIG;

// Schema للإجراء
const actionSettingSchema = z.object({
  actionCode: z.string().min(1),
  actionLabel: z.string().min(1),
  actionDescription: z.string().optional(),
  parentStage: z.string().min(1),
  order: z.number().int().min(0),
  route: z.string().optional(),
  requiredRoles: z.array(z.string()).optional(),
  prerequisiteAction: z.string().optional(),
  nextAction: z.string().optional(),
  relationWithNext: z.enum(["before", "after", "concurrent", "independent"]).optional(),
  isActive: z.boolean().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const actionsRouter = router({
  // الحصول على جميع الإجراءات
  getAll: publicProcedure.query(async () => {
    const actions = await db.query.actionSettings.findMany({
      orderBy: (actions: any, { asc }: any) => [asc(actions.parentStage), asc(actions.order)],
    });
    return actions;
  }),

  // الحصول على إجراءات مرحلة معينة
  getByStage: publicProcedure
    .input(z.object({ stageCode: z.string() }))
    .query(async ({ input }: { input: any }) => {
      const actions = await db.query.actionSettings.findMany({
        where: eq(actionSettings.parentStage, input.stageCode),
        orderBy: (actions: any, { asc }: any) => [asc(actions.order)],
      });
      return actions;
    }),

  // الحصول على إجراء واحد
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: { input: any }) => {
      const action = await db.query.actionSettings.findFirst({
        where: eq(actionSettings.id, input.id),
      });
      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الإجراء غير موجود",
        });
      }
      return action;
    }),

  // إنشاء إجراء جديد
  create: protectedProcedure
    .input(actionSettingSchema)
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // التحقق من الصلاحية
      if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "لا توجد صلاحية لإنشاء إجراء",
        });
      }

      const [newAction] = await db.insert(actionSettings).values(input);
      return { success: true, actionId: newAction.insertId };
    }),

  // تحديث إجراء
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: actionSettingSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // التحقق من الصلاحية
      if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "لا توجد صلاحية لتحديث إجراء",
        });
      }

      await db
        .update(actionSettings)
        .set(input.data)
        .where(eq(actionSettings.id, input.id));

      return { success: true };
    }),

  // حذف إجراء
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // التحقق من الصلاحية
      if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "لا توجد صلاحية لحذف إجراء",
        });
      }

      await db.delete(actionSettings).where(eq(actionSettings.id, input.id));
      return { success: true };
    }),

  // تهيئة الإجراءات الافتراضية من stageActionConfig
  initializeDefaults: protectedProcedure.mutation(async ({ ctx }: { ctx: any }) => {
    // التحقق من الصلاحية
    if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "لا توجد صلاحية لتهيئة الإجراءات",
      });
    }

    // التحقق من وجود إجراءات مسبقاً
    const existingActions = await db.query.actionSettings.findMany();
    if (existingActions.length > 0) {
      return {
        success: false,
        message: "الإجراءات موجودة مسبقاً. لا حاجة للتهيئة.",
      };
    }

    // تحويل STAGE_ACTIONS إلى صيغة قاعدة البيانات
    const actionsToInsert: InsertActionSetting[] = [];
    
    Object.entries(STAGE_ACTIONS).forEach(([stageCode, stageConfig]: [string, any]) => {
      stageConfig.actions.forEach((action: any, index: number) => {
        actionsToInsert.push({
          actionCode: action.id,
          actionLabel: action.label,
          actionDescription: action.description,
          parentStage: stageCode,
          order: index + 1,
          route: action.route || null,
          requiredRoles: action.requiredRoles,
          prerequisiteAction: action.prerequisite || null,
          nextAction: action.nextAction || null,
          relationWithNext: "after", // افتراضي
          isActive: true,
          icon: null, // يمكن إضافته لاحقاً
          color: null, // يمكن إضافته لاحقاً
        });
      });
    });

    // إدراج الإجراءات
    if (actionsToInsert.length > 0) {
      await db.insert(actionSettings).values(actionsToInsert);
    }

    return {
      success: true,
      message: `تم تهيئة ${actionsToInsert.length} إجراء بنجاح`,
    };
  }),

  // تحديث ترتيب الإجراءات (Reorder)
  reorder: protectedProcedure
    .input(
      z.object({
        stageCode: z.string(),
        actionIds: z.array(z.number()), // الترتيب الجديد
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // التحقق من الصلاحية
      if (!["super_admin", "system_admin"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "لا توجد صلاحية لإعادة ترتيب الإجراءات",
        });
      }

      // تحديث ترتيب كل إجراء
      for (let i = 0; i < input.actionIds.length; i++) {
        await db
          .update(actionSettings)
          .set({ order: i + 1 })
          .where(
            and(
              eq(actionSettings.id, input.actionIds[i]),
              eq(actionSettings.parentStage, input.stageCode)
            )
          );
      }

      return { success: true };
    }),
});
