import catalog from "../data/catalog.json";
import RouterRequirements from "../components/RouterRequirements";
import { Link } from "react-router-dom";
function FAQ() {
  const faqs = [
    {
      question: "What is DynamicVent?",
      answer:
        "DynamicVent is a premium flush-mounted HVAC floor vent system made from durable aluminum. Designed for hardwood floors, it blends seamlessly with your space with optional manual airflow control.",
    },
    {
      question: "What sizes do you offer?",
      answer:
        "We offer 7 standard sizes: 4x8, 4x10, 4x12, 4x14, 6x10, 6x12, and 6x14 inches — all sized to fit standard duct openings.",
    },
    {
      question: "What materials are the vents made from?",
      answer:
        "Each DynamicVent is made from precision-cut aluminum, painted in a range of finishes as standard, with powder coating available as an optional upgrade. The vents are lightweight, durable, and built to last.",
    },
    {
      question: "How thick are the vents?",
      answer: (
        <>
          The vents are {catalog.routerRequirements.depths.ventOnly} in thick.
          Route {catalog.routerRequirements.depths.ventOnly} in deep for a vent
          only, or {catalog.routerRequirements.depths.withSlider} in deep for a
          vent with the shutoff slider.{" "}
          {catalog.routerRequirements.depthGuidance}
        </>
      ),
    },
    {
      question: "How does the airflow control work?",
      answer:
        "With the optional airflow slider, the vent has two aluminum pieces. The bottom plate is slightly narrower and slides manually beneath the top plate to restrict or fully close airflow when needed.",
    },
    {
      question: "Can I customize the design?",
      answer:
        "Yes! You can select from several pre-designed styles or submit a custom pattern or wording for engraving or cutouts.",
    },
    {
      question: "How do I install it?",
      answer:
        "Use the installation template to align the vent, remove the inner visual guide, tape down the router frame, and cut the opening with a router. Then drop the vent in — no screws or adhesives needed.",
    },
    {
      question: "Do I need special tools?",
      answer: (
        <>
          Yes. A router is required to cut the flush-fit cavity, along with a
          DynamicVent installation template set (sold separately).{" "}
          {catalog.template.sizeNote}{" "}
          <Link to="/how-it-works#router-requirements">
            See the router and base plate requirements on our installation page.
          </Link>
        </>
      ),
    },
    {
      question: "Which router do I need?",
      answer: <RouterRequirements compact />,
    },
    {
      question: "Can I install it after flooring is already finished?",
      answer:
        "Yes! These vents are designed for retrofit installations as well as new builds. Just verify there's enough depth for the router cut.",
    },
    {
      question: "What floor types are compatible?",
      answer:
        "DynamicVent is optimized for solid hardwood and engineered wood floors. It's not recommended for laminate, vinyl, or tile surfaces at this time.",
    },
    {
      question: "What color options are available?",
      answer:
        "We offer finishes like Burnished Amber, Satin Bronze, Brown, Champagne Mist, Oil Rubbed Bronze, and Antique Pewter — all matching popular interior metal tones.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Standard items ship within 3–5 business days. Custom orders may take longer depending on design complexity and volume.",
    },
    {
      question: "What is your return policy?",
      answer:
        "Unused, uninstalled standard vents can be returned within 30 days of delivery for a full refund. Custom-pattern and custom-wording vents cannot be returned unless they arrive damaged or defective.",
    },
    {
      question: "Do you offer discounts for builders or volume orders?",
      answer:
        "Yes — we offer pricing for builders, designers, and commercial projects. Contact us directly for bulk orders or collaboration inquiries.",
    },
  ];

  return (
    <div className="container section">
      <div className="page-intro">
        <p className="eyebrow">GOOD QUESTIONS. THOUGHTFUL ANSWERS.</p>
        <h1>The finer details.</h1>
        <p>
          Everything from finding the right fit to making the most of your
          finish.
        </p>
      </div>
      <p className="faq-page-links">
        <Link className="text-link" to="/returns-warranty">
          30-day returns & warranty →
        </Link>{" "}
        <Link className="text-link" to="/trade">
          Trade & volume quotes →
        </Link>
      </p>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <details key={index}>
            <summary>{faq.question}</summary>
            {faq.question === "Which router do I need?" ? (
              faq.answer
            ) : (
              <p>{faq.answer}</p>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
export default FAQ;
