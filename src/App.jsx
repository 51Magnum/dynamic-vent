import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Shop from "./pages/Shop";
import SiteLayout from "./components/SiteLayout";
const Home = lazy(() => import("./pages/Home"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Trade = lazy(() => import("./pages/Trade"));
const Policies = lazy(() => import("./pages/Policies"));

function DeferredPage({ children }) {
  return (
    <Suspense
      fallback={
        <div className="container section" role="status">
          Loading page…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <SiteLayout>
        <Routes>
          <Route
            path="/"
            element={
              <DeferredPage>
                <Home />
              </DeferredPage>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <DeferredPage>
                <HowItWorks />
              </DeferredPage>
            }
          />
          <Route path="/shop" element={<Shop />} />
          <Route
            path="/faq"
            element={
              <DeferredPage>
                <FAQ />
              </DeferredPage>
            }
          />
          <Route
            path="/contact"
            element={
              <DeferredPage>
                <Contact />
              </DeferredPage>
            }
          />
          <Route
            path="/about"
            element={
              <DeferredPage>
                <About />
              </DeferredPage>
            }
          />
          <Route
            path="/trade"
            element={
              <DeferredPage>
                <Trade />
              </DeferredPage>
            }
          />
          <Route
            path="/returns-warranty"
            element={
              <DeferredPage>
                <Policies />
              </DeferredPage>
            }
          />
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
      </SiteLayout>
    </BrowserRouter>
  );
}
