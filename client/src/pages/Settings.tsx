import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Palette, Bell, Shield, Database } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة إعدادات النظام والتخصيصات</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              عام
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              الهوية البصرية
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الأمان
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>الإعدادات العامة</CardTitle>
                <CardDescription>تخصيص الإعدادات الأساسية للنظام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المنظمة</Label>
                  <Input defaultValue="بوابة تمام للعناية بالمساجد" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني للتواصل</Label>
                  <Input type="email" defaultValue="info@tamam.sa" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input defaultValue="920000000" />
                </div>
                <Button onClick={() => toast.success("تم حفظ الإعدادات")}>
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>الهوية البصرية</CardTitle>
                <CardDescription>تخصيص الألوان والشعارات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اللون الأساسي</Label>
                    <Input type="color" defaultValue="#0D9488" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>اللون الثانوي</Label>
                    <Input type="color" defaultValue="#6366F1" className="h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الشعار الرئيسي</Label>
                  <Input type="file" accept="image/*" />
                </div>
                <Button onClick={() => toast.success("تم حفظ الهوية البصرية")}>
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>إعدادات الإشعارات</CardTitle>
                <CardDescription>تخصيص طريقة استلام الإشعارات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">إعدادات الإشعارات قيد التطوير</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>إعدادات الأمان</CardTitle>
                <CardDescription>إدارة إعدادات الأمان والخصوصية</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">إعدادات الأمان قيد التطوير</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
