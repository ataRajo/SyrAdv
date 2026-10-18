import "./App.css";
import { Login } from "./Pages/Auth/Login";
import { BrowserRouter, Route, Routes } from "react-router";
import DashboardPage from "./Layout/DashboardPage";
import AdministrationPageLayout from "./Layout/AdministrationPageLayout";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import UsersPage from "./Pages/Users/UsersPage";
import CustomersPage from "./Pages/Customers/CustomersPage";
import TemplatesPage from "./Pages/Template/TemplatesPage";
import TableTemplate from "./Components/Templates/TableTemplate";
import CustomerInfo from "./Components/Customers/CustomerInfo";
import BrokersPage from "./Pages/BrokersPage/BrokersPage";
import UserInfo from "./Pages/Users/UserInfo";
import RoadSignsPage from "./Pages/RoadSigns/RoadSignsPage";
import PaymentsPages from "./Pages/Payments/PaymentsPages";
import BookingPage from "./Pages/Booking/BookingPage";
import OrdersPage from "./Pages/Orders/OrdersPage";
import RegionsCityPage from "./Pages/RegionsCity/RegionsCityPage";
import SummariesPage from "./Pages/Summaries/SummariesPage";
import ContractPage from "./Components/Booking/ContractPage";
import ReportsPage from "./Pages/Reports/ReportsPage";
import BookingForm from "./Pages/Booking/BookingForm";
import TableRoadSigns from "./Components/RoadSigns/TableRoadSigns";
import Box from "./Pages/Payments/Box";
import AccountingPanel from "./Components/Accounting/AccountingPanel";
import RoadSignsReport from "./Components/Report/RoadSignsReport";
import BrokerInfo from "./Components/Brokers/BrokerInfo";
import RoadSignStats from "./Components/RoadSigns/RoadSignStats/RoadSignStats";

import axios from "axios";
import ExtendBooking from "./Components/Booking/ExtendBooking/ExtendBooking";
import LandingPage from "./Pages/LandingPage/LandingPage";
import PrintPrice from "./Components/PrintPrice/PrintPrice"
import ErrorBoundary from "./ErrorBoundary";
import AdminAi from "./Ai/AdminAi";
import BookingDetails from "./Pages/Booking/BookingDetails";
import RoadSignStatstics from "./Components/RoadSigns/Statstics/RoadSignStatstics";
import ContractMapPage from "./Components/Booking/ContractMapPage";
import PublicMapPage from "./Components/Booking/ContractMapPage";
import RoadSignsSelectionMap from "./Components/Booking/RoadSignsSelectionMap";
import Precentage from "./Pages/precentage/Precentage";
import DigitalScreens from "./Pages/DigitalScreens/DigitalScreens";
import CampaignsPage from "./Pages/campaign/CampaignsPage";
import {BrokerLogin} from "./Pages/BrokerLogin/BrokerLogin"
import { BrokerWelcome } from "./Pages/Broker/BrokerWelcome";
import { BrokerClients } from "./Pages/Broker/BrokerClients";
import { CitiesRegions } from "./Pages/Broker/CitiesRegions";
import { MapBroker } from "./Pages/Broker/MapBroker";
import {CreateBrokerBooking} from "./Pages/Broker/CreateBrokerBooking"
import { BrokerBookings } from "./Pages/Broker/BrokerBookings";
import { Toaster } from "react-hot-toast";
import WorkTypePage from "./Pages/WorkTypesPage/WorkTypesPage"
import OffersPage from "./Pages/offers/OffersPage";
import BookingDesignChange from "./Pages/Booking/BookingDesignChange";
import SearchInput from "./Pages/SearchInput/SearchInput"
import SummaryBookings from "./Components/Customers/SummaryBookings";
import WorkshopsPanel from "./Components/Workshops/WorkshopsPanel";
import SuppliersPage from "./Pages/Suppliers/SuppliersPage"
import WhatsappSettingsPage from "./Pages/Settings/WhatsappSettingsPage"
import WhatsappBulkMessagesPage from "./Pages/Settings/WhatsappBulkMessagesPage"
import RoadSignEvaluationsPage from "./Pages/Settings/RoadSignEvaluationsPage"
// ميزة "الخطط الإعلانية" (طلب صريح): إدارة الخطط من طرف الموظف + صفحة عامة
// بلا تسجيل دخول (/plans/:token) يفتحها الزبون عبر الرابط المُرسَل له -
// راجع Pages/AdvertisingPlans لكل الملفات.
import AdvertisingPlansPage from "./Pages/AdvertisingPlans/AdvertisingPlansPage"
import AdvertisingPlanForm from "./Pages/AdvertisingPlans/AdvertisingPlanForm"
import AdvertisingPlanDetails from "./Pages/AdvertisingPlans/AdvertisingPlanDetails"
import PublicAdvertisingPlanView from "./Pages/AdvertisingPlans/PublicAdvertisingPlanView"
function App() {

  axios.defaults.baseURL = "/api"; // goes through Vite proxy
  axios.defaults.headers.common["Content-Type"] = "application/json";

  return (
    <div className="bg-primary">

      
      <Toaster position="top-center" reverseOrder={false} />

      <BrowserRouter>
      <ErrorBoundary>

        <Routes>

{/*-------PUBLIC ROUTES HERE  -------*/ }


          <Route path="/Login" element={<Login />} />
          <Route path="/" element={<LandingPage />} />
         <Route path="public-map/:id" element={<PublicMapPage />} />
         <Route path="public-signs-map" element={<RoadSignsSelectionMap isPublic />} />
         <Route path="public-signs-map/:code" element={<RoadSignsSelectionMap isPublic />} />
         {/* رابط عام (بلا تسجيل دخول) لعرض خطة إعلانية واحدة أو أكثر أُرسلت
             للزبون - راجع PublicAdvertisingPlanView.jsx وSharePlanDialog.jsx
             (زر "مشاركة مع الزبون" في صفحات الخطط الإعلانية) */}
         <Route path="plans/:token" element={<PublicAdvertisingPlanView />} />

{/*----BROKER ROUTES----*/}

    
        <Route path="/broker/login" element ={<BrokerLogin />} />
        <Route path="/broker/welcome" element ={<BrokerWelcome />} />
<Route path="/broker/clients" element={<BrokerClients />} />
<Route path="/broker/cities-regions" element={<CitiesRegions />} />
<Route path="/broker/map" element={<MapBroker />} />           
<Route path="/broker/bookings/create" element={<CreateBrokerBooking/>} />
<Route path="/broker/bookings" element={<BrokerBookings />} />


{/**----------*/}

          <Route path="/dashboard" element={<DashboardPage />}>
          <Route path="work-types" element={<WorkTypePage />} />
          <Route path="offers" element={<OffersPage />} />
          {/* لوحة تحكم السوبر أدمن بإشعارات واتساب + الرسائل الجماعية (طلب
              صريح) - الحماية الفعلية على مستوى الباك-إند
              (RoleMiddleware::using('super admin') في كل من
              WhatsappSettingsController وWhatsappBulkController)، نفس نمط
              بقية صفحات المشروع (لا حراسة أدوار على مستوى الراوتر هنا أصلًا). */}
          <Route path="settings/whatsapp" element={<WhatsappSettingsPage />} />
          <Route path="settings/whatsapp-bulk" element={<WhatsappBulkMessagesPage />} />
          {/* تقييم اللوحات بالذكاء الاصطناعي (مشاهدة + جمهور متوقع) - سوبر أدمن؛
              الحماية الفعلية في RoadSignEvaluationController على الباك-إند. */}
          <Route path="settings/road-sign-evaluations" element={<RoadSignEvaluationsPage />} />

  <Route path="search" element={<SearchInput />} />


            <Route
              path="administration-page"
              element={<AdministrationPageLayout />}
            >
              <Route index element={<SummariesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="payments" element={<PaymentsPages />} />
              <Route path="regions-city" element={<RegionsCityPage />} />

              <Route path="report" element={<ReportsPage />} />
              <Route path="roadSignReports" element={<RoadSignsReport />} />
              {/*
              <Route path="road_signs/:id/stats" element={<RoadSignStats />} />

              */ }

              

              <Route path="box" element={<Box />} />
              <Route path="accounting" element={<AccountingPanel />} />
              <Route path="brokers" element={<BrokersPage />} />
              <Route path="brokers/:id" element={<BrokerInfo />} />


            </Route>
            <Route path="payments" element={<PaymentsPages />} />

            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserInfo />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerInfo />} />
            <Route path="models" element={<TemplatesPage />} />
            <Route path="models/:id" element={<TableTemplate />} />
            <Route path="road_signs" element={<RoadSignsPage />} />
            <Route path="road_signs/:id" element={<TableRoadSigns />} />
            

            {/*
            
            */}
            <Route path="road_signs/:id/stats" element={<RoadSignStats />} />

            {/*<Route path="road_signs/:id/stats" element={<RoadSignStats />} />*/}

            <Route path="bookings" element={<BookingPage />} />
            <Route path="bookings/summary" element={<SummaryBookings />} />  {/* ✅ ADD THIS LINE */}

            {/* ميزة "الخطط الإعلانية" (طلب صريح) - قائمة/إنشاء/تعديل/عرض
                خطة، راجع Pages/AdvertisingPlans */}
            <Route path="advertising-plans" element={<AdvertisingPlansPage />} />
            <Route path="advertising-plans/add" element={<AdvertisingPlanForm />} />
            <Route path="advertising-plans/edit/:id" element={<AdvertisingPlanForm />} />
            <Route path="advertising-plans/:id" element={<AdvertisingPlanDetails />} />

            <Route path="bookings/:bookingId" element={<BookingDetails />} />
            <Route path="booking/add" element={<BookingForm />} />
            <Route
              path="booking/edit/:id"
              element={<BookingForm bookingId={1} />}
            />
            {/* صفحة "عرض على الخريطة" - تُفتح من زر بنفس الاسم بجانب أزرار
                تصدير PDF / Word في جدول اللوحات ضمن صفحة إضافة/تعديل الحجز
                (BookingTable.jsx)، وتعرض دبابيس لمواقع اللوحات المعروضة
                حالياً (لا تتطلب bookingId محفوظ مسبقاً). */}
            <Route
              path="booking/road-signs-map"
              element={<RoadSignsSelectionMap />}
            />

            <Route path="booking/:id" element={<ContractPage />} />
            <Route path="booking/design/:id" element={<BookingDesignChange />} />
            
            <Route path="brokers" element={<BrokersPage />} />

            <Route path="suppliers" element={<SuppliersPage />} />

            <Route path="regions-city" element={<RegionsCityPage />} />
            <Route path="profile" element={<ProfilePage />} />

            
              {/*New Routes*/}

              <Route path="booking/extend/:id" element={<ExtendBooking />} />
              <Route path ='/dashboard/PrintPrice' element ={<PrintPrice />} />
             <Route path ='/dashboard/administration-page/Ai' element ={<AdminAi />} />
            <Route path="Statistics" element={<RoadSignStatstics />} />
            <Route path ="precentage" element ={<Precentage />} />
            <Route path = "digital-screens" element={<DigitalScreens />} />
            <Route path = "campaigns" element={<CampaignsPage />} />
            <Route path="workshops" element={<WorkshopsPanel />} />

          </Route>
        </Routes>
      </ErrorBoundary>

      </BrowserRouter>

    </div>
  );
}

export default App;
