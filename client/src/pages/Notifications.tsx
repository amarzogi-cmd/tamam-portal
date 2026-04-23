import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, FileText, Building2, User, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const notificationIcons: Record<string, any> = {
  request_update: FileText,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  system: Bell,
  mosque: Building2,
  user: User,
};

const notificationColors: Record<string, string> = {
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  info: "text-blue-500",
  request_update: "text-primary",
  system: "text-muted-foreground",
};

function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return past.toLocaleDateString("ar-SA");
}

export default function Notifications() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notifications.getMyNotifications.useQuery({
    page: 1,
    limit: 50,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getMyNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getMyNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحميل الإشعارات...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type || "info"] || Bell;
                  const iconColor = notificationColors[notification.type || "info"] || "text-muted-foreground";
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.isRead ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsReadMutation.mutate({ id: notification.id });
                        }
                        if (notification.relatedType === "request" && notification.relatedId) {
                          window.location.href = `/requests/${notification.relatedId}`;
                        }
                      }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${!notification.isRead ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${!notification.isRead ? iconColor : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium text-sm ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <Badge variant="default" className="text-xs px-1.5 py-0.5 h-auto">
                                جديد
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium mb-1">لا توجد إشعارات</p>
                <p className="text-muted-foreground text-sm">ستظهر هنا جميع الإشعارات والتنبيهات المتعلقة بطلباتك ومساجدك</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
