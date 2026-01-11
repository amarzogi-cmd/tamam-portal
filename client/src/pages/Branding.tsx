import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Eye, Save, X, Loader2, FileText, Building2, Star } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function Branding() {
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [secondaryColor, setSecondaryColor] = useState("#6366F1");
  const [accentColor, setAccentColor] = useState("#F59E0B");
  
  // حالات الشعارات
  const [mainLogo, setMainLogo] = useState<string | null>(null);
  const [whiteLogo, setWhiteLogo] = useState<string | null>(null);
  const [darkLogo, setDarkLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // مراجع حقول الملفات
  const mainLogoRef = useRef<HTMLInputElement>(null);
  const whiteLogoRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);
  
  // جلب إعدادات الجمعية
  const { data: orgSettings, refetch } = trpc.organization.getSettings.useQuery();
  const uploadLogoMutation = trpc.organization.uploadLogo.useMutation();
  
  // تحميل الشعارات الموجودة
  useEffect(() => {
    if (orgSettings) {
      if (orgSettings.logoUrl) setMainLogo(orgSettings.logoUrl);
      if (orgSettings.secondaryLogoUrl) setWhiteLogo(orgSettings.secondaryLogoUrl);
      if (orgSettings.stampUrl) setDarkLogo(orgSettings.stampUrl);
    }
  }, [orgSettings]);
  
  // دالة رفع الشعار
  const handleLogoUpload = async (
    file: File, 
    type: "logo" | "secondaryLogo" | "stamp",
    setLogo: (url: string | null) => void
  ) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 2MB");
      return;
    }
    
    setUploading(type);
    
    try {
      // تحويل الملف إلى base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const result = await uploadLogoMutation.mutateAsync({
          type,
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
        });
        
        if (result.success && result.url) {
          setLogo(result.url);
          toast.success("تم رفع الشعار بنجاح");
          refetch();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("فشل في رفع الشعار");
      console.error(error);
    } finally {
      setUploading(null);
    }
  };
  
  // دالة حذف الشعار
  const handleRemoveLogo = (
    type: "logo" | "secondaryLogo" | "stamp",
    setLogo: (url: string | null) => void
  ) => {
    setLogo(null);
    toast.success("تم حذف الشعار");
  };

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
              {/* الشعار الرئيسي */}
              <div className="space-y-2">
                <Label>الشعار الرئيسي (ملون)</Label>
                {mainLogo ? (
                  <div className="border-2 border-primary rounded-lg p-4 relative">
                    <img src={mainLogo} alt="الشعار الرئيسي" className="max-h-20 mx-auto" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-6 w-6"
                      onClick={() => handleRemoveLogo("logo", setMainLogo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => mainLogoRef.current?.click()}
                  >
                    {uploading === "logo" ? (
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للرفع</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                    <input 
                      ref={mainLogoRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "logo", setMainLogo);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* الشعار الأبيض */}
              <div className="space-y-2">
                <Label>الشعار الأبيض (للخلفيات الداكنة)</Label>
                {whiteLogo ? (
                  <div className="border-2 border-primary rounded-lg p-4 relative bg-gray-800">
                    <img src={whiteLogo} alt="الشعار الأبيض" className="max-h-20 mx-auto" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-6 w-6"
                      onClick={() => handleRemoveLogo("secondaryLogo", setWhiteLogo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-foreground/5"
                    onClick={() => whiteLogoRef.current?.click()}
                  >
                    {uploading === "secondaryLogo" ? (
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للرفع</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                    <input 
                      ref={whiteLogoRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "secondaryLogo", setWhiteLogo);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* الشعار الداكن */}
              <div className="space-y-2">
                <Label>الشعار الداكن (للخلفيات الفاتحة)</Label>
                {darkLogo ? (
                  <div className="border-2 border-primary rounded-lg p-4 relative">
                    <img src={darkLogo} alt="الشعار الداكن" className="max-h-20 mx-auto" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-6 w-6"
                      onClick={() => handleRemoveLogo("stamp", setDarkLogo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => darkLogoRef.current?.click()}
                  >
                    {uploading === "stamp" ? (
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للرفع</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                    <input 
                      ref={darkLogoRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "stamp", setDarkLogo);
                      }}
                    />
                  </div>
                )}
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
                  {mainLogo ? (
                    <img src={mainLogo} alt="الشعار" className="h-10 w-auto" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold">ت</span>
                    </div>
                  )}
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
                      <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <p className="font-medium">بطاقة نموذجية</p>
                    <p className="text-sm text-muted-foreground">وصف قصير</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg mb-3" style={{ backgroundColor: secondaryColor + "20" }}>
                      <Building2 className="w-5 h-5" style={{ color: secondaryColor }} />
                    </div>
                    <p className="font-medium">بطاقة نموذجية</p>
                    <p className="text-sm text-muted-foreground">وصف قصير</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg mb-3" style={{ backgroundColor: accentColor + "20" }}>
                      <Star className="w-5 h-5" style={{ color: accentColor }} />
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
