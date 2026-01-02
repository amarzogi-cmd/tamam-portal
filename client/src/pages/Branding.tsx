import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Branding() {
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [secondaryColor, setSecondaryColor] = useState("#6366F1");
  const [accentColor, setAccentColor] = useState("#F59E0B");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">الهوية البصرية</h1>
            <p className="text-muted-foreground">تخصيص الألوان والشعارات للبوابة</p>
          </div>
          <Button className="gradient-primary text-white" onClick={() => toast.success("تم حفظ التغييرات")}>
            <Save className="w-4 h-4 ml-2" />
            حفظ التغييرات
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* الألوان */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                الألوان
              </CardTitle>
              <CardDescription>تخصيص ألوان البوابة الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>اللون الثانوي</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>لون التمييز</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>

              {/* معاينة الألوان */}
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-3">معاينة الألوان</p>
                <div className="flex gap-2">
                  <Button style={{ backgroundColor: primaryColor }} className="text-white">
                    زر أساسي
                  </Button>
                  <Button style={{ backgroundColor: secondaryColor }} className="text-white">
                    زر ثانوي
                  </Button>
                  <Button style={{ backgroundColor: accentColor }} className="text-white">
                    زر تمييز
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الشعارات */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                الشعارات
              </CardTitle>
              <CardDescription>رفع شعارات البوابة بألوان مختلفة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>الشعار الرئيسي (ملون)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للرفع</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                  <Input type="file" accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الشعار الأبيض (للخلفيات الداكنة)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-foreground/5">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للرفع</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                  <Input type="file" accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الشعار الداكن (للخلفيات الفاتحة)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للرفع</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                  <Input type="file" accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>أيقونة الموقع (Favicon)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <span className="text-xs">16</span>
                    </div>
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <span className="text-xs">32</span>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-muted-foreground">رفع أيقونة</p>
                      <p className="text-xs text-muted-foreground">ICO, PNG (16x16, 32x32)</p>
                    </div>
                  </div>
                  <Input type="file" accept="image/*,.ico" className="hidden" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معاينة */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              معاينة الهوية البصرية
            </CardTitle>
            <CardDescription>كيف ستظهر الهوية البصرية في البوابة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border">
              {/* شريط علوي */}
              <div className="h-16 flex items-center px-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold">ت</span>
                  </div>
                  <div className="text-white">
                    <p className="font-bold">بوابة تمام</p>
                    <p className="text-xs opacity-80">للعناية بالمساجد</p>
                  </div>
                </div>
              </div>
              
              {/* محتوى */}
              <div className="p-6 bg-muted/30">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg mb-3" style={{ backgroundColor: primaryColor + "20" }}>
                      <div className="w-full h-full flex items-center justify-center" style={{ color: primaryColor }}>📋</div>
                    </div>
                    <p className="font-medium">بطاقة نموذجية</p>
                    <p className="text-sm text-muted-foreground">وصف قصير</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg mb-3" style={{ backgroundColor: secondaryColor + "20" }}>
                      <div className="w-full h-full flex items-center justify-center" style={{ color: secondaryColor }}>🏗️</div>
                    </div>
                    <p className="font-medium">بطاقة نموذجية</p>
                    <p className="text-sm text-muted-foreground">وصف قصير</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg mb-3" style={{ backgroundColor: accentColor + "20" }}>
                      <div className="w-full h-full flex items-center justify-center" style={{ color: accentColor }}>⭐</div>
                    </div>
                    <p className="font-medium">بطاقة نموذجية</p>
                    <p className="text-sm text-muted-foreground">وصف قصير</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
