import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2 } from "lucide-react";

const mosqueTypes = [
  { value: "jami", label: "جامع" },
  { value: "masjid", label: "مسجد" },
  { value: "musalla", label: "مصلى" },
];

const asirLocations = [
  "أبها", "خميس مشيط", "بيشة", "محايل عسير", "النماص", "تثليث",
  "ظهران الجنوب", "سراة عبيدة", "رجال ألمع", "بلقرن", "أحد رفيدة",
  "تنومة", "بارق", "المجاردة", "طريب", "البرك", "الحرجة", "الأمواه",
  "السودة", "بللحمر", "بللسمر", "طبب", "مربة", "القحمة",
  "وادي بن هشبل", "الواديين", "الفرعة", "الفرشة", "الحبيل",
  "الربوعة", "الشعف", "العرين", "القرى", "المضة", "النقيع",
  "بحر أبو سكينة", "تندحة", "ثلوث المنظر", "خاط", "رغدان",
  "سبت العلاية", "سنامة", "صمخ", "قنا", "كتنة", "وادي الجوف",
  "جاش", "الزرق",
];

interface AddMosqueModalProps {
  open: boolean;
  onClose: () => void;
  /** يُستدعى بعد الحفظ الناجح مع id المسجد الجديد */
  onSuccess: (mosqueId: number, mosqueName: string) => void;
}

export function AddMosqueModal({ open, onClose, onSuccess }: AddMosqueModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mosqueType: "",
    city: "",
    district: "",
    address: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const createMutation = trpc.mosques.create.useMutation({
    onSuccess: (data) => {
      toast.success("تم إرسال طلب تسجيل المسجد بنجاح. سيتم مراجعته من قبل الإدارة.");
      onSuccess(data.mosqueId, formData.name);
      // إعادة تعيين النموذج
      setFormData({ name: "", mosqueType: "", city: "", district: "", address: "" });
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة المسجد");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.mosqueType) {
      toast.error("يرجى ملء الحقول المطلوبة: اسم المسجد، النوع، والمدينة");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      city: formData.city,
      governorate: "عسير",
      district: formData.district || undefined,
      address: formData.address || undefined,
      notes: formData.mosqueType ? `نوع المسجد: ${mosqueTypes.find(t => t.value === formData.mosqueType)?.label || formData.mosqueType}` : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-amber-600" />
            إضافة مسجد جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات المسجد الأساسية. سيتم مراجعة الطلب من قبل الإدارة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* اسم المسجد */}
          <div className="space-y-1.5">
            <Label htmlFor="mosque-name">
              اسم المسجد <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mosque-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="مثال: مسجد الملك فهد"
              required
            />
          </div>

          {/* نوع المسجد */}
          <div className="space-y-1.5">
            <Label>
              نوع المسجد <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.mosqueType} onValueChange={(v) => handleChange("mosqueType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المسجد" />
              </SelectTrigger>
              <SelectContent>
                {mosqueTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* المدينة */}
          <div className="space-y-1.5">
            <Label>
              المدينة / المركز <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.city} onValueChange={(v) => handleChange("city", v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة أو المركز" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {asirLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الحي */}
          <div className="space-y-1.5">
            <Label htmlFor="mosque-district">الحي</Label>
            <Input
              id="mosque-district"
              value={formData.district}
              onChange={(e) => handleChange("district", e.target.value)}
              placeholder="مثال: حي النزهة"
            />
          </div>

          {/* العنوان */}
          <div className="space-y-1.5">
            <Label htmlFor="mosque-address">العنوان التفصيلي</Label>
            <Input
              id="mosque-address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="مثال: شارع الأمير سلطان"
            />
          </div>

          {/* أزرار */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الحفظ...</>
              ) : (
                "حفظ المسجد"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
