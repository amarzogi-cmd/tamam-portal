import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Unit {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface ItemType {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export default function CategoriesManagement() {
  // حالة الوحدات
  const [units, setUnits] = useState<Unit[]>([
    { id: "1", name: "متر", code: "m" },
    { id: "2", name: "كيلو", code: "kg" },
    { id: "3", name: "عدد", code: "pcs" },
    { id: "4", name: "متر مربع", code: "m2" },
    { id: "5", name: "متر مكعب", code: "m3" },
  ]);

  // حالة الفئات
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "بناء", code: "construction" },
    { id: "2", name: "كهرباء", code: "electrical" },
    { id: "3", name: "سباكة", code: "plumbing" },
    { id: "4", name: "تكييف", code: "hvac" },
    { id: "5", name: "أعمال عامة", code: "general" },
  ]);

  // حالة البنود
  const [itemTypes, setItemTypes] = useState<ItemType[]>([
    { id: "1", name: "مواد", code: "materials" },
    { id: "2", name: "عمالة", code: "labor" },
    { id: "3", name: "معدات", code: "equipment" },
    { id: "4", name: "نقل", code: "transport" },
  ]);

  // حالة الـ Dialog
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemTypeDialog, setShowItemTypeDialog] = useState(false);

  // حالة النموذج
  const [newUnit, setNewUnit] = useState({ name: "", code: "" });
  const [newCategory, setNewCategory] = useState({ name: "", code: "" });
  const [newItemType, setNewItemType] = useState({ name: "", code: "" });

  // حالة التعديل
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);

  // دوال إضافة الوحدات
  const handleAddUnit = () => {
    if (!newUnit.name || !newUnit.code) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingUnit) {
      setUnits(units.map(u => u.id === editingUnit.id ? { ...u, ...newUnit } : u));
      toast.success("تم تحديث الوحدة بنجاح");
      setEditingUnit(null);
    } else {
      setUnits([...units, { id: Date.now().toString(), ...newUnit }]);
      toast.success("تم إضافة الوحدة بنجاح");
    }

    setNewUnit({ name: "", code: "" });
    setShowUnitDialog(false);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setNewUnit({ name: unit.name, code: unit.code });
    setShowUnitDialog(true);
  };

  const handleDeleteUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
    toast.success("تم حذف الوحدة بنجاح");
  };

  // دوال إضافة الفئات
  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.code) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...newCategory } : c));
      toast.success("تم تحديث الفئة بنجاح");
      setEditingCategory(null);
    } else {
      setCategories([...categories, { id: Date.now().toString(), ...newCategory }]);
      toast.success("تم إضافة الفئة بنجاح");
    }

    setNewCategory({ name: "", code: "" });
    setShowCategoryDialog(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, code: category.code });
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    toast.success("تم حذف الفئة بنجاح");
  };

  // دوال إضافة البنود
  const handleAddItemType = () => {
    if (!newItemType.name || !newItemType.code) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingItemType) {
      setItemTypes(itemTypes.map(it => it.id === editingItemType.id ? { ...it, ...newItemType } : it));
      toast.success("تم تحديث البند بنجاح");
      setEditingItemType(null);
    } else {
      setItemTypes([...itemTypes, { id: Date.now().toString(), ...newItemType }]);
      toast.success("تم إضافة البند بنجاح");
    }

    setNewItemType({ name: "", code: "" });
    setShowItemTypeDialog(false);
  };

  const handleEditItemType = (itemType: ItemType) => {
    setEditingItemType(itemType);
    setNewItemType({ name: itemType.name, code: itemType.code });
    setShowItemTypeDialog(true);
  };

  const handleDeleteItemType = (id: string) => {
    setItemTypes(itemTypes.filter(it => it.id !== id));
    toast.success("تم حذف البند بنجاح");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة التصنيفات</h1>
          <p className="text-gray-600 mt-2">إدارة الوحدات والفئات والبنود المستخدمة في النظام</p>
        </div>

        <Tabs defaultValue="units" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="units">الوحدات</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="item-types">البنود</TabsTrigger>
          </TabsList>

          {/* تبويب الوحدات */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>الوحدات</CardTitle>
                  <CardDescription>إدارة وحدات القياس المستخدمة في جداول الكميات</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingUnit(null);
                    setNewUnit({ name: "", code: "" });
                    setShowUnitDialog(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة وحدة
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell>{unit.code}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUnit(unit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUnit(unit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الفئات */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>الفئات</CardTitle>
                  <CardDescription>إدارة فئات البنود في جداول الكميات</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategory({ name: "", code: "" });
                    setShowCategoryDialog(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة فئة
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.code}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب البنود */}
          <TabsContent value="item-types" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>البنود</CardTitle>
                  <CardDescription>إدارة أنواع البنود في جداول الكميات</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingItemType(null);
                    setNewItemType({ name: "", code: "" });
                    setShowItemTypeDialog(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة بند
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemTypes.map((itemType) => (
                      <TableRow key={itemType.id}>
                        <TableCell>{itemType.name}</TableCell>
                        <TableCell>{itemType.code}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItemType(itemType)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteItemType(itemType.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog إضافة/تعديل الوحدة */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? "تعديل الوحدة" : "إضافة وحدة جديدة"}</DialogTitle>
            <DialogDescription>
              {editingUnit ? "قم بتعديل بيانات الوحدة" : "أدخل بيانات الوحدة الجديدة"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الوحدة</Label>
              <Input
                placeholder="مثال: متر"
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
              />
            </div>
            <div>
              <Label>الرمز</Label>
              <Input
                placeholder="مثال: m"
                value={newUnit.code}
                onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnitDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddUnit}>
              {editingUnit ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إضافة/تعديل الفئة */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "قم بتعديل بيانات الفئة" : "أدخل بيانات الفئة الجديدة"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الفئة</Label>
              <Input
                placeholder="مثال: بناء"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div>
              <Label>الرمز</Label>
              <Input
                placeholder="مثال: construction"
                value={newCategory.code}
                onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddCategory}>
              {editingCategory ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إضافة/تعديل البند */}
      <Dialog open={showItemTypeDialog} onOpenChange={setShowItemTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemType ? "تعديل البند" : "إضافة بند جديد"}</DialogTitle>
            <DialogDescription>
              {editingItemType ? "قم بتعديل بيانات البند" : "أدخل بيانات البند الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم البند</Label>
              <Input
                placeholder="مثال: مواد"
                value={newItemType.name}
                onChange={(e) => setNewItemType({ ...newItemType, name: e.target.value })}
              />
            </div>
            <div>
              <Label>الرمز</Label>
              <Input
                placeholder="مثال: materials"
                value={newItemType.code}
                onChange={(e) => setNewItemType({ ...newItemType, code: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemTypeDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddItemType}>
              {editingItemType ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
