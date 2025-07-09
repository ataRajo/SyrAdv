import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BoxColumns } from "../../utils/Tables/ColumnsTable/BoxColumns";
import useMangePayments from "../../hooks/useMangePayments";

const Box = () => {
  const { dataBox, fromDate, setFromDate, toDate, setToDate, isFetchingBox } =
    useMangePayments();

  return (
    <div>
      {/* Date Filter */}
      <div className="flex justify-between items-center gap-3 mb-5">
        <div className="flex flex-col flex-1">
          <label className="mb-2 text-sm font-medium text-foreground">
            {" "}
            من{" "}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>

        <div className="flex flex-col flex-1 ">
          <label className="mb-2 text-sm font-medium text-foreground">
            إلى{" "}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>
      </div>
      <DynamicTable
        data={dataBox}
        isLoading={isFetchingBox}
        columns={BoxColumns}
      />
    </div>
  );
};

export default Box;
