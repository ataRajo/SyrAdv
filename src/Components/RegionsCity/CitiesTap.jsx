import React, { memo, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Loader2, 
  Loader, 
  Search,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Globe,
  TrendingUp
} from "lucide-react";
import { RegionsCityContext } from "../../Context/RegionsCityContextApi";
import { useAuth } from "../../Context/AuthProvider";
import { Permissions } from "../../Static/StaticData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DialogTrigger } from "@radix-ui/react-dialog";
const CitiesTab = () => {
  const context = useContext(RegionsCityContext);
  const { hasPermission } = useAuth();
  const [staticStatus] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  if (!context) {
    return (
      <TabsContent value="cities">
        <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-8">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">جاري تحميل البيانات...</p>
            <p className="text-sm text-red-500 mt-1">خطأ في تحميل السياق</p>
          </div>
        </div>
      </TabsContent>
    );
  }

  const {
    cityForm = { name: "", is_active: 1 },
    setCityForm,
    editCityId,
    setEditCityId,
    isCityDialogOpen,
    setIsCityDialogOpen,
    cities = [],
    isCitiesLoading,
    addCityLoading,
    handleSubmit,
    handleEdit,
    handleDeleteDialog,
    filteredRegions = []
  } = context;

  // Filter cities by search term
  const searchFilteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get regions count for each city
  const getRegionCountForCity = (cityId) => {
    return filteredRegions.filter(region => region.city_id === cityId).length;
  };

  // Handle opening dialog for adding new city
  const handleAddCity = () => {
    // Reset form and edit ID before opening dialog
    setCityForm({ name: "", is_active: 1 });
    setEditCityId(null);
    setIsCityDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsCityDialogOpen(false);
    // Reset form after animation
    setTimeout(() => {
      setCityForm({ name: "", is_active: 1 });
      setEditCityId(null);
    }, 300);
  };

  return (
    <TabsContent value="cities" className="space-y-6 p-2 sm:p-4">
      {/* Header Section */}
      <Card className="border-2 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                إدارة المدن
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                إضافة وتعديل وحذف المدن في النظام
              </p>
            </div>
            
            {hasPermission(Permissions.CreateCities) && (
              <Dialog 
                open={isCityDialogOpen} 
                onOpenChange={(open) => {
                  setIsCityDialogOpen(open);
                  if (!open) {
                    handleDialogClose();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button 
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={handleAddCity}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">إضافة مدينة</span>
                    <span className="inline sm:hidden">إضافة</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
                  // Prevent closing when clicking outside if loading
                  if (addCityLoading) {
                    e.preventDefault();
                  }
                }}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-500" />
                      {editCityId ? "تعديل مدينة" : "إضافة مدينة جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      {editCityId 
                        ? `جاري تعديل المدينة رقم ${editCityId}` 
                        : "أدخل معلومات المدينة الجديدة"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        اسم المدينة
                      </label>
                      <Input
                        placeholder="مثال: دمشق، حلب، حمص..."
                        value={cityForm.name || ""}
                        onChange={(e) =>
                          setCityForm({ ...cityForm, name: e.target.value })
                        }
                        className="dark:bg-gray-800 dark:border-gray-700"
                        disabled={addCityLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        الحالة
                      </label>
                      <Select
                        value={staticStatus.toString()}
                        onValueChange={(value) =>
                          setCityForm({ ...cityForm, is_active: parseInt(value) })
                        }
                        disabled={addCityLoading}
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="1" className="dark:hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>متوفرة</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDialogClose}
                      disabled={addCityLoading}
                      className="w-full sm:w-auto"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        handleSubmit("city", editCityId, cityForm);
                      }}
                      disabled={addCityLoading || !cityForm.name}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {addCityLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {editCityId ? "جاري التعديل..." : "جاري الإضافة..."}
                        </>
                      ) : editCityId ? (
                        "حفظ التعديلات"
                      ) : (
                        "إضافة المدينة"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن مدينة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
            
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                مسح البحث
              </Button>
            )}
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي المدن</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{cities.length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">المدن المتاحة</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {cities.filter(c => c.is_active === 1).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">إجمالي المناطق</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {filteredRegions.length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cities Table */}
      <Card className="border-2 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>قائمة المدن</span>
            <Badge variant="outline" className="text-sm">
              {searchFilteredCities.length} مدينة
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isCitiesLoading ? (
            <div className="w-full h-64 flex flex-col justify-center items-center gap-4">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">جاري تحميل المدن...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">يتم تحميل البيانات من الخادم</p>
            </div>
          ) : searchFilteredCities.length === 0 ? (
            <div className="w-full h-64 flex flex-col justify-center items-center gap-4 text-center p-8">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                  {searchTerm ? "لم يتم العثور على نتائج" : "لا توجد مدن"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {searchTerm 
                    ? `لا توجد مدن تطابق "${searchTerm}"`
                    : "ابدأ بإضافة مدينة جديدة باستخدام زر 'إضافة مدينة'"
                  }
                </p>
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  عرض جميع المدن
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">#</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          اسم المدينة
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          عدد المناطق
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300">الحالة</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-gray-300 text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {searchFilteredCities.map((city, index) => (
                      <TableRow 
                        key={city.id} 
                        className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''
                        }`}
                      >
                        <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                          {city.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {city.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {getRegionCountForCity(city.id)} منطقة
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={city.is_active === 1 ? "default" : "secondary"}
                            className={`gap-1 ${
                              city.is_active === 1
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {city.is_active === 1 ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                متوفرة
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                غير متوفرة
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {hasPermission(Permissions.EditCities) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit("city", city)}
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {hasPermission(Permissions.DeleteCities) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDialog("city", city.id)}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Table Footer */}
              <div className="px-4 py-3 border-t dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    عرض {searchFilteredCities.length} من {cities.length} مدينة
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{filteredRegions.length}</span> منطقة إجمالاً
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{cities.length}</span> مدينة
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default memo(CitiesTab);