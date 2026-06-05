import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ScienceIcon from '@mui/icons-material/Science';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RateReviewIcon from '@mui/icons-material/RateReview';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddBoxIcon from '@mui/icons-material/AddBox';
import BarChartIcon from '@mui/icons-material/BarChart';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export const roleMenuItems = {
  admin: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { label: 'User Management', icon: <AdminPanelSettingsIcon />, path: '/admin/users' },
    { label: 'Doctors', icon: <LocalHospitalIcon />, path: '/admin/doctors' },
    { label: 'Patients', icon: <PersonIcon />, path: '/admin/patients' },
    { label: 'Appointments', icon: <EventNoteIcon />, path: '/admin/appointments' },
    { label: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
    { label: 'Feedback', icon: <RateReviewIcon />, path: '/admin/feedback' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ],
  doctor: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/doctor' },
    { label: 'My Appointments', icon: <EventNoteIcon />, path: '/doctor/appointments' },
    { label: 'Patient Records', icon: <PeopleIcon />, path: '/doctor/patients' },
    { label: 'Lab Requests', icon: <ScienceIcon />, path: '/doctor/lab-requests' },
  ],
  patient: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/patient' },
    { label: 'Book Appointment', icon: <EventNoteIcon />, path: '/patient/book-appointment' },
    { label: 'My Appointments', icon: <EventNoteIcon />, path: '/patient/appointments' },
    { label: 'Medical Records', icon: <MedicalInformationIcon />, path: '/patient/medical-history' },
    { label: 'Lab Reports', icon: <ScienceIcon />, path: '/patient/lab-reports' },
    { label: 'Bills & Invoices', icon: <ReceiptLongIcon />, path: '/patient/billing' },
    { label: 'Give Feedback', icon: <RateReviewIcon />, path: '/patient/feedback' },
  ],
  receptionist: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/receptionist' },
    { label: 'Patient Registration', icon: <PersonIcon />, path: '/receptionist/register-patient' },
    { label: 'Search Patients', icon: <PeopleIcon />, path: '/receptionist/patients' },
    { label: 'Manage Appointments', icon: <EventNoteIcon />, path: '/receptionist/appointments' },
    { label: 'Doctors Availability', icon: <GroupsIcon />, path: '/receptionist/doctors' },
  ],
  nurse: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/nurse' },
    { label: 'Appointment Queue', icon: <EventNoteIcon />, path: '/nurse/queue' },
    { label: 'Record Vitals', icon: <MonitorHeartIcon />, path: '/nurse/vitals' },
    { label: 'Patient Records', icon: <PeopleIcon />, path: '/nurse/patients' },
    { label: 'Lab Coordination', icon: <ScienceIcon />, path: '/nurse/lab' },
    { label: 'Reports', icon: <AssessmentIcon />, path: '/nurse/reports' },
  ],
  cashier: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/cashier' },
    { label: 'Create Invoice', icon: <AddBoxIcon />, path: '/cashier/create-invoice' },
    { label: 'Pending Payments', icon: <ReceiptLongIcon />, path: '/cashier/pending-payments' },
    { label: 'Invoice History', icon: <AssessmentIcon />, path: '/cashier/invoices' },
    { label: 'Financial Reports', icon: <BarChartIcon />, path: '/cashier/reports' },
    { label: 'Payment Verification', icon: <VerifiedUserIcon />, path: '/cashier/verify' },
  ],
  labtech: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/labtech' },
    { label: 'Lab Requests', icon: <ScienceIcon />, path: '/labtech/requests' },
    { label: 'Completed Tests', icon: <AssessmentIcon />, path: '/labtech/completed' },
  ]
};
