import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Shop from "./pages/Shop";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Trade from "./pages/Trade";
import Policies from "./pages/Policies";
import PageMetadata from "./components/PageMetadata";

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <PageMetadata />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">Thoughtful design. A seamless finish.</div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="DynamicVent home">
            <img
              src="/dynamicvent-logo.svg"
              alt="DynamicVent — A finer finish for your floor"
            />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "Close ✕" : "Menu ☰"}
          </button>
          <nav
            id="navigation"
            className={menuOpen ? "navigation is-open" : "navigation"}
            aria-label="Main navigation"
          >
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/how-it-works">Installation</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/trade">Trade</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink className="nav-cta" to="/shop">
              Design your vent <span aria-hidden="true">↗</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/returns-warranty" element={<Policies />} />
          <Route
            path="/policies"
            element={<Navigate to="/returns-warranty" replace />}
          />
          <Route
            path="*"
            element={
              <div className="container section">
                <h1>Let’s find your way.</h1>
                <Link className="button" to="/">
                  Back to home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Link className="footer-brand" to="/">
              Dynamic<span>Vent</span>
            </Link>
            <p>The finishing touch your floor deserves.</p>
            <p>
              Designed in Nampa, Idaho ·{" "}
              <a href="mailto:sales@dynamicvent.com">sales@dynamicvent.com</a>
            </p>
          </div>
          <div className="footer-links">
            <Link to="/shop">Explore designs</Link>
            <Link to="/how-it-works">Installation guide</Link>
            <Link to="/about">Our story</Link>
            <Link to="/trade">Trade quotes</Link>
            <Link to="/returns-warranty">Returns &amp; Warranty</Link>
            <Link to="/contact">Get in touch</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} DynamicVent</span>
          <span>Flush-mount vents. Considered in every detail.</span>
        </div>
      </footer>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
