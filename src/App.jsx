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

function App() {
  return (
    <div className="bg-primary">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<DashboardPage />}>
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

              <Route path="box" element={<Box />} />
              <Route path="brokers" element={<BrokersPage />} />

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

            <Route path="bookings" element={<BookingPage />} />
            <Route path="booking/add" element={<BookingForm />} />
            <Route
              path="booking/edit/:id"
              element={<BookingForm bookingId={1} />}
            />

            <Route path="booking/:id" element={<ContractPage />} />
            <Route path="brokers" element={<BrokersPage />} />

            <Route path="regions-city" element={<RegionsCityPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
