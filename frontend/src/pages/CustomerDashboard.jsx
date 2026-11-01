import { Navigate, Route, Routes } from "react-router-dom";
import { FaCalendarCheck, FaUserEdit } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import CustomerBookings from "./CustomerBookings";
import CustomerProfile from "./CustomerProfile";

const links = [
  { to: "/customer", label: "My Bookings", icon: <FaCalendarCheck />, end: true },
  { to: "/customer/profile", label: "My Profile", icon: <FaUserEdit /> },
];

export default function CustomerDashboard() {
  return (
    <DashboardLayout title="My Dashboard" links={links}>
      <Routes>
        <Route index element={<CustomerBookings />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </DashboardLayout>
  );
}