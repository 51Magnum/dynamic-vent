import InquiryForm from "../components/InquiryForm";
export default function Trade() {
  return (
    <div className="container section">
      <div className="page-intro">
        <p className="eyebrow">TRADE & PROJECT QUOTES</p>
        <h1>For Builders, Installers &amp; Designers</h1>
        <p>
          Your clients notice the details. DynamicVent flush-mount vents sit
          level with hardwood and engineered wood floors, so there's nothing to
          trip over and robot vacuums don't get stuck. They're a clean finishing
          touch for high-end builds and remodels.
        </p>
      </div>
      <div className="contact-grid">
        <div className="trade-copy">
          <ul className="trade-benefits-list">
            <li>Volume pricing for multi-room and multi-home projects</li>
            <li>Custom patterns or wording for a signature look</li>
            <li>Painted or powder-coated finishes</li>
            <li>
              Router and template kits you can rent for a quick, clean install
            </li>
          </ul>
          <p>
            Tell us about your project, including vent sizes, quantities, and
            any custom design ideas, and we'll get back to you with a quote.
          </p>
          <p>
            Email{" "}
            <a className="text-link" href="mailto:sales@dynamicvent.com">
              sales@dynamicvent.com
            </a>{" "}
            for trade pricing.
          </p>
        </div>
        <InquiryForm trade />
      </div>
    </div>
  );
}
