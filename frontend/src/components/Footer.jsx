import { Link } from "react-router-dom";
import logoIcon from "../assets/logo-icon.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="flex gap-2" style={{ alignItems: "center", marginBottom: 12 }}>
              <img src={logoIcon} alt="Beautician Hub" className="footer-logo" />
              <h4 style={{ margin: 0, fontSize: "1.2rem" }}>Beautician Hub</h4>
            </div>
            <p>
              Professional beauticians at your doorstep. Your Beauty, Your Way.
            </p>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/beauticians">Find Beauticians</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/register">Join as a Beautician</Link></li>
                            <li><Link to="/login?as=customer">Customer login</Link></li>
              <li><Link to="/login?as=beautician">Beautician login</Link></li>
              <li><Link to="/login?as=admin">Admin login</Link></li>

            </ul>
          </div>

          <div>
            <h4>Get in touch</h4>
            <ul>
              <li>support@beauticianhub.example</li>
              <li>Mon to Sat, 9 AM to 6 PM</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Beautician Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}