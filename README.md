# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.






# Road Signs Management System - Project Documentation

## 📋 Project Overview

A comprehensive system for managing advertising road signs, bookings, contracts, and reporting with modern React, RTK Query, and Firebase integration.

## 🗂️ Project Structure & Key Components

### 🎯 Core Pages

#### **ContractPage.jsx**
- **Purpose**: Manages both temporary and permanent contracts for bookings
- **Features**:
  - Full orders container
  - Contract lifecycle management
  - Dual contract type support (temporary/permanent)

#### **DynamicDialog.jsx**
- **Critical Role**: Handles ALL create and add operations
- **Features**:
  - Modal/dialog management
  - Form creation and validation
  - Unified interface for data entry operations

#### **RoadSignsReport.jsx** 
- **Purpose**: Comprehensive reporting system for road signs
- **Features**:
  - Weekly report generation
  - Detailed sign status reporting (available/booked)
  - Advanced filtering (city, region, template, customer)
  - PDF/Word export functionality
  - Pagination and data visualization

### 📊 Data Display Components

#### **DynamicTable.jsx**
- **Central Component**: Universal table component for all data display
- **Features**:
  - Dynamic column configuration
  - Icon integration
  - Full behavior control
  - Reusable across entire application

#### **RoadSignMapView.jsx**
- **Visual Component**: Satellite map display with road sign markers
- **Features**:
  - Geolocation-based sign display
  - Status-based color coding
  - Interactive markers

#### **CartTable.jsx**
- **Booking Component**: Shopping cart-like interface for reservations
- **Integration**: Works with BookingContext for state management

### 🔧 Configuration & Static Data

#### **StaticData.jsx**
- **Repository**: All constant and static application data
- **Contains**:
  - Advertising cycles
  - Product types (`productTypeOptions`)
  - Other enumerations and constants

#### **Column Definition Files**
- **Purpose**: Define table structures and attributes
- **Examples**:
  - `RoadSignColumns.jsx` - Road sign table definitions
  - `BookingColumns.jsx` - Booking table definitions

### 🔌 API Layer

#### **RTK Query Folder Structure**




### 📄 Forms & Validation

#### **Schema Files**
- **Technology**: Yup validation
- **Purpose**: Input validation rules
- **Usage**: Form validation across all data entry components

### 🤖 Interactive Components

#### **ExtendBooking.jsx**
- **Purpose**: Contract extension management
- **Integration**: Icon-based actions within DynamicTable

#### **PrintPrice.jsx**
- **Purpose**: Price calculation and printing
- **Features**: Dedicated API integration for pricing

#### **ChatInterface.jsx**
- **Location**: `LandingPage/` folder
- **Purpose**: Chatbot interface management

### 🔐 Authentication System

#### **Authentication Components**
- **AuthProvider.jsx**: Main authentication provider
- **Global.jsx**: Global authentication state
- **Login.jsx**: Login interface
- **Legacy Issue**: Resolves prior user recognition problems

### 🔥 Firebase Integration

#### **Firebase Files**
- **firebase.js**: Firebase initialization
- **firebase-messaging.js**: Notification reception
- **Purpose**: Push notifications and real-time features

### 🏠 Landing Pages

#### **LandingPage Folder**
- Contains multiple JSX files for different landing page sections
- Modular section-based architecture

## 🔄 Key Data Flows

### 1. **Report Generation Flow** (RoadSignsReport.jsx)


### 2. **Booking Management Flow**


### 3. **Authentication Flow**

## 4 . ** ExtendBooking **
BookingInfoCard.jsx → Display booking information only
ExtendBookingForm.jsx → Handle form interactions only
MoveSignDialog.jsx → Manage sign moving dialog only

## 🛠️ Technical Stack

- **Frontend**: React with Hooks (useState, useEffect, useMemo, useRef)
- **State Management**: RTK Query for server state
- **UI Components**: Custom component library with Lucide React icons
- **Validation**: Yup schema validation
- **Maps**: Integrated map components (ReactLeaflet)
- **Notifications**: Firebase Cloud Messaging
- **Export**: HTML/CSS to PDF/Word conversion
- **Styling**: Tailwind CSS with dark and light mode support



## 📁 Important File Relationships

### **RoadSignsReport.jsx Dependencies**:
display all the roadsigns that booked and unbooked
and put a props for distinction between the weekly report and roadsigns details

### **DynamicTable.jsx Usage**:
- Used by: ContractPage, RoadSignsReport, and all listing pages
- Configurable via: Column Definition Files

## 🎨 Styling & Themes

- **Framework**: Tailwind CSS
- **Theme**: Support for light/dark modes
- **Icons**: Lucide React icon set
- **Tables**: Custom-styled with hover effects and status colors

## 🔍 Filtering System (RoadSignsReport.jsx Example)

The system implements multi-level filtering:

1. **Date Range**: For weekly reports
2. **Geographic**: City → Region hierarchy
3. **Content**: Template/model filtering
4. **Customer**: Client-specific filtering
5. **Status**: Available vs. Booked signs

## 📤 Export Features

### **PDF Export**:
- Weekly reports with customer grouping
- Detailed reports with status indicators
- Professional Arabic-styled layouts

### **Word Export**:
- Formatted document generation
- Comprehensive data tables
- Branded headers and footers

## ⚠️ Important Notes

1. **Authentication**: Always use AuthProvider for protected routes
2. **Tables**: Use DynamicTable for consistent data presentation
3. **APIs**: All server calls go through RTK Query slices
4. **Forms**: Validate with Yup schemas
5. **State**: Use appropriate React hooks for state management
6. **Performance**: Implement useMemo/useCallback for expensive operations

## 🚀 Getting Started

1. **Authentication**: Start with Login.jsx
2. **Data Viewing**: Use DynamicTable with appropriate column definitions
3. **Data Entry**: Use DynamicDialog for create/edit operations
4. **Reporting**: Use RoadSignsReport as a template for new reports
5. **Booking**: Follow CartTable → BookingContext pattern

## 🔧 Troubleshooting Common Issues

1. **Filter Not Working**: Check if filter parameter is passed to API and dependencies are correct


## 📈 Performance Considerations

- Use `useMemo` for expensive calculations (as done in RoadSignsReport)
- Implement pagination for large datasets
- Lazy load map components
- Cache API responses with RTK Query
