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
import { MediatorSlice } from "../Slice/mediatorapis/MediatorApi"; // ADDED
import {WorkTypesSlice} from "../Slice/WorkTypesApi/WorkTypesApi"
import {offersApiSlice} from "../Slice/Offers/offersApiSlice"
import { SearchSlice } from "../Slice/SearchApi/SearchApi";
import {accountingApi} from "../Slice/Accounting/AccountingApi"
import {bookingDocumentsApi} from "../Slice/Bookings/BookingDocumentsApi"
import { workshopsApi } from "../Slice/Workshops/WorkshopsApi"
import { whatsappApiSlice } from "../Slice/Whatsapp/WhatsappApi"
import { publicContactApiSlice } from "../Slice/Public/PublicContactApi"
import { WhatsappSettingsSlice } from "../Slice/Whatsapp/WhatsappSettingsApi"
import { WhatsappBulkSlice } from "../Slice/Whatsapp/WhatsappBulkApi"

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
    [ReportSlice.reducerPath]: ReportSlice.reducer ,
    [MediatorSlice.reducerPath]: MediatorSlice.reducer, 
    [WorkTypesSlice.reducerPath] :WorkTypesSlice.reducer , 
    [offersApiSlice.reducerPath] :offersApiSlice.reducer ,
    [SearchSlice.reducerPath]: SearchSlice.reducer,
    [accountingApi.reducerPath] :accountingApi.reducer ,
    [bookingDocumentsApi.reducerPath]:bookingDocumentsApi.reducer,
    [workshopsApi.reducerPath]: workshopsApi.reducer,
    [whatsappApiSlice.reducerPath]: whatsappApiSlice.reducer,
    [publicContactApiSlice.reducerPath]: publicContactApiSlice.reducer,
    [WhatsappSettingsSlice.reducerPath]: WhatsappSettingsSlice.reducer,
    [WhatsappBulkSlice.reducerPath]: WhatsappBulkSlice.reducer

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
      ReportSlice.middleware , 
      MediatorSlice.middleware ,
      WorkTypesSlice.middleware , 
      offersApiSlice.middleware ,
      SearchSlice.middleware,
      accountingApi.middleware, 
      bookingDocumentsApi.middleware,
      workshopsApi.middleware,
      whatsappApiSlice.middleware,
      publicContactApiSlice.middleware,
      WhatsappSettingsSlice.middleware,
      WhatsappBulkSlice.middleware
    ),
});

export default store;
