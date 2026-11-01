import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { FaCalendarCheck, FaConciergeBell, FaClock, FaUserEdit, FaStar } from "react-icons/fa";
import { getMyProfile } from "../services/beauticianService";
import { getErrorMessage } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import Loader from "../components/Loader";
import BeauticianBookings from "./BeauticianBookings";
import BeauticianServices from "./BeauticianServices";
import BeauticianAvailability from "./BeauticianAvailability";
import BeauticianMyProfile from "./BeauticianMyProfile";
import BeauticianReviews from "./BeauticianReviews";

const links = [
  { to: "/beautician", label: "Bookings", icon: <FaCalendarCheck />, end: true },
  { to: "/beautician/services", label: "My Services", icon: <FaConciergeBell /> },
  { to: "/beautician/availability", label: "Working Hours", icon: <FaClock /> },
  { to: "/beautician/profile", label: "My Profile", icon: <FaUserEdit /> },
  { to: "/beautician/reviews", label: "Reviews", icon: <FaStar /> },
];

function StatusBanner({ profile }) {
  if (!profile) {
    return (
      <div className="alert alert-info">
        Welcome! Start by creating your professional profile, so an admin can approve it.{" "}
        <Link to="/beautician/profile">Create my profile</Link>
      </div>
    );
  }
  if (profile.isSuspended) {
    return <div className="alert alert-error">Your profile is suspended, so customers cannot see it. Please contact support.</div>;
  }
  if (profile.approvalStatus === "Pending") {
    return (
      <div className="alert alert-info">
        Your profile is waiting for admin approval. Customers will see you once it is approved.
      </div>
    );
  }
  if (profile.approvalStatus === "Rejected") {
    return (
      <div className="alert alert-error">
        Your profile was not approved. Update it and save, and it will go back for review.{" "}
        <Link to="/beautician/profile">Edit my profile</Link>
      </div>
    );
  }
  return null;
}

export default function BeauticianDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data.profile);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <DashboardLayout title="Beautician Dashboard" links={links}>
      {loading ? (
        <Loader text="Loading your dashboard..." />
      ) : (
        <>
          {error && <div className="alert alert-error">{error}</div>}
          <StatusBanner profile={profile} />

          <Routes>
            <Route index element={<BeauticianBookings />} />
            <Route path="services" element={<BeauticianServices profile={profile} />} />
            <Route path="availability" element={<BeauticianAvailability />} />
            <Route path="profile" element={<BeauticianMyProfile profile={profile} onSaved={setProfile} />} />
            <Route path="reviews" element={<BeauticianReviews profile={profile} />} />
            <Route path="*" element={<Navigate to="/beautician" replace />} />
          </Routes>
        </>
      )}
    </DashboardLayout>
  );
}