import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Services from "./pages/Services";
import FindBeauticians from "./pages/FindBeauticians";
import BeauticianProfilePage from "./pages/BeauticianProfilePage";
import BookingPage from "./pages/BookingPage";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import BeauticianDashboard from "./pages/BeauticianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: "Poppins, sans-serif", fontSize: "0.92rem" },
          success: { iconTheme: { primary: "#da527e", secondary: "#fff" } },
        }}
      />

      <Routes>
        <Route element={<Layout />}>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/beauticians" element={<FindBeauticians />} />
          <Route path="/beauticians/:id" element={<BeauticianProfilePage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer only */}
          <Route
            path="/book/:serviceId"
            element={
              <ProtectedRoute roles={["customer"]}>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute roles={["customer"]}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Beautician only */}
          <Route
            path="/beautician/*"
            element={
              <ProtectedRoute roles={["beautician"]}>
                <BeauticianDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;