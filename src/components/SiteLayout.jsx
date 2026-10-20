import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PageMetadata from "./PageMetadata";
export default function SiteLayout({ children }) {
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
        {children}
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
