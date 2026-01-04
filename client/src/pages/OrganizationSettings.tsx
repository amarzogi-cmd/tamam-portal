import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Save,
  Loader2,
  FileText,
  Settings,
} from "lucide-react";

export default function OrganizationSettings() {
  const { user } = useAuth();
  
  // بيانات الجمعية
  const [orgSettings, setOrgSettings] = useState({
    // معلومات الجمعية الأساسية
    name: "جمعية تمام للعناية بالمساجد",
    licenseNumber: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    
    // معلومات مفوض التوقيع
    authorizedSignatory: "",
    signatoryTitle: "",
    signatoryPhone: "",
    signatoryEmail: "",
    
    // معلومات البنك
    bankName: "",
    bankAccountName: "",
    iban: "",
    
    // إعدادات العقود
    contractPrefix: "CON",
    contractFooterText: "",
    contractTermsAndConditions: "",
  });

  // جلب إعدادات الجمعية
  const { data: settings, isLoading, refetch } = trpc.organization.getSettings.useQuery();

  // تحديث الإعدادات
  const updateMutation = trpc.organization.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  // تحميل الإعدادات عند الجلب
  useEffect(() => {
    if (settings) {
      setOrgSettings({
        name: settings.organizationName || "جمعية تمام للعناية بالمساجد",
        licenseNumber: settings.licenseNumber || "",
        address: settings.address || "",
        city: settings.city || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        authorizedSignatory: settings.authorizedSignatory || "",
        signatoryTitle: settings.signatoryTitle || "",
        signatoryPhone: settings.signatoryPhone || "",
        signatoryEmail: settings.signatoryEmail || "",
        bankName: settings.bankName || "",
        bankAccountName: settings.bankAccountName || "",
        iban: settings.iban || "",
        contractPrefix: settings.contractPrefix || "CON",
        contractFooterText: settings.contractFooterText || "",
        contractTermsAndConditions: settings.contractTermsAndConditions || "",
      });
    }
  }, [settings]);

  // حفظ الإعدادات
  const handleSave = () => {
    updateMutation.mutate({
      organizationName: orgSettings.name,
      licenseNumber: orgSettings.licenseNumber || undefined,
      address: orgSettings.address || undefined,
      city: orgSettings.city || undefined,
      phone: orgSettings.phone || undefined,
      email: orgSettings.email || undefined,
      website: orgSettings.website || undefined,
      authorizedSignatory: orgSettings.authorizedSignatory || undefined,
      signatoryTitle: orgSettings.signatoryTitle || undefined,
      signatoryPhone: orgSettings.signatoryPhone || undefined,
      signatoryEmail: orgSettings.signatoryEmail || undefined,
      bankName: orgSettings.bankName || undefined,
      bankAccountName: orgSettings.bankAccountName || undefined,
      iban: orgSettings.iban || undefined,
      contractPrefix: orgSettings.contractPrefix || undefined,
      contractFooterText: orgSettings.contractFooterText || undefined,
      contractTermsAndConditions: orgSettings.contractTermsAndConditions || undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إعدادات الجمعية</h1>
            <p className="text-muted-foreground">
              إدارة بيانات الجمعية الثابتة المستخدمة في العقود والمستندات الرسمية
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            حفظ الإعدادات
          </Button>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
            <TabsTrigger value="signatory">مفوض التوقيع</TabsTrigger>
            <TabsTrigger value="bank">البيانات البنكية</TabsTrigger>
            <TabsTrigger value="contracts">إعدادات العقود</TabsTrigger>
          </TabsList>

          {/* معلومات الجمعية الأساسية */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  معلومات الجمعية الأساسية
                </CardTitle>
                <CardDescription>
                  البيانات الأساسية للجمعية التي تظهر في العقود والمستندات الرسمية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الجمعية</Label>
                    <Input
                      id="name"
                      value={orgSettings.name}
                      onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                      placeholder="اسم الجمعية الرسمي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">رقم الترخيص</Label>
                    <Input
                      id="licenseNumber"
                      value={orgSettings.licenseNumber}
                      onChange={(e) => setOrgSettings({ ...orgSettings, licenseNumber: e.target.value })}
                      placeholder="رقم ترخيص الجمعية"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Textarea
                    id="address"
                    value={orgSettings.address}
                    onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                    placeholder="العنوان التفصيلي للجمعية"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={orgSettings.city}
                      onChange={(e) => setOrgSettings({ ...orgSettings, city: e.target.value })}
                      placeholder="المدينة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={orgSettings.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                      placeholder="رقم الهاتف"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orgSettings.email}
                      onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                      placeholder="البريد الإلكتروني"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    value={orgSettings.website}
                    onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                    placeholder="https://www.example.com"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* معلومات مفوض التوقيع */}
          <TabsContent value="signatory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات مفوض التوقيع
                </CardTitle>
                <CardDescription>
                  بيانات الشخص المفوض بالتوقيع على العقود نيابة عن الجمعية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authorizedSignatory">اسم مفوض التوقيع</Label>
                    <Input
                      id="authorizedSignatory"
                      value={orgSettings.authorizedSignatory}
                      onChange={(e) => setOrgSettings({ ...orgSettings, authorizedSignatory: e.target.value })}
                      placeholder="الاسم الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signatoryTitle">صفة مفوض التوقيع</Label>
                    <Input
                      id="signatoryTitle"
                      value={orgSettings.signatoryTitle}
                      onChange={(e) => setOrgSettings({ ...orgSettings, signatoryTitle: e.target.value })}
                      placeholder="مثال: رئيس مجلس الإدارة"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signatoryPhone">رقم جوال مفوض التوقيع</Label>
                    <Input
                      id="signatoryPhone"
                      value={orgSettings.signatoryPhone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, signatoryPhone: e.target.value })}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signatoryEmail">البريد الإلكتروني لمفوض التوقيع</Label>
                    <Input
                      id="signatoryEmail"
                      type="email"
                      value={orgSettings.signatoryEmail}
                      onChange={(e) => setOrgSettings({ ...orgSettings, signatoryEmail: e.target.value })}
                      placeholder="البريد الإلكتروني"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>ملاحظة:</strong> هذه البيانات ستظهر في جميع العقود كـ "الطرف الأول" وستُستخدم في التوقيع الإلكتروني
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* البيانات البنكية */}
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  البيانات البنكية
                </CardTitle>
                <CardDescription>
                  معلومات الحساب البنكي للجمعية المستخدمة في العقود والتحويلات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">اسم البنك</Label>
                    <Input
                      id="bankName"
                      value={orgSettings.bankName}
                      onChange={(e) => setOrgSettings({ ...orgSettings, bankName: e.target.value })}
                      placeholder="اسم البنك"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">اسم الحساب</Label>
                    <Input
                      id="bankAccountName"
                      value={orgSettings.bankAccountName}
                      onChange={(e) => setOrgSettings({ ...orgSettings, bankAccountName: e.target.value })}
                      placeholder="اسم صاحب الحساب"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
                  <Input
                    id="iban"
                    value={orgSettings.iban}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      if (!value.startsWith("SA")) {
                        value = "SA" + value.replace(/^SA/i, "");
                      }
                      if (value.length > 24) value = value.slice(0, 24);
                      setOrgSettings({ ...orgSettings, iban: value });
                    }}
                    placeholder="SA0000000000000000000000"
                    dir="ltr"
                    maxLength={24}
                  />
                  <p className="text-xs text-muted-foreground">يجب أن يبدأ بـ SA متبوعاً بـ 22 رقم</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* إعدادات العقود */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  إعدادات العقود
                </CardTitle>
                <CardDescription>
                  تخصيص إعدادات العقود والنصوص الافتراضية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contractPrefix">بادئة رقم العقد</Label>
                  <Input
                    id="contractPrefix"
                    value={orgSettings.contractPrefix}
                    onChange={(e) => setOrgSettings({ ...orgSettings, contractPrefix: e.target.value })}
                    placeholder="CON"
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيكون رقم العقد بالشكل: {orgSettings.contractPrefix}-2024-0001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractFooterText">نص تذييل العقد</Label>
                  <Textarea
                    id="contractFooterText"
                    value={orgSettings.contractFooterText}
                    onChange={(e) => setOrgSettings({ ...orgSettings, contractFooterText: e.target.value })}
                    placeholder="النص الذي يظهر في نهاية كل عقد..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractTermsAndConditions">الشروط والأحكام الافتراضية</Label>
                  <Textarea
                    id="contractTermsAndConditions"
                    value={orgSettings.contractTermsAndConditions}
                    onChange={(e) => setOrgSettings({ ...orgSettings, contractTermsAndConditions: e.target.value })}
                    placeholder="الشروط والأحكام الافتراضية للعقود..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
