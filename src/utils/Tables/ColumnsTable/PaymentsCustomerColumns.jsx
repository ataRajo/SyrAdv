
  export const PaymentsCustomerColumns = [
    {
      header: "المبلغ الكلي",
      accessor: "total",
      prefixIcon: "mdi:currency-usd",
      format: (value) => `$${parseFloat(value).toFixed(2)}`,
      className: "text-right min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
      cellClassName: "text-right font-mono",
      priority: 2,
    },
    {
      header: "المبلغ المدفوع",
      accessor: "paid",
      prefixIcon: "mdi:currency-usd",
      format: (value) => `$${parseFloat(value).toFixed(2)}`,
      className: "text-right min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
      cellClassName: "text-right font-mono",
      priority: 3,
    },
    {
      header: "المبلغ الباقي",
      accessor: "remaining",
      prefixIcon: "mdi:currency-usd",
      format: (value) => `$${parseFloat(value).toFixed(2)}`,
      className: "text-right min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
      cellClassName: "text-right font-mono",
      priority: 4,
    },
    {
      header: "التاريخ",
      accessor: "date",
      prefixIcon: "mdi:calendar",
      className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
      priority: 5,
    },
    {
      header: "الموظف",
      accessor: "user.full_name",
      prefixIcon: "mdi:account-outline",
      className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
      priority: 5,
    },
  ];