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
        "Each DynamicVent is made from precision-cut aluminum, powder coated in a range of designer finishes. The vents are lightweight, durable, and built to last.",
    },
    {
      question: "How thick are the vents?",
      answer:
        'The vents are 0.125" thick. They\'re designed to drop into a routed 0.25" deep opening, sitting flush with your hardwood floor.',
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
      answer:
        "Yes. A router is required to cut the flush-fit cavity. Installation templates are available in our optional kits.",
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
        "Standard items can be returned within 30 days if unused. Custom orders are final sale unless there's a manufacturing defect.",
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
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <details key={index}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
export default FAQ;
