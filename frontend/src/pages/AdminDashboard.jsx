import { Navigate, Route, Routes } from "react-router-dom";
import { FaChartPie, FaUserCheck, FaUsers, FaTags, FaClipboardList, FaEnvelope } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import AdminOverview from "./AdminOverview";
import AdminApprovals from "./AdminApprovals";
import AdminUsers from "./AdminUsers";
import AdminCategories from "./AdminCategories";
import AdminMonitor from "./AdminMonitor";
import AdminMessages from "./AdminMessages";

const links = [
  { to: "/admin", label: "Overview", icon: <FaChartPie />, end: true },
  { to: "/admin/approvals", label: "Approvals", icon: <FaUserCheck /> },
  { to: "/admin/users", label: "Users", icon: <FaUsers /> },
  { to: "/admin/categories", label: "Categories", icon: <FaTags /> },
  { to: "/admin/monitor", label: "Monitor", icon: <FaClipboardList /> },
  { to: "/admin/messages", label: "Messages", icon: <FaEnvelope /> },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard" links={links}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="monitor" element={<AdminMonitor />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}