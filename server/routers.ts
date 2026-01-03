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
import { suppliersRouter } from "./routers/suppliers";
import { contractsRouter } from "./routers/contracts";
import { categoriesRouter } from "./routers/categories";

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
  
  // إدارة الموردين
  suppliers: suppliersRouter,
  
  // إدارة العقود
  contracts: contractsRouter,
  
  // إدارة التصنيفات
  categories: categoriesRouter,
});

export type AppRouter = typeof appRouter;
