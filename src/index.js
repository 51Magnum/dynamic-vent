import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
const container = document.getElementById("root");
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if (container.dataset.prerendered === "shop") hydrateRoot(container, app);
else createRoot(container).render(app);

// Local measurement only: /shop?measure=1 exposes FCP as a DOM meta tag.
// No analytics request or visitor data is sent anywhere.
if (
  container.dataset.prerendered === "shop" &&
  new URLSearchParams(window.location.search).has("measure") &&
  "PerformanceObserver" in window
) {
  try {
    const observer = new window.PerformanceObserver((list) => {
      const paint = list
        .getEntries()
        .find((entry) => entry.name === "first-contentful-paint");
      if (!paint) return;
      const metric = document.createElement("meta");
      metric.name = "shop-first-contentful-paint-ms";
      metric.content = String(Math.round(paint.startTime));
      document.head.appendChild(metric);
      observer.disconnect();
    });
    observer.observe({ type: "paint", buffered: true });
  } catch {
    /* Measurement support must never affect the shop. */
  }
}
