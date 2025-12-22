import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { Button } from "@/components/ui/button";
import { Permissions } from "../../Static/StaticData";
import useCustomers from "../../hooks/useCustomers";
import { useUpdateCustomerStatusMutation } from "../../RtkQuery/Slice/Customers/CustomersApi";
import { useState, useEffect } from "react";

const STATUS_OPTIONS = [
  { value: 0, label: "بدون حالة" },
  { value: 1, label: "قيد المراجعة" },
  { value: 2, label: "مقبول" },
  { value: 3, label: "مرفوض" },
];

const CustomerCard = ({
  id,
  fullName,
  companyName,
  phone_number,
  remaining,
  createdAt,
  updatedAt,
  status,
  isAdminCreated = false,
}) => {
  const {
    handleViewDetails,
    hasPermission,
    setOpen,
    open,
    isDeleting,
    handelDelete,
  } = useCustomers({ id });

  const [updateCustomerStatus, { isLoading: isUpdating }] =
    useUpdateCustomerStatusMutation();


/*
const initialStatus =
  typeof status === "number" ? status : isAdminCreated ? 2 : 0;
*/

  // Initial logic for status
  const initialStatus =
  [0, 1, 2, 3].includes(status) ? status : isAdminCreated ? 2 : 0;

  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);

  // ✅ Keep status synced ONLY when prop changes for the first time
  useEffect(() => {
    if (status !== undefined && typeof status === "number") {
      setCurrentStatus(status);
      setSelectedStatus(status);
    }
  }, [status]);

  const getStatusInfo = (statusValue) => {
    switch (statusValue) {
      case 0:
        return { label: "بدون حالة", color: "bg-gray-400" };
      case 1:
        return { label: "قيد المراجعة", color: "bg-yellow-500" };
      case 2:
        return { label: "مقبول", color: "bg-green-600" };
      case 3:
        return { label: "مرفوض", color: "bg-red-600" };
      default:
        return { label: "غير معروف", color: "bg-gray-300" };
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === currentStatus) return;
    try {
      const res = await updateCustomerStatus({
        id,
        status: selectedStatus,
      }).unwrap();

      // ✅ Update local state instantly
      setCurrentStatus(selectedStatus);
      setLocalUpdatedAt(new Date().toISOString());
      setMessage("تم تحديث الحالة بنجاح");

      // Optional: if your API returns the updated customer, you can sync like this:
      // setCurrentStatus(res.status);

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update status:", error);
      setMessage("فشل تحديث الحالة");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const { label, color } = getStatusInfo(currentStatus);

  return (
    <div className="block text-right w-full group">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
       <Card className="flex flex-col h-full p-5 bg-background rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
  {/* Header */}
  <div className="flex items-center gap-4 border-b pb-4 mb-4">
    <Avatar className="w-14 h-14 border-2 border-primary/20">
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-300 text-white font-medium">
        {(fullName || "")
          .split(" ")
          .map((n) => n?.[0] ?? "")
          .join("")}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      <CardTitle className="text-lg font-semibold truncate text-gray-900 dark:text-gray-100">
        {fullName}
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground truncate">
        {companyName || "—"}
      </CardDescription>
    </div>
  </div>

  {/* Content */}
  <CardContent className="space-y-3 p-0">
    <div className="flex items-center gap-2 text-sm">
      <Icon icon="mdi:phone" className="text-blue-500" />
      <span>{phone_number}</span>
    </div>

   <div className="flex items-center gap-2 text-sm">
  <Icon icon="mdi:percent" className="text-green-500" />
  <span>
    المتبقي:
    <Badge 
      variant="outline" 
      className={`ml-1 ${remaining > 0 ? ' text-white  font-medium text-md mr-2' : ''}`}
    >
      {remaining}$
    </Badge>
  </span>
</div>

    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2 mt-2">
      <span>
        تاريخ الإنضمام:{" "}
        {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
      </span>
      <span>
        آخر تحديث:{" "}
        {localUpdatedAt ? new Date(localUpdatedAt).toLocaleDateString() : "-"}
      </span>
    </div>

    {/* Status Section */}
    <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
      <Badge className={`${color} text-white text-sm px-3 py-1`}>
        {label}
      </Badge>

      {hasPermission(Permissions.EditCustomers) && (
        <>
          <select
            aria-label="اختر الحالة"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(Number(e.target.value))}
            className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            onClick={handleUpdateStatus}
            disabled={selectedStatus === currentStatus || isUpdating}
            className="w-28"
          >
            {isUpdating ? "جاري التحديث..." : "حفظ"}
          </Button>
        </>
      )}
    </div>
  </CardContent>

  {/* Actions */}
  <div className="flex gap-2 pt-4 mt-auto border-t">
    <Button
      variant="default"
      className="flex-1 gap-2"
      onClick={handleViewDetails}
    >
      <Icon icon="mdi:eye-outline" className="text-lg" />
      عرض التفاصيل
    </Button>

    {hasPermission(Permissions.DeleteCustomers) && (
      <Button
        variant="destructive"
        className="flex-1 gap-2"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Icon icon="mdi:trash-can-outline" className="text-lg" />
        حذف
      </Button>
    )}
  </div>

  {message && (
    <div
      className="mt-3 text-sm text-center text-primary-600"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )}
</Card>


        <DeleteDialog
          open={open}
          onClose={() => setOpen(false)}
          loading={isDeleting}
          onConfirm={handelDelete}
        />
      </motion.div>
    </div>
  );
};

export default CustomerCard;
