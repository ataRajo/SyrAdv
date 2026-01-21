import {
  IconDashboard,
  IconUsers,
  IconUsersGroup,
  IconCalendarEvent,
  IconCash,
  IconTemplate,
  IconRoad,
  IconReceipt , 
  
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
  2: "مقبول",
  3: "مرفوض",
  //4: "ملغى",

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
  
  ViewPrice: "view-price",
  CreatePrice: "create-price",
  EditPrice: "edit-price",
  DeletePrice: "delete-price",


  ExtendBookings: "extend-bookings",

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
    // Add this to indicate it can have notifications
    hasNotifications: true,
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
    title: "  الخرائط و اللوحات الطرقية",
    url: "/dashboard/road_signs",
    icon: IconRoad,
    permission: Permissions.ViewRoadSigns,
  },
  {
    title: "سعر الطباعة",
    url: "/dashboard/PrintPrice",
    icon: IconReceipt, 
    permission: Permissions.ViewRegions, 
  },
];

export const navLinksAdministrationPage = [
  {
    to: "",
    text: "الاحصائيات",
    mobileText: "الرئيسية",
    permission: "view-road-signs", // 
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
    permission: Permissions.ViewFinancials,
  },
  {
    to: "brokers",
    text: "  الوسيط",
    mobileText: "الوسيط ",
    permission: Permissions.ViewBrokers,
  },
  
  /*
  {
    to: "notifications",
    text: "  الإشعارات",
    mobileText: "الإشعارات",
    permission: Permissions.ViewRegions, //      
    isModal: true,
  },
  */
];


export const periodOptions = [
  { value: 1, label: "فترة واحدة (14 يوم)" },
  { value: 2, label: "2 فترة (28 يوم)" },
  { value: 3, label: "3 فترة (42 يوم)" },
  { value: 4, label: "4 فترة (56 يوم)" },
  { value: 5, label: "5 فترة (70 يوم)" },
  { value: 6, label: "6 فترة (84 يوم)" },
  { value: 7, label: "7 فترة (98 يوم)" },
  { value: 8, label: "8 فترة (112 يوم)" },
  { value: 9, label: "9 فترة (126 يوم)" },
  { value: 10, label: "10 فترة (140 يوم)" },
  { value: 11, label: "11 فترة (154 يوم)" },
  { value: 12, label: "12 فترة (168 يوم)" },
  { value: 13, label: "13 فترة (182 يوم)" },
  { value: 14, label: "14 فترة (196 يوم)" },
  { value: 15, label: "15 فترة (210 يوم)" },
  { value: 16, label: "16 فترة (224 يوم)" },
  { value: 17, label: "17 فترة (238 يوم)" },
  { value: 18, label: "18 فترة (252 يوم)" },
  { value: 19, label: "19 فترة (266 يوم)" },
  { value: 20, label: "20 فترة (280 يوم)" },
  { value: 21, label: "21 فترة (294 يوم)" },
  { value: 22, label: "22 فترة (308 يوم)" },
  { value: 23, label: "23 فترة (322 يوم)" },
  { value: 24, label: "24 فترة (336 يوم)" },
];
