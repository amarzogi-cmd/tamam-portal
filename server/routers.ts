import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { mosquesRouter } from "./routers/mosques";
import { requestsRouter } from "./routers/requests";
import { notificationsRouter } from "./routers/notifications";
import { storageRouter } from "./routers/storage";
import { projectsRouter } from "./routers/projects";

export const appRouter = router({
  system: systemRouter,
  
  // نظام المصادقة
  auth: authRouter,
  
  // إدارة المساجد
  mosques: mosquesRouter,
  
  // إدارة الطلبات
  requests: requestsRouter,
  
  // نظام الإشعارات
  notifications: notificationsRouter,
  
  // نظام التخزين والمرفقات
  storage: storageRouter,
  
  // إدارة المشاريع
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
