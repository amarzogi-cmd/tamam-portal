import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, MapPin, Save, User, AlertCircle, Send } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LocationPicker } from "@/components/LocationPicker";
import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const mosqueTypes = [
  { value: "jami", label: "جامع" },
  { value: "masjid", label: "مسجد" },
  { value: "musalla", label: "مصلى" },
];

const mosqueStatuses = [
  { value: "new", label: "جديد (مقترح)" },
  { value: "existing", label: "قائم" },
  { value: "under_construction", label: "تحت الإنشاء" },
];

const ownershipTypes = [
  { value: "government", label: "حكومي" },
  { value: "waqf", label: "وقف" },
  { value: "private", label: "أهلي" },
];

// ترجمة صفة طالب الخدمة
const getRequesterTypeLabel = (type: string | null | undefined) => {
  const types: Record<string, string> = {
    imam: "إمام المسجد",
    muezzin: "مؤذن المسجد",
    board_member: "عضو مجلس إدارة",
    committee_member: "عضو لجنة",
    volunteer: "متطوع",
    donor: "متبرع",
  };
  return types[type || ""] || type || "غير محدد";
};

export default function MosqueForm() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    mosqueType: "",
    mosqueStatus: "",
    ownershipType: "",
    city: "",
    district: "",
    area: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
    description: "",
  });

  // التحقق من وجود طلب مسجد سابق
  const { data: existingMosques, isLoading: checkingMosques } = trpc.mosques.getMyMosques.useQuery(
    undefined,
    { enabled: !!user?.id && user?.role === "service_requester" }
  );

  const hasExistingMosque = existingMosques && existingMosques.length > 0;

  const createMutation = trpc.mosques.create.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال طلب تسجيل المسجد بنجاح. سيتم مراجعته من قبل الإدارة.");
      navigate("/requester/mosques");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (location: { lat: number; lng: number; address?: string }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
      address: location.address || prev.address,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.mosqueType) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    // التحقق من عدم وجود طلب سابق
    if (hasExistingMosque) {
      toast.error("لا يمكنك تقديم أكثر من طلب تسجيل مسجد واحد. يرجى التواصل مع الإدارة للحصول على استثناء.");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      status: (formData.mosqueStatus as any) || "existing",
      ownership: (formData.ownershipType as any) || "government",
      city: formData.city,
      district: formData.district || undefined,
      area: formData.area ? parseInt(formData.area) : undefined,
      address: formData.address || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      // بيانات مقدم الطلب تُضاف تلقائياً من الخادم
    });
  };

  // إذا كان لديه طلب سابق، عرض رسالة تنبيه
  if (hasExistingMosque && user?.role === "service_requester") {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/requester/mosques">
              <Button variant="ghost" size="icon">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">إضافة مسجد جديد</h1>
              <p className="text-muted-foreground">أدخل بيانات المسجد المراد إضافته</p>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>لا يمكن تقديم طلب جديد</AlertTitle>
            <AlertDescription>
              لديك طلب تسجيل مسجد سابق. لا يمكنك تقديم أكثر من طلب واحد إلا بعد الحصول على استثناء من الإدارة.
              <br />
              يرجى التواصل مع الإدارة إذا كنت بحاجة لتسجيل مسجد إضافي.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Link href="/requester/mosques">
              <Button variant="outline">العودة لقائمة المساجد</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* العنوان */}
        <div className="flex items-center gap-4">
          <Link href="/mosques">
            <Button variant="ghost" size="icon">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إضافة مسجد جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات المسجد المراد إضافته</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بيانات مقدم الطلب - للقراءة فقط */}
          {user?.role === "service_requester" && (
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  بيانات مقدم الطلب
                </CardTitle>
                <CardDescription>بياناتك كمقدم للطلب (غير قابلة للتعديل)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">الاسم</Label>
                    <p className="font-medium">{user?.name || "غير محدد"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">الصفة</Label>
                    <p className="font-medium">{getRequesterTypeLabel(user?.requesterType)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">رقم الجوال</Label>
                    <p className="font-medium" dir="ltr">{user?.phone || "غير محدد"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">البريد الإلكتروني</Label>
                    <p className="font-medium text-sm" dir="ltr">{user?.email || "غير محدد"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* المعلومات الأساسية */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                المعلومات الأساسية
              </CardTitle>
              <CardDescription>البيانات الرئيسية للمسجد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم المسجد *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="مثال: مسجد الرحمة"
                    required
                  />
                </div>
                <div>
                  <Label>نوع المسجد *</Label>
                  <Select value={formData.mosqueType} onValueChange={(v) => handleChange("mosqueType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {mosqueTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>حالة المسجد</Label>
                  <Select value={formData.mosqueStatus} onValueChange={(v) => handleChange("mosqueStatus", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {mosqueStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نوع الملكية</Label>
                  <Select value={formData.ownershipType} onValueChange={(v) => handleChange("ownershipType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الملكية" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownershipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>السعة (عدد المصلين)</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    placeholder="مثال: 500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الموقع على الخريطة */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع الجغرافي
              </CardTitle>
              <CardDescription>حدد موقع المسجد على الخريطة بالنقر أو البحث</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* مكون اختيار الموقع */}
              <LocationPicker
                value={formData.latitude && formData.longitude ? {
                  lat: parseFloat(formData.latitude),
                  lng: parseFloat(formData.longitude)
                } : undefined}
                onChange={handleLocationChange}
              />

              {/* حقول الموقع اليدوية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label>المدينة *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="مثال: الرياض"
                    required
                  />
                </div>
                <div>
                  <Label>الحي</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                    placeholder="مثال: النسيم"
                  />
                </div>
                <div>
                  <Label>المنطقة</Label>
                  <Input
                    value={formData.area}
                    onChange={(e) => handleChange("area", e.target.value)}
                    placeholder="مثال: منطقة الرياض"
                  />
                </div>
              </div>
              <div>
                <Label>العنوان التفصيلي</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="العنوان التفصيلي للمسجد..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>خط العرض (Latitude)</Label>
                  <Input
                    value={formData.latitude}
                    onChange={(e) => handleChange("latitude", e.target.value)}
                    placeholder="مثال: 24.7136"
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>خط الطول (Longitude)</Label>
                  <Input
                    value={formData.longitude}
                    onChange={(e) => handleChange("longitude", e.target.value)}
                    placeholder="مثال: 46.6753"
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ملاحظة للموافقة */}
          {user?.role === "service_requester" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ملاحظة هامة</AlertTitle>
              <AlertDescription>
                سيتم مراجعة طلب تسجيل المسجد من قبل الإدارة قبل اعتماده. ستصلك إشعار عند الموافقة على الطلب.
              </AlertDescription>
            </Alert>
          )}

          {/* زر الحفظ */}
          <div className="flex justify-end gap-4">
            <Link href="/mosques">
              <Button type="button" variant="outline">إلغاء</Button>
            </Link>
            <Button 
              type="submit" 
              className="gradient-primary text-white"
              disabled={createMutation.isPending || checkingMosques}
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : user?.role === "service_requester" ? (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  إرسال للموافقة
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ المسجد
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
