import { useState } from "react";
export default function InstallationVideo() {
  const [playing, setPlaying] = useState(false);
  return playing ? (
    <iframe
      className="guide-video"
      src="https://www.youtube-nocookie.com/embed/0Ic_XOCtcm4?autoplay=1&rel=0"
      title="How to install DynamicVent"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <button
      type="button"
      className="video-poster guide-video"
      onClick={() => setPlaying(true)}
      aria-label="Play DynamicVent installation video"
    >
      <img
        src="/images/installation-after.webp"
        alt=""
        loading="lazy"
        width="1200"
        height="675"
      />
      <span>
        <span aria-hidden="true">▶</span> Watch the installation
      </span>
    </button>
  );
}
