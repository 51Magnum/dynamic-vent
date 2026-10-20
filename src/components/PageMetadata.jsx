import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import pages from "../data/page-meta.json";
export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const metadata = pages[path] || {
      title: "Page Not Found | DynamicVent",
      description:
        "Find your way back to DynamicVent floor vents, installation help, and project quotes.",
    };
    document.title = metadata.title;
    const setMeta = (attribute, name, content) => {
      let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    const url = `https://www.dynamicvent.com${path === "/" ? "/" : path}`;
    setMeta("name", "description", metadata.description);
    setMeta("name", "robots", pages[path] ? "index,follow" : "noindex,follow");
    setMeta("property", "og:title", metadata.title);
    setMeta("property", "og:description", metadata.description);
    setMeta("property", "og:url", url);
    setMeta(
      "property",
      "og:image",
      metadata.image ||
        "https://www.dynamicvent.com/images/dynamicvent-social.jpg",
    );
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [pathname]);
  return null;
}
