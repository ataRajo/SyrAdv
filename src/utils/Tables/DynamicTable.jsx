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

// Utility function to access nested properties
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
  className = "",
  permissions,
}) => {
  const { hasPermission } = useAuth();

  return (
    <div
      className={`rounded-xl border border-gray-100 dark:border-gray-800 bg-background shadow-sm w-full ${className}`}
    >
      <ScrollArea className="w-full  h-[calc(100vh-300px)] relative">
        <Table dir="rtl" className="w-full  min-w-max table-auto">
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
                onUnconfirmOrder) && (
                <TableHead className="text-center min-w-[120px] sm:min-w-[150px]">
                  Actions
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
                    onUnconfirmOrder) && (
                    <TableCell className="text-center">
                      <div className="flex justify-end gap-2">
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
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data?.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="hover:bg-gray-50 text-center dark:hover:bg-gray-800/30"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column.accessor}`}
                      className={`py-2 ${
                        column.cellClassName || ""
                      } text-center`}
                    >
                      <div className="flex items-center text-center">
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
                    </TableCell>
                  ))}
                  {(onEdit ||
                    onDelete ||
                    onShow ||
                    onConfirmOrder ||
                    onUnconfirmOrder) && (
                    <TableCell className="py-2">
                      <div className="flex justify-end gap-2">
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
                            {(row?.status === 0 || row?.is_received === 0 ) &&
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
                            {(row.status === 1 || row?.status === 2) &&
                              onUnconfirmOrder &&
                              hasPermission(permissions?.unConfirm) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onUnconfirmOrder(row)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Icon
                                    icon="mdi:close-circle-outline"
                                    className="text-red-500"
                                  />
                                </Button>
                              )}
                          </>
                        )}
                        {onEdit  && hasPermission(permissions?.edit) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(row)}
                            className="h-7 w-7 p-0"
                          >
                            <Icon icon="mdi:pencil" className="text-primary" />
                          </Button>
                        )}

                        {onEditBooking &&
                          hasPermission(permissions?.edit) &&
                          row?.status == 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditBooking(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Icon
                                icon="mdi:pencil"
                                className="text-primary"
                              />
                            </Button>
                          )}

                        {onDelete && hasPermission(permissions?.delete) && (
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
                          hasPermission(permissions?.delete) &&
                          row?.status == 1  && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteBooking(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Icon icon="mdi:trash" />
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
                    onUnconfirmOrder
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
