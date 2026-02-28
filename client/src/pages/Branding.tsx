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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
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
              <CardDescription>رفع شعارين: شعار رئيسي (ملون) وشعار أبيض (أيقونة)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* الشعار الرئيسي */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <Label className="text-base font-semibold">الشعار الرئيسي</Label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">ملون - للخلفيات الفاتحة</span>
                </div>
                {mainLogo ? (
                  <div className="border-2 border-primary rounded-xl p-6 relative bg-white">
                    <img src={mainLogo} alt="الشعار الرئيسي" className="max-h-24 mx-auto object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-7 w-7"
                      onClick={() => handleRemoveLogo("logo", setMainLogo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">انقر لتغيير الشعار</p>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-white"
                    onClick={() => mainLogoRef.current?.click()}
                  >
                    {uploading === "logo" ? (
                      <>
                        <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                        <p className="text-sm font-medium text-primary">جاري رفع الشعار...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">اسحب الملف هنا أو انقر للرفع</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, SVG, WEBP (حد أقصى 2MB)</p>
                      </>
                    )}
                    <input 
                      ref={mainLogoRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "logo", setMainLogo);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* الشعار الأبيض (أيقونة) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-700" />
                  <Label className="text-base font-semibold">الشعار الأبيض (أيقونة)</Label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">أبيض - للخلفيات الداكنة</span>
                </div>
                {whiteLogo ? (
                  <div className="border-2 border-gray-600 rounded-xl p-6 relative bg-gray-900">
                    <img src={whiteLogo} alt="الشعار الأبيض" className="max-h-24 mx-auto object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-7 w-7"
                      onClick={() => handleRemoveLogo("secondaryLogo", setWhiteLogo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-2">انقر لتغيير الشعار</p>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center hover:border-gray-600 hover:bg-gray-900/5 transition-all cursor-pointer bg-gray-900/10"
                    onClick={() => whiteLogoRef.current?.click()}
                  >
                    {uploading === "secondaryLogo" ? (
                      <>
                        <Loader2 className="w-10 h-10 text-gray-600 mx-auto mb-3 animate-spin" />
                        <p className="text-sm font-medium text-gray-600">جاري رفع الشعار...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-gray-800/20 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-foreground">اسحب الملف هنا أو انقر للرفع</p>
                        <p className="text-xs text-muted-foreground mt-1">يفضل PNG بخلفية شفافة (حد أقصى 2MB)</p>
                      </>
                    )}
                    <input 
                      ref={whiteLogoRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "secondaryLogo", setWhiteLogo);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* الختم / الطابع */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-600" />
                  <Label className="text-base font-semibold">الختم / الطابع الرسمي</Label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">للوثائق الرسمية</span>
                </div>
                {darkLogo ? (
                  <div className="border-2 border-amber-300 rounded-xl p-6 relative bg-white">
                    <img src={darkLogo} alt="الختم" className="max-h-24 mx-auto object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-7 w-7"
                      onClick={() => handleRemoveLogo("stamp", setDarkLogo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">انقر لتغيير الختم</p>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center hover:border-amber-500 hover:bg-amber-50/50 transition-all cursor-pointer"
                    onClick={() => darkLogoRef.current?.click()}
                  >
                    {uploading === "stamp" ? (
                      <>
                        <Loader2 className="w-10 h-10 text-amber-600 mx-auto mb-3 animate-spin" />
                        <p className="text-sm font-medium text-amber-600">جاري رفع الختم...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-8 h-8 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium text-foreground">اسحب الملف هنا أو انقر للرفع</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, SVG (حد أقصى 2MB)</p>
                      </>
                    )}
                    <input 
                      ref={darkLogoRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "stamp", setDarkLogo);
                        e.target.value = "";
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
              {/* معاينة القائمة الجانبية الداكنة */}
              <div className="h-16 flex items-center px-6" style={{ backgroundColor: '#1a2e2a' }}>
                <div className="flex items-center gap-3">
                  {whiteLogo ? (
                    <img src={whiteLogo} alt="الشعار الأبيض" className="h-9 w-auto" />
                  ) : mainLogo ? (
                    <img src={mainLogo} alt="الشعار" className="h-9 w-auto opacity-90" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold">ت</span>
                    </div>
                  )}
                  <div className="text-white">
                    <p className="font-bold text-sm">بوابة تمام</p>
                    <p className="text-xs opacity-50">للعناية بالمساجد</p>
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
