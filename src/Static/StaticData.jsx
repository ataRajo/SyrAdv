import {
  IconDashboard,
  IconUsers,
  IconUsersGroup,
  IconCalendarEvent,
  IconCash,
  IconTemplate,
  IconRoad,
} from "@tabler/icons-react";

export const BookingType = {
  1: "مؤقت",
  2: "دائم",
};

export const typeOptions = [
  { value: 1, label: "مؤقت" },
  { value: 2, label: "دائم" },
];

export const productTypeOptions = [
  { value: 1, label: "محلي" },
  { value: 2, label: "أجنبي" },
  { value: 3, label: "محلي اجنبي" },
];

export const statusBookings = {
  1: "قيد المعالجة",
  2: "مركب",
  3: "منتهي",
  4: "ملغى",

};

export const productTypeMap = {
  1: "محلي",
  2: "أجنبي",
  3: "كلاهما",
};

export const isAvailableRoadSign = [
  { id: "1", name: "متاح" },
  { id: "0", name: "غير متاح" },
];

export const Permissions = {
  CreateBookings: "create-bookings",
  CreateBrokers: "create-brokers",
  CreateCities: "create-cities",
  CreateCustomers: "create-customers",
  // CreateOrders: "create-orders",
  CreatePayments: "create-payments",
  CreateProducts: "create-products",
  CreateRegions: "create-regions",
  CreateRoadSigns: "create-road-signs",
  CreateTemplates: "create-templates",
  CreateUsers: "create-users",

  DeleteBrokers: "delete-brokers",
  DeleteCities: "delete-cities",
  DeleteCustomers: "delete-customers",
  DeleteRegions: "delete-regions",
  DeleteRoadSigns: "delete-road-signs",
  DeleteTemplates: "delete-templates",
  DeleteUsers: "delete-users",
  DeleteBookings: "delete-bookings",
  DeletePayments: "delete-payments",



  EditBookings: "edit-bookings",
  EditBrokers: "edit-brokers",
  EditCities: "edit-cities",
  EditCustomers: "edit-customers",
  EditOrders: "edit-orders", 
  EditPayments: "edit-payments",
  EditRegions: "edit-regions",
  EditRoadSigns: "edit-road-signs",
  EditTemplates: "edit-templates",
  EditUsers: "edit-users",

  ViewBookings: "view-bookings",
  ViewBrokers: "view-brokers",
  ViewCities: "view-cities", //
  ViewCustomers: "view-customers", //
  ViewOrders: "view-orders", //
  ViewPayments: "view-payments", //
  ViewRegions: "view-regions", //
  ViewRoadSigns: "view-road-signs",
  ViewTemplates: "view-templates",
  ViewUsers: "view-users",
  ViewFinancials: "view-financials",
};

export const navLinkSidebar = [
  {
    title: "الإدارة",
    url: "/dashboard/administration-page",
    icon: IconDashboard,
    permission: "view-road-signs",
  },
  {
    title: "الموظفين",
    url: "/dashboard/users",
    icon: IconUsers,
    permission: Permissions.ViewUsers,
  },
  {
    title: "الزبائن",
    url: "/dashboard/customers",
    icon: IconUsersGroup,
    permission: Permissions.ViewCustomers,
  },
  {
    title: "الحجوزات",
    url: "/dashboard/bookings",
    icon: IconCalendarEvent,
    permission: Permissions.ViewBookings,
  },
  {
    title: "الدفعات",
    url: "/dashboard/payments",
    icon: IconCash,
    permission: Permissions.ViewPayments,

  },
  {
    title: "النماذج",
    url: "/dashboard/models",
    icon: IconTemplate,
    permission: Permissions.ViewTemplates,
  },
  {
    title: "اللوحات الطرقية",
    url: "/dashboard/road_signs",
    icon: IconRoad,
    permission: Permissions.ViewRoadSigns,
  },
];

export const navLinksAdministrationPage = [
  {
    to: "",
    text: "الاحصائيات",
    mobileText: "الرئيسية",
    permission: "view-road-signs",
  },
  {
    to: "orders",
    text: " الطلبات",
    mobileText: "الطلبات",
    permission: Permissions.ViewOrders,
  },
  {
    to: "payments",
    text: "  الدفعات",
    mobileText: "الدفعات ",
    permission: Permissions.ViewPayments,
  },
  {
    to: "regions-city",
    text: "المناطق والمدن",
    mobileText: "المناطق",
    permission: Permissions.ViewCities,
  },

  {
    to: "report",
    text: " تقرير لوحات الزبائن",
    mobileText: "التقرير الزبائن",
    permission: "view-road-signs",
  },
  {
    to: "roadSignReports",
    text: "  التقرير الاسبوعي",
    mobileText: " التقرير الاسبوعي",
    permission: "view-road-signs",
    
  },
  {
    to: "box",
    text: "  الصندوق",
    mobileText: "الصندوق ",
    permission: "view-payments",
  },
  {
    to: "brokers",
    text: "  الوسيط",
    mobileText: "الوسيط ",
    permission: Permissions.ViewBrokers,
  },
];


// Define period options based on number of periods (e.g., 1 period = 28 days, 2 periods = 56 days)
export const periodOptions = [
  { value: 1, label: "فترة واحدة (28 يوم)" },
  { value: 2, label: "2 فترة (56 يوم)" },
  { value: 3, label: "3 فترة (84 يوم)" },
  { value: 4, label: "4 فترة (112 يوم)" },
  { value: 5, label: "5 فترة (140 يوم)" },
  { value: 6, label: "6 فترة (168 يوم)" },
  { value: 7, label: "7 فترة (196 يوم)" },
  { value: 8, label: "8 فترة (224 يوم)" },
  { value: 9, label: "9 فترة (252 يوم)" },
  { value: 10, label: "10 فترة (280 يوم)" },
  { value: 11, label: "11 فترة (308 يوم)" },
  { value: 12, label: "12 فترة (336 يوم)" },
];