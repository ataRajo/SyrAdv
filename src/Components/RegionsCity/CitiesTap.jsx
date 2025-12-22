import React, { memo, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Trash2, Edit, Plus, Loader2, Loader } from "lucide-react";
import { RegionsCityContext } from "../../Context/RegionsCityContextApi";
import { useAuth } from "../../Context/AuthProvider";
import { Permissions } from "../../Static/StaticData";

const CitiesTap = () => {
  const context = useContext(RegionsCityContext);
  const { hasPermission } = useAuth();
  
  // Static value for status
  const [staticStatus] = useState(1);

  // Safe fallback if context is undefined
  if (!context) {
    console.error("RegionsCityContext is not available. Make sure the component is wrapped in the provider.");
    return (
      <TabsContent value="cities">
        <div className="w-full h-full flex-col flex justify-center items-center">
          <Loader />
          <p>جاري تحميل البيانات...</p>
          <p className="text-sm text-red-500">خطأ في تحميل السياق</p>
        </div>
      </TabsContent>
    );
  }

  const {
    cityForm = { name: "", is_active: 1 }, // Default values
    setCityForm = () => {},
    editCityId = null,
    isCityDialogOpen = false,
    setIsCityDialogOpen = () => {},
    cities = [],
    isCitiesLoading = false,
    addCityLoading = false,
    handleSubmit = () => {},
    handleEdit = () => {},
    handleDeleteDialog = () => {},
  } = context;

  return (
    <TabsContent value="cities">
      <div className="flex justify-end mb-4">
        <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
          {hasPermission(Permissions.CreateCities) && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> اضافة مدينة
              </Button>
            </DialogTrigger>
          )}

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editCityId ? "تعديل مدينة" : "إضافة مدينة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="اسم المدينة"
                value={cityForm.name}
                onChange={(e) =>
                  setCityForm({ ...cityForm, name: e.target.value })
                }
              />
              <Select
                value={staticStatus.toString()}
                onValueChange={(value) =>
                  setCityForm({ ...cityForm, is_active: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">متوفرة</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleSubmit("city", editCityId, cityForm)}
                disabled={addCityLoading}
              >
                {addCityLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>{editCityId ? "تعديل" : "إضافة"}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isCitiesLoading ? (
        <div className="w-full h-full flex-col flex justify-center items-center">
          <Loader className="animate-spin" />
          <p> جاري التحميل ...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم</TableHead>
              <TableHead>اسم المدينة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.map((city) => (
              <TableRow key={city.id}>
                <TableCell>{city.id}</TableCell>
                <TableCell>{city.name}</TableCell>
                <TableCell>متوفرة</TableCell>
                <TableCell>
                  {hasPermission(Permissions.EditCities) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit("city", city)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {hasPermission(Permissions.DeleteCities) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDialog("city", city.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TabsContent>
  );
};

export default memo(CitiesTap);