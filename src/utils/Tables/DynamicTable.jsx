import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "../../Context/AuthProvider";
import { Link } from "react-router";
import { useConfirmBookingMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import { toast } from "sonner";

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
};

export const DynamicTable = ({
  data,
  columns,
  isLoading,
  onEdit,
  onEditBooking,
  onDelete,
  onDeleteBooking,
  onShow,
  onConfirmOrder,
  onUnconfirmOrder,
  onRoadSignAction,
  onExchange,
  onExtendBooking,
  onStatusChange,
  className = "",
  permissions,
  hideDeleteIcon = false,
  showTemporaryBookingIcon = false,
  isOrdersTable = false,
  onReceipt ,
}) => {
  const { hasPermission } = useAuth();
  const [confirmBooking, { isLoading: isConfirming }] = useConfirmBookingMutation();

  // Function to handle booking confirmation
  const handleConfirmBooking = async (bookingId) => {
    try {
      const result = await confirmBooking(bookingId).unwrap();
      toast.success("تم تأكيد الحجز وتحويله إلى دائم بنجاح!");
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error(
        error?.data?.message ||
          error?.data?.error ||
          "فشل في تأكيد الحجز. يرجى المحاولة مرة أخرى."
      );
    }
  };

  return (
    <div
      className={`rounded-xl border border-gray-100 dark:border-gray-800 bg-background shadow-sm w-full ${className}`}
    >
      <ScrollArea className="w-full h-[calc(100vh-300px)] relative">
        <Table dir="rtl" className="w-full min-w-max table-auto">
          <TableHeader className="bg-gray-50 dark:bg-gray-800/50 text-center sticky top-0 z-10">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.accessor}
                  className={`font-medium ${
                    column.className || ""
                  } text-center`}
                >
                  {column.header}
                </TableHead>
              ))}
              {(onEdit ||
                onDelete ||
                onShow ||
                onConfirmOrder ||
                onUnconfirmOrder ||
                onRoadSignAction ||
                onExchange ||
                onExtendBooking ||
                onStatusChange ||
                onReceipt || 
                showTemporaryBookingIcon) && (
                <TableHead className="text-center min-w-[120px] sm:min-w-[150px]">
                  الإجراءات
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="text-center">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell
                      key={`${i}-${column.accessor}`}
                      className={`text-center ${column.cellClassName || ""}`}
                    >
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                  {(onEdit ||
                    onDelete ||
                    onShow ||
                    onConfirmOrder ||
                    onUnconfirmOrder ||
                    onRoadSignAction ||
                    onExchange ||
                    onExtendBooking ||
                    onStatusChange ||
                    onReceipt ||
                    onEditBooking ||
                    showTemporaryBookingIcon) && (
                    <TableCell className="text-center">
                      <div className="flex justify-end gap-2">
                        {showTemporaryBookingIcon && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onShow && <Skeleton className="h-8 w-8 rounded-md" />}
                        {onConfirmOrder && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onUnconfirmOrder && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onEdit && <Skeleton className="h-8 w-8 rounded-md" />}
                        {onDelete && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onRoadSignAction && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onExchange && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onExtendBooking && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                        {onStatusChange && (
                          <Skeleton className="h-8 w-8 rounded-md" />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data?.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow
                  key={row.id ?? rowIndex}
                  className="hover:bg-gray-50 text-center dark:hover:bg-gray-800/30"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column.accessor}`}
                      className={`py-2 ${column.cellClassName || ""} text-center`}
                    >
                      {column.cell ? (
                        column.cell({ row })
                      ) : (
                        <div className="flex items-center justify-center text-center">
                          {column.prefixIcon && (
                            <Icon
                              icon={column.prefixIcon}
                              className="mr-2 text-muted-foreground text-center text-sm shrink-0"
                            />
                          )}
                          <span className="truncate max-w-[150px] text-center sm:max-w-[200px]">
                            {column.format
                              ? column.format(
                                  getNestedValue(row, column.accessor),
                                  row
                                )
                              : getNestedValue(row, column.accessor) ?? ""}
                          </span>
                        </div>
                      )}
                    </TableCell>
                  ))}
                  {(onEdit ||
                    onDelete ||
                    onShow ||
                    onConfirmOrder ||
                    onUnconfirmOrder ||
                    onRoadSignAction ||
                    onExchange ||
                    onExtendBooking ||
                    onStatusChange ||
                    showTemporaryBookingIcon) && (
                    <TableCell className="py-2">
                      <div className="flex justify-end gap-2 items-center">
                        {/* Status Change Button - FIXED */}
                        {onStatusChange && 
                          hasPermission(permissions?.updateStatus) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onStatusChange(row)}
                              className="h-7 w-7 p-0 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:hover:bg-purple-900/40"
                              title="تغيير حالة الحجز"
                            >
                              <Icon
                                icon="mdi:swap-vertical"
                                className="text-purple-600 dark:text-purple-400"
                              />
                            </Button>
                          )}

{onReceipt && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => onReceipt(row)}
    className="h-7 w-7 p-0 bg-teal-50 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/20 dark:border-teal-800 dark:hover:bg-teal-900/40"
    title="عرض الوصل"
  >
    <Icon
      icon="mdi:receipt-text"
      className="text-teal-600 dark:text-teal-400"
    />
  </Button>
)}

                        {/* Confirm Booking Button - Show only for temporary bookings (type == 1) */}
                        {showTemporaryBookingIcon && row.type === 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmBooking(row.id)}
                            disabled={isConfirming}
                            className="h-7 w-7 p-0 bg-green-50 border-green-200 hover:bg-green-100"
                            title="تأكيد الحجز (تحويل إلى دائم)"
                          >
                            {isConfirming ? (
                              <Icon
                                icon="mdi:loading"
                                className="text-green-600 animate-spin"
                              />
                            ) : (
                              <Icon
                                icon="mdi:check-circle-outline"
                                className="text-green-600"
                              />
                            )}
                          </Button>
                        )}

                        {onShow && hasPermission(permissions?.show) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onShow(row)}
                            className="h-7 w-7 p-0"
                          >
                            <Icon icon="mdi:eye" className="text-primary" />
                          </Button>
                        )}

                        {(onConfirmOrder || onUnconfirmOrder) && (
                          <>
                            {(row?.status === 0 || row?.is_received === 0) &&
                              onConfirmOrder &&
                              hasPermission(permissions?.confirm) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onConfirmOrder(row)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Icon
                                    icon="mdi:check-circle-outline"
                                    className="text-green-500"
                                  />
                                </Button>
                              )}

                            {/* Pause/Unconfirm Button - REMOVED only from booking table */}
                            {/* Remove this button when showTemporaryBookingIcon is true (booking table) */}
                            {!showTemporaryBookingIcon && (row.status === 1 || row?.status === 2) &&
                              onUnconfirmOrder &&
                              hasPermission(permissions?.unConfirm) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onUnconfirmOrder(row)}
                                  className="h-7 w-7 p-0 bg-transparent "
                                  title="إيقاف مؤقت للحجز"
                                >
                                  <Icon
                                    icon="mdi:pause-circle-outline"
                                    className="text-yellow-600 dark:text-yellow-400"
                                  />
                                </Button>
                              )}
                          </>
                        )}

                        {/* Edit Button - Show in all tables EXCEPT booking table */}
                        {onEdit && hasPermission(permissions?.edit) && !showTemporaryBookingIcon && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(row)}
                            className="h-7 w-7 p-0"
                          >
                            <Icon icon="mdi:pencil" className="text-primary" />
                          </Button>
                        )}

                    {/* Edit Booking Button */}
{onEditBooking && hasPermission(permissions?.edit) && row?.status == 1 && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => onEditBooking(row)}
    className="h-7 w-7 p-0 bg-blue-50 border-blue-200 hover:bg-blue-100"
    title="تعديل الحجز"
  >
    <Icon icon="mdi:calendar-edit" className="text-blue-600" />
  </Button>
)}

                        {onDelete &&
                          !hideDeleteIcon &&
                          hasPermission(permissions?.delete) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Icon icon="mdi:trash" />
                            </Button>
                          )}

                        {onDeleteBooking &&
                          !hideDeleteIcon &&
                          hasPermission(permissions?.delete) &&
                          row?.status == 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteBooking(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Icon icon="mdi:trash" />
                            </Button>
                          )}

                        {onExchange &&
                          hasPermission(permissions?.exchange) &&
                          row.bookings &&
                          row.bookings.length > 0 &&
                          row.bookings.some(
                            (booking) => booking.status === 1
                          ) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onExchange(row)}
                              className="h-7 w-7 p-0 bg-purple-50 border-purple-200 hover:bg-purple-100"
                              title="تبديل الموقع - هذه اللوحة تحتوي على حجوزات نشطة"
                            >
                              <Icon
                                icon="mdi:swap-horizontal"
                                className="text-purple-600"
                              />
                            </Button>
                          )}

                        {onRoadSignAction && (
                          <Link
                            to={`/dashboard/road_signs/${row.id}/stats`}
                            state={{ roadSign: row }}
                          >
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => onRoadSignAction(row)}
                              className="h-7 w-7 p-0 bg-blue-50 border-blue-200"
                              title="Road Sign Action"
                            >
                              <Icon
                                icon="mdi:road"
                                className="text-blue-600"
                              />
                            </Button>
                          </Link>
                        )}
                        
                        {onExtendBooking && 
                          !isOrdersTable &&
                          (hasPermission(permissions?.extend) || true) &&
                          row?.approvement_status === 2 &&
                          [2].includes(row?.type) &&  
                          new Date(row.end_date) > new Date() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onExtendBooking(row)}
                              className="h-7 w-7 p-0 bg-orange-50 border-orange-200 hover:bg-orange-100"
                              title="تمديد الحجز"
                            >
                              <Icon
                                icon="mdi:calendar-plus"
                                className="text-orange-600"
                              />
                            </Button>
                          )}

                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (onEdit ||
                      onDelete ||
                      onShow ||
                      onConfirmOrder ||
                      onUnconfirmOrder ||
                      onRoadSignAction ||
                      onExchange ||
                      onExtendBooking ||
                      onStatusChange ||
                      onReceipt ||
                      showTemporaryBookingIcon
                      ? 1
                      : 0)
                  }
                  className="h-24 text-center"
                >
                  لا يوجد بيانات متوفرة{" "}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" className="h-2" />
        <ScrollBar orientation="vertical" className="w-2" />
      </ScrollArea>
    </div>
  );
};