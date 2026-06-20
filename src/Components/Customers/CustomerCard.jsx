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

import ContactCustomerModal from "./ContactCustomerModal";

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

  const initialStatus =
    [0, 1, 2, 3].includes(status) ? status : isAdminCreated ? 2 : 0;

  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (status !== undefined && typeof status === "number") {
      setCurrentStatus(status);
      setSelectedStatus(status);
    }
  }, [status]);

  const getStatusInfo = (statusValue) => {
    switch (statusValue) {
      case 0:
        return { label: "بدون حالة", color: "bg-gray-400", icon: "mdi:circle-outline" };
      case 1:
        return { label: "قيد المراجعة", color: "bg-yellow-500", icon: "mdi:clock-outline" };
      case 2:
        return { label: "مقبول", color: "bg-green-600", icon: "mdi:check-circle-outline" };
      case 3:
        return { label: "مرفوض", color: "bg-red-600", icon: "mdi:close-circle-outline" };
      default:
        return { label: "غير معروف", color: "bg-gray-300", icon: "mdi:help-circle-outline" };
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === currentStatus) return;
    try {
      await updateCustomerStatus({
        id,
        status: selectedStatus,
      }).unwrap();

      setCurrentStatus(selectedStatus);
      setLocalUpdatedAt(new Date().toISOString());
      setMessage("تم تحديث الحالة بنجاح");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update status:", error);
      setMessage("فشل تحديث الحالة");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const { label, color, icon } = getStatusInfo(currentStatus);

  return (
    <div className="block text-right w-full group">
      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="flex flex-col h-full p-3 sm:p-4 md:p-5 bg-background rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20 dark:hover:border-primary/20">
          
          {/* Header - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 border-b pb-3 sm:pb-4 mb-3 sm:mb-4">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-2 border-primary/20 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-300 text-white font-medium text-sm sm:text-base">
                {(fullName || "")
                  .split(" ")
                  .map((n) => n?.[0] ?? "")
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base md:text-lg font-semibold truncate text-gray-900 dark:text-gray-100">
                {fullName}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground truncate">
                {companyName || "—"}
              </CardDescription>
            </div>

            {/* Status Badge - Mobile Top */}
            <Badge className={`${color} text-white text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-0.5 sm:py-1 flex items-center gap-1 shrink-0`}>
              <Icon icon={icon} className="text-[10px] sm:text-xs" />
              <span className="hidden sm:inline">{label}</span>
            </Badge>
          </div>

          {/* Content */}
          <CardContent className="space-y-2 sm:space-y-3 p-0 flex-1">
            {/* Phone Number */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-full">
                <Icon icon="mdi:phone" className="text-blue-500 text-xs sm:text-sm" />
              </div>
              <span dir="ltr" className="font-medium">{phone_number}</span>
            </div>

            {/* Remaining Balance */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="bg-green-100 dark:bg-green-900/30 p-1.5 sm:p-2 rounded-full">
                <Icon icon="mdi:currency-usd" className="text-green-500 text-xs sm:text-sm" />
              </div>
              <span className="text-gray-500 dark:text-gray-400">المتبقي:</span>
              <Badge 
                variant={remaining > 0 ? "default" : "outline"}
                className={`text-xs sm:text-sm font-semibold ${
                  remaining > 0 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {remaining}$
              </Badge>
            </div>

            {/* Dates - Stack on mobile, row on larger screens */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <Icon icon="mdi:calendar-plus" className="text-[10px] sm:text-xs" />
                <span>تاريخ الإنضمام: {createdAt ? new Date(createdAt).toLocaleDateString('ar-SA') : "-"}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Icon icon="mdi:calendar-edit" className="text-[10px] sm:text-xs" />
                <span>آخر تحديث: {localUpdatedAt ? new Date(localUpdatedAt).toLocaleDateString('ar-SA') : "-"}</span>
              </div>
            </div>

            {/* Status Section - Only show if has edit permission */}
            {hasPermission(Permissions.EditCustomers) && (
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-2 sm:pt-3 border-t">
                <select
                  aria-label="اختر الحالة"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(Number(e.target.value))}
                  className="flex-1 h-8 sm:h-10 px-2 sm:px-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUpdateStatus}
                    disabled={selectedStatus === currentStatus || isUpdating}
                    className="flex-1 xs:flex-none text-xs sm:text-sm h-8 sm:h-10"
                  >
                    {isUpdating ? (
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:loading" className="animate-spin text-xs" />
                        جاري...
                      </span>
                    ) : (
                      "حفظ"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 xs:flex-none gap-1 sm:gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-xs sm:text-sm h-8 sm:h-10"
                    onClick={() => setShowContactModal(true)}
                  >
                    <Icon icon="mdi:whatsapp" className="text-sm sm:text-base" />
                    <span className="hidden xs:inline">واتساب</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          {/* Actions */}
          <div className="flex gap-2 pt-3 sm:pt-4 mt-auto border-t">
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10"
              onClick={handleViewDetails}
            >
              <Icon icon="mdi:eye-outline" className="text-sm sm:text-base" />
              عرض التفاصيل
            </Button>

            {hasPermission(Permissions.DeleteCustomers) && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10"
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(true);
                }}
              >
                <Icon icon="mdi:trash-can-outline" className="text-sm sm:text-base" />
                حذف
              </Button>
            )}
          </div>

          {/* Success/Error Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-2 sm:mt-3 text-xs sm:text-sm text-center py-1.5 sm:py-2 rounded-lg ${
                message.includes("نجاح")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </motion.div>
          )}
        </Card>

        {/* Contact WhatsApp Modal */}
        <ContactCustomerModal
          open={showContactModal}
          onClose={() => setShowContactModal(false)}
          customerName={fullName}
            customerId={id}     
          companyName={companyName}
          phoneNumber={phone_number}
        />

        {/* Delete Dialog */}
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