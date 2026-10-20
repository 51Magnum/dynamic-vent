import { Link } from "react-router-dom";
const steps = [
  [
    "step1-align.jpg",
    "Align the template",
    "Position the full routing template over the duct opening using the inner visual guide.",
  ],
  [
    "step2-remove.jpg",
    "Remove the inner guide",
    "With the outer frame secured in place, remove the inner visual insert.",
  ],
  [
    "step3-route.jpg",
    "Route the recess",
    "Follow the routing frame to prepare the opening for a flush fit.",
  ],
  [
    "step4-drop.jpg",
    "Drop in your vent",
    "Set your vent into the prepared opening for a clean finish without visible screws.",
  ],
];
export default function HowItWorks() {
  return (
    <div className="container section">
      <div className="page-intro">
        <p className="eyebrow">FROM FIRST CUT TO FINAL DETAIL</p>
        <h1>A fit worth finishing.</h1>
        <p>
          Our template system guides the installation, helping you create a
          clean recess for your DynamicVent. Watch the process, then explore
          each step.
        </p>
      </div>
      <iframe
        className="guide-video"
        src="https://www.youtube.com/embed/0Ic_XOCtcm4?rel=0"
        title="How to install DynamicVent"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="guide-steps">
        {steps.map(([image, title, text], i) => (
          <article key={image}>
            <img src={`/${image}`} alt={title} loading="lazy" />
            <p className="eyebrow">STEP 0{i + 1}</p>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="guide-note">
        Before routing, confirm your floor’s compatibility, available thickness,
        and installation dimensions. A router is required.{" "}
        <Link className="text-link" to="/contact">
          Talk through your project with us →
        </Link>
      </div>
      <div className="button-row">
        <Link to="/shop" className="button">
          Explore vents & installation kits ↗
        </Link>
      </div>
    </div>
  );
}
