import { useEffect, useRef, useState } from "react";
export default function PatternThumbnail({ src }) {
  const image = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(image.current);
    return () => observer.disconnect();
  }, []);
  return (
    <img
      ref={image}
      src={visible ? src : undefined}
      alt=""
      width="240"
      height="160"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />
  );
}
