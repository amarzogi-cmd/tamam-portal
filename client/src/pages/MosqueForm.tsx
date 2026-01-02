import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, MapPin, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

export default function MosqueForm() {
  const [, navigate] = useLocation();
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
    imamName: "",
    imamPhone: "",
    muezzinName: "",
    muezzinPhone: "",
    description: "",
  });

  const createMutation = trpc.mosques.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المسجد بنجاح");
      navigate("/mosques");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.mosqueType) {
      toast.error("يرجى ملء الحقول المطلوبة");
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
      imamName: formData.imamName || undefined,
      imamPhone: formData.imamPhone || undefined,
    });
  };

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

          {/* الموقع */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع الجغرافي
              </CardTitle>
              <CardDescription>معلومات موقع المسجد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  />
                </div>
                <div>
                  <Label>خط الطول (Longitude)</Label>
                  <Input
                    value={formData.longitude}
                    onChange={(e) => handleChange("longitude", e.target.value)}
                    placeholder="مثال: 46.6753"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الإمام والمؤذن */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>معلومات الإمام والمؤذن</CardTitle>
              <CardDescription>بيانات التواصل مع القائمين على المسجد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم الإمام</Label>
                  <Input
                    value={formData.imamName}
                    onChange={(e) => handleChange("imamName", e.target.value)}
                    placeholder="اسم إمام المسجد"
                  />
                </div>
                <div>
                  <Label>جوال الإمام</Label>
                  <Input
                    value={formData.imamPhone}
                    onChange={(e) => handleChange("imamPhone", e.target.value)}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div>
                  <Label>اسم المؤذن</Label>
                  <Input
                    value={formData.muezzinName}
                    onChange={(e) => handleChange("muezzinName", e.target.value)}
                    placeholder="اسم مؤذن المسجد"
                  />
                </div>
                <div>
                  <Label>جوال المؤذن</Label>
                  <Input
                    value={formData.muezzinPhone}
                    onChange={(e) => handleChange("muezzinPhone", e.target.value)}
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* زر الحفظ */}
          <div className="flex justify-end gap-4">
            <Link href="/mosques">
              <Button type="button" variant="outline">إلغاء</Button>
            </Link>
            <Button 
              type="submit" 
              className="gradient-primary text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الحفظ...
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
