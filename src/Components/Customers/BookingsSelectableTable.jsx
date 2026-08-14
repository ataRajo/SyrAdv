import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BookingCustomerColumns } from "../../utils/Tables/ColumnsTable/BookingByCustomerColumns";
import { Permissions } from "../../Static/StaticData";

const BookingsSelectableTable = ({
  data,
  isLoading,
  pdfMode,
  selectedIds,
  onToggleSelect,
  onShow,
}) => {
  const columns = pdfMode
    ? [
        {
          header: "",
          accessor: "id",
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onChange={() => onToggleSelect(row.id)}
              className="w-4 h-4 cursor-pointer accent-purple-600"
            />
          ),
          className: "w-10",
        },
        ...BookingCustomerColumns,
      ]
    : BookingCustomerColumns;

  return (
    <DynamicTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onShow={onShow}
      permissions={{ show: Permissions.ViewBookings }}
    />
  );
};

export default BookingsSelectableTable;