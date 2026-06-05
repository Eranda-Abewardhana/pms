import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';

// Dashboards
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUserManagement from '../pages/admin/AdminUserManagement';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminPatients from '../pages/admin/AdminPatients';
import AdminReports from '../pages/admin/AdminReports';
import AdminFeedback from '../pages/admin/AdminFeedback';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminActivityLogs from '../pages/admin/AdminActivityLogs';

import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorPatientRecords from '../pages/doctor/DoctorPatientRecords';
import DoctorLabReports from '../pages/doctor/DoctorLabReports';
import DoctorConsultation from '../pages/doctor/DoctorConsultation';
import DoctorPrescriptions from '../pages/doctor/DoctorPrescriptions';
import DoctorAnalytics from '../pages/doctor/DoctorAnalytics';
import GuidelinesPage from '../pages/doctor/GuidelinesPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
import ReceptionistDashboard from '../pages/receptionist/ReceptionistDashboard';
import PatientRegistration from '../pages/receptionist/PatientRegistration';
import SearchPatients from '../pages/receptionist/SearchPatients';
import DoctorsAvailability from '../pages/receptionist/DoctorsAvailability';
import AppointmentManagement from '../pages/receptionist/AppointmentManagement';
import NurseDashboard from '../pages/nurse/NurseDashboard';
import AppointmentQueue from '../pages/nurse/AppointmentQueue';
import RecordVitals from '../pages/nurse/RecordVitals';
import NursePatientRecords from '../pages/nurse/PatientRecords';
import NurseReports from '../pages/nurse/NurseReports';
import NurseLabCoordination from '../pages/nurse/NurseLabCoordination';
import CashierDashboard from '../pages/cashier/CashierDashboard';
import PendingPayments from '../pages/cashier/PendingPayments';
import InvoiceHistory from '../pages/cashier/InvoiceHistory';
import CreateInvoice from '../pages/cashier/CreateInvoice';
import FinancialReports from '../pages/cashier/FinancialReports';
import PaymentVerification from '../pages/cashier/PaymentVerification';
import LabTechDashboard from '../pages/labtech/LabTechDashboard';
import LabRequests from '../pages/labtech/LabRequests';
import CompletedTests from '../pages/labtech/CompletedTests';

// Common/Shared
import AppointmentList from '../features/appointment/AppointmentList';
import MedicalHistory from '../pages/patient/MedicalHistory';

// Patient pages
import BookAppointment from '../pages/patient/BookAppointment';
import LabReports from '../pages/patient/LabReports';
import BillsInvoices from '../pages/patient/BillsInvoices';
import GiveFeedback from '../pages/patient/GiveFeedback';
import PatientProfile from '../pages/patient/PatientProfile';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<DashboardLayout />}>
        {/* General Routes */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="appointments" element={<AppointmentList />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="activity-logs" element={<AdminActivityLogs />} />
        </Route>
        
        {/* Doctor Routes */}
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<AppointmentList />} />
          <Route path="patients" element={<DoctorPatientRecords />} />
          <Route path="lab-requests" element={<DoctorLabReports />} />
          <Route path="guidelines" element={<GuidelinesPage />} />
          <Route path="consultation/:appointmentId" element={<DoctorConsultation />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="analytics" element={<DoctorAnalytics />} />
        </Route>
        
        {/* Patient Routes */}
        <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route index element={<PatientDashboard />} />
          <Route path="book-appointment" element={<BookAppointment />} />
          <Route path="appointments" element={<AppointmentList />} />
          <Route path="medical-history" element={<MedicalHistory />} />
          <Route path="lab-reports" element={<LabReports />} />
          <Route path="billing" element={<BillsInvoices />} />
          <Route path="feedback" element={<GiveFeedback />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>
        
        {/* Receptionist Routes */}
        <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['receptionist']} />}>
          <Route index element={<ReceptionistDashboard />} />
          <Route path="register-patient" element={<PatientRegistration />} />
          <Route path="patients" element={<SearchPatients />} />
          <Route path="appointments" element={<AppointmentList />} />
          <Route path="appointment-management" element={<AppointmentManagement />} />
          <Route path="doctors" element={<DoctorsAvailability />} />
        </Route>
        
        {/* Nurse Routes */}
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['nurse']} />}>
          <Route index element={<NurseDashboard />} />
          <Route path="queue" element={<AppointmentQueue />} />
          <Route path="vitals" element={<RecordVitals />} />
          <Route path="patients" element={<NursePatientRecords />} />
          <Route path="lab" element={<NurseLabCoordination />} />
          <Route path="reports" element={<NurseReports />} />
        </Route>
        
        {/* Cashier Routes */}
        <Route path="/cashier" element={<ProtectedRoute allowedRoles={['cashier']} />}>
          <Route index element={<CashierDashboard />} />
          <Route path="create-invoice" element={<CreateInvoice />} />
          <Route path="pending-payments" element={<PendingPayments />} />
          <Route path="invoices" element={<InvoiceHistory />} />
          <Route path="reports" element={<FinancialReports />} />
          <Route path="verify" element={<PaymentVerification />} />
        </Route>
        
        {/* LabTech Routes */}
        <Route path="/labtech" element={<ProtectedRoute allowedRoles={['labtech']} />}>
          <Route index element={<LabTechDashboard />} />
          <Route path="requests" element={<LabRequests />} />
          <Route path="completed" element={<CompletedTests />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
