import { useLocation, useSearchParams } from "react-router-dom";
import InquiryForm from "../components/InquiryForm";
import { parseQuoteParams, readShopWording } from "../data/quoteParams";
export default function Contact() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const quote =
    params.get("quote") === "1"
      ? { ...parseQuoteParams(params), customNotes: readShopWording() }
      : null;
  return (
    <div className="container section contact-grid">
      <div>
        <div className="page-intro">
          <p className="eyebrow">LET’S TALK DETAILS</p>
          <h1>
            {quote || state?.inquiryType === "quote"
              ? "Request your quote."
              : "A better finish starts here."}
          </h1>
          <p>
            Homeowners, builders, and designers are all welcome. Send your
            selections and we’ll confirm pricing, availability, shipping, and
            next steps by email.
          </p>
        </div>
        <div className="contact-aside">
          <h2>Made for your project.</h2>
          <p>Based in Nampa, Idaho.</p>
          <a className="text-link" href="mailto:sales@dynamicvent.com">
            sales@dynamicvent.com
          </a>
          <p>
            For a quote, include duct dimensions, quantities, and your delivery
            ZIP code.
          </p>
        </div>
      </div>
      <InquiryForm
        quote={quote}
        initialMessage={state?.orderSummary ? "" : state?.message}
        initialOrderSummary={state?.orderSummary}
        inquiryType={state?.inquiryType}
      />
    </div>
  );
}
