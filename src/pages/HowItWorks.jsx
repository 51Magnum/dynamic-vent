import InstallationVideo from "../components/InstallationVideo";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import RouterRequirements from "../components/RouterRequirements";
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
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#router-requirements")
      document
        .getElementById("router-requirements")
        ?.scrollIntoView({ block: "start" });
  }, [hash]);
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
      <InstallationVideo />
      <div className="guide-steps">
        {steps.map(([image, title, text]) => (
          <article key={image}>
            <img
              src={`/images/steps/${image.replace(".jpg", ".webp")}`}
              alt={title}
              loading="lazy"
            />
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
      <RouterRequirements />
      <div className="button-row">
        <Link to="/shop" className="button">
          Explore vents & the installation template ↗
        </Link>
      </div>
    </div>
  );
}
