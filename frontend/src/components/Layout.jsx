import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const HOME_TITLE = "Beautician Hub | Your Beauty, Your Way";

const titles = {
  "/services": "Services",
  "/beauticians": "Find Beauticians",
  "/how-it-works": "How It Works",
  "/about": "About Us",
  "/contact": "Contact",
  "/login": "Login",
  "/register": "Register",
};

const getTitle = (pathname) => {
  if (pathname === "/") return HOME_TITLE;

  const exact = titles[pathname];
  if (exact) return `${exact} | Beautician Hub`;

  if (pathname.startsWith("/beauticians/")) return "Beautician Profile | Beautician Hub";
  if (pathname.startsWith("/book/")) return "Book an Appointment | Beautician Hub";
  if (pathname.startsWith("/customer")) return "My Dashboard | Beautician Hub";
  if (pathname.startsWith("/beautician")) return "Beautician Dashboard | Beautician Hub";
  if (pathname.startsWith("/admin")) return "Admin Dashboard | Beautician Hub";

  return "Page not found | Beautician Hub";
};

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = getTitle(pathname);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}