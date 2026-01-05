import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  Bell,
  MapPin,
  ClipboardList,
  BarChart3,
  Wallet,
  Handshake,
  Palette,
  UserCog,
  ChevronDown,
  Calculator,
  Truck,
  Receipt,
  CheckSquare,
  Banknote,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { ROLE_LABELS } from "@shared/constants";

// عناصر القائمة حسب الدور
const getMenuItems = (role: string) => {
  const items = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/dashboard" },
  ];

  // للمدراء
  if (["super_admin", "system_admin"].includes(role)) {
    items.push(
      { icon: Users, label: "إدارة المستخدمين", path: "/users" },
      { icon: UserCog, label: "الأدوار والصلاحيات", path: "/roles" },
    );
  }

  // للمدراء ومكتب المشاريع
  if (["super_admin", "system_admin", "projects_office"].includes(role)) {
    items.push(
      { icon: Building2, label: "المساجد", path: "/mosques" },
      { icon: MapPin, label: "خريطة المساجد", path: "/mosques/map" },
      { icon: FileText, label: "الطلبات", path: "/requests" },
      { icon: ClipboardList, label: "المشاريع", path: "/projects" },
      { icon: Calculator, label: "جداول الكميات", path: "/boq" },
      { icon: Truck, label: "الموردين", path: "/suppliers" },
      { icon: Settings, label: "إدارة التصنيفات", path: "/categories" },
      { icon: Receipt, label: "عروض الأسعار", path: "/quotations" },
      { icon: CheckSquare, label: "الاعتماد المالي", path: "/financial-approval" },
      { icon: FileText, label: "العقود", path: "/contracts" },
      { icon: Banknote, label: "طلبات الصرف", path: "/disbursements" },
    );
  }

  // للفريق الميداني
  if (role === "field_team") {
    items.push(
      { icon: MapPin, label: "الزيارات الميدانية", path: "/field-visits" },
      { icon: FileText, label: "طلباتي", path: "/my-requests" },
    );
  }

  // لفريق الاستجابة السريعة
  if (role === "quick_response") {
    items.push(
      { icon: FileText, label: "الطلبات العاجلة", path: "/urgent-requests" },
      { icon: ClipboardList, label: "تقاريري", path: "/my-reports" },
    );
  }

  // للإدارة المالية
  if (role === "financial") {
    items.push(
      { icon: Calculator, label: "جداول الكميات", path: "/boq" },
      { icon: Truck, label: "الموردين", path: "/suppliers" },
      { icon: Settings, label: "إدارة التصنيفات", path: "/categories" },
      { icon: Receipt, label: "عروض الأسعار", path: "/quotations" },
      { icon: CheckSquare, label: "الاعتماد المالي", path: "/financial-approval" },
      { icon: Wallet, label: "الدفعات", path: "/payments" },
      { icon: BarChart3, label: "التقارير المالية", path: "/financial-reports" },
      { icon: Banknote, label: "طلبات الصرف", path: "/disbursements" },
    );
  }

  // لمدير المشروع
  if (role === "project_manager") {
    items.push(
      { icon: ClipboardList, label: "مشاريعي", path: "/my-projects" },
      { icon: FileText, label: "التقارير", path: "/reports" },
    );
  }

  // للاتصال المؤسسي
  if (role === "corporate_comm") {
    items.push(
      { icon: Handshake, label: "الشركاء", path: "/partners" },
      { icon: Palette, label: "الهوية البصرية", path: "/branding" },
      { icon: BarChart3, label: "التقارير", path: "/reports" },
    );
  }

  // للمدراء فقط
  if (["super_admin", "system_admin"].includes(role)) {
    items.push(
      { icon: Handshake, label: "الشركاء", path: "/partners" },
      { icon: Palette, label: "الهوية البصرية", path: "/branding" },
      { icon: Building2, label: "إعدادات الجمعية", path: "/organization-settings" },
      { icon: Settings, label: "الإعدادات", path: "/settings" },
    );
  }

  return items;
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              يرجى تسجيل الدخول للمتابعة
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              الوصول إلى لوحة التحكم يتطلب تسجيل الدخول
            </p>
          </div>
          <Link href="/login">
            <Button
              size="lg"
              className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all"
            >
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuItems = getMenuItems(user?.role || "");
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? 0;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-l-0 border-r"
          side="right"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div>
                    <span className="font-bold text-foreground block leading-tight">
                      بوابة تمام
                    </span>
                    <span className="text-xs text-muted-foreground">
                      للعناية بالمساجد
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {ROLE_LABELS[user?.role || ""] || user?.role}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                  <UserCog className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/notifications")} className="cursor-pointer">
                  <Bell className="ml-2 h-4 w-4" />
                  <span>الإشعارات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-foreground">
                  {activeMenuItem?.label || "بوابة تمام"}
                </span>
              </div>
            </div>
          </div>
        )}
        <main className="p-4 md:p-6 lg:p-8 bg-muted/30 min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
