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
            <Route path="bookings/:bookingId" element={<BookingDetails />} />
            <Route path="booking/add" element={<BookingForm />} />
            <Route
              path="booking/edit/:id"
              element={<BookingForm bookingId={1} />}
            />

            <Route path="booking/:id" element={<ContractPage />} />
            <Route path="booking/design/:id" element={<BookingDesignChange />} />
            
            <Route path="brokers" element={<BrokersPage />} />



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

          </Route>
        </Routes>
      </ErrorBoundary>

      </BrowserRouter>

    </div>
  );
}

export default App;
