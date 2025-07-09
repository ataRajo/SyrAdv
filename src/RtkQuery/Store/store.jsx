import { configureStore } from "@reduxjs/toolkit";
import { AuthSlice } from "../Slice/Auth/AuthApi";
import { TemplateSlice } from "../Slice/Template/TemplateApi";
import { RoadSignsSlice } from "../Slice/RoadSings/RoadSingsApi";
import { CustomersSlice } from "../Slice/Customers/CustomersApi";
import { SummariesSlice } from "../Slice/Summaries/SummariesApi";
import { BrokersSlice } from "../Slice/Brokers/BrokersApi";
import { UsersSlice } from "../Slice/Users/UsersApi";
import { BookingSlice } from "../Slice/Booking/BookingApi";
import { OrdersSlice } from "../Slice/Orders/OrdersApi";
import { CitiesAndRegionsSlice } from "../Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { ReportSlice } from "../Slice/Report/ReportApi";
import { PaymentsSlice } from "../Slice/Payments/PaymentsApi";

const store = configureStore({
  reducer: {
    [AuthSlice.reducerPath]: AuthSlice.reducer,
    [TemplateSlice.reducerPath]: TemplateSlice.reducer,
    [RoadSignsSlice.reducerPath]: RoadSignsSlice.reducer,
    [CustomersSlice.reducerPath]: CustomersSlice.reducer,
    [UsersSlice.reducerPath]: UsersSlice.reducer,
    [SummariesSlice.reducerPath]: SummariesSlice.reducer,
    [BrokersSlice.reducerPath]: BrokersSlice.reducer,
    [PaymentsSlice.reducerPath]: PaymentsSlice.reducer,
    [BookingSlice.reducerPath]: BookingSlice.reducer,
    [OrdersSlice.reducerPath]: OrdersSlice.reducer,
    [CitiesAndRegionsSlice.reducerPath]: CitiesAndRegionsSlice.reducer,
    [ReportSlice.reducerPath]: ReportSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      AuthSlice.middleware,
      TemplateSlice.middleware,
      RoadSignsSlice.middleware,
      CustomersSlice.middleware,
      UsersSlice.middleware,
      SummariesSlice.middleware,
      BrokersSlice.middleware,
      PaymentsSlice.middleware, 
      BookingSlice.middleware, 
      OrdersSlice.middleware, 
      CitiesAndRegionsSlice.middleware, 
      ReportSlice.middleware
    ),
});

export default store;
