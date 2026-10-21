import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RouterGuidance from "./RouterGuidance";
import catalog from "../data/catalog.json";
import {
  estimate,
  formatQuote,
  money,
  routeDepth,
} from "../data/quoteEstimate";
import { quoteParams, saveShopWording } from "../data/quoteParams";
import replyTime from "../data/reply-time.json";

function readDraft() {
  try {
    return JSON.parse(sessionStorage.getItem("dynamicvent-inquiry")) || {};
  } catch {
    return {};
  }
}
function Details({ quote }) {
  const rows = [
    [
      "Size",
      `${quote.size} (${catalog.sizes.find((item) => item.label === quote.size).dimensions})`,
    ],
    [
      "Pattern",
      quote.custom
        ? "Custom wording/design"
        : catalog.patterns.find((item) => item.id === quote.pattern)?.label,
    ],
    ["Finish type", quote.finishType],
    ["Color", quote.color],
    ["Shutoff slider", quote.slider ? "Yes" : "No"],
    ["Routing depth", `Route ${routeDepth(quote.slider)} in deep`],
    [
      "Installation template",
      quote.template
        ? `Yes (${money(catalog.templatePrices[quote.size])})`
        : "No",
    ],
  ];
  return (
    <section className="quote-order" aria-label="Configured order">
      <h2>Your vent details</h2>
      <dl className="quote-details">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="field-help">
        {catalog.template.description} {catalog.template.sizeNote}
      </p>
      <RouterGuidance />
    </section>
  );
}
function Estimate({ quote }) {
  return (
    <section
      className="quote-estimate"
      aria-label="Quote estimate"
      aria-live="polite"
      aria-atomic="true"
    >
      <p>
        Estimated subtotal <strong>{money(estimate(quote).total)}</strong>
      </p>
      <p>
        {quote.quantity} {quote.quantity === 1 ? "vent" : "vents"}. Shipping and
        tax: TBD
      </p>
      <p id="quote-estimate-help" className="field-help">
        Estimate only. Shipping, tax, powder coating and custom-design charges
        are TBD and will be confirmed in your quote. No payment is collected.
      </p>
    </section>
  );
}
export default function QuoteInquiryForm({ quote }) {
  const [, setParams] = useSearchParams();
  const [form, setForm] = useState(() => {
    const draft = readDraft();
    return {
      name: draft.name || "",
      email: draft.email || "",
      phone: draft.phone || "",
      postalCode: draft.postalCode || "",
      message: draft.message || "",
      customNotes: quote.customNotes ?? draft.customNotes ?? "",
    };
  });
  const [quantity, setQuantity] = useState(String(quote.quantity));
  useEffect(() => {
    setQuantity(String(quote.quantity));
  }, [quote.quantity]);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const errorRef = useRef(null);
  const successRef = useRef(null);
  useEffect(() => {
    if (status?.type === "success") successRef.current?.focus();
    else if (status?.type === "error") {
      const invalid = formRef.current?.querySelector('[aria-invalid="true"]');
      (invalid || errorRef.current)?.focus();
    }
  }, [status]);
  const config = {
    ...quote,
    customNotes: form.customNotes,
    quantity: Number(quantity),
  };
  const validQuantity =
    Number.isInteger(config.quantity) &&
    config.quantity >= 1 &&
    config.quantity <= 99;
  const displayConfig = validQuantity ? config : quote;
  const shopHref = `/shop?${quoteParams(displayConfig)}`;
  const persist = (next, qty = quantity) => {
    try {
      sessionStorage.setItem(
        "dynamicvent-inquiry",
        JSON.stringify({
          ...next,
          structuredQuote: true,
          quantity: qty,
          inquiryType: "quote",
        }),
      );
    } catch {
      /* Optional storage. */
    }
  };
  const update = (event) => {
    const { name, value } = event.target;
    const next = { ...form, [name]: value };
    setForm(next);
    persist(next);
    setErrors((previous) => ({ ...previous, [name]: false }));
    if (name === "customNotes") saveShopWording(value);
  };
  const changeQuantity = (event) => {
    const value = event.target.value;
    setQuantity(value);
    persist(form, value);
    setErrors((previous) => ({ ...previous, quantity: false }));
    const amount = Number(value);
    if (Number.isInteger(amount) && amount >= 1 && amount <= 99) {
      const params = quoteParams({ ...quote, quantity: amount });
      params.set("quote", "1");
      setParams(params, { replace: true });
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    const invalid = {};
    for (const field of formRef.current.querySelectorAll("input,textarea")) {
      if (!field.checkValidity()) invalid[field.name] = true;
    }
    if (!form.name.trim()) invalid.name = true;
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      setStatus({
        type: "error",
        message:
          "Please check the highlighted fields. Name, email, quantity, and delivery ZIP / postal code are required.",
      });
      return;
    }
    setStatus(null);
    setLoading(true);
    const submitted = {
      ...config,
      customNotes: form.customNotes.trim(),
      displayedTotal: estimate(config).total,
    };
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          postalCode: form.postalCode.trim(),
          inquiryType: "quote",
          sourcePage: "/contact",
          website,
          quote: submitted,
          message: `${formatQuote(submitted)}\nDelivery ZIP / postal code: ${form.postalCode.trim()}\n\nCustomer notes:\n${form.message.trim() || "None provided"}`,
          attachments: [],
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.field) setErrors({ [result.field]: true });
        throw new Error(
          result.message ||
            "Your inquiry was not sent. Please try again or email sales@dynamicvent.com.",
        );
      }
      setStatus({
        type: "success",
        quote: submitted,
        internalSent: result.internalSent === true,
        confirmationSent: result.confirmationSent === true,
      });
      try {
        sessionStorage.removeItem("dynamicvent-inquiry");
      } catch {
        /* Optional storage. */
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };
  const fieldProps = (name) => ({
    id: `quote-${name}`,
    name,
    value: form[name],
    onChange: update,
    "aria-invalid": errors[name] || undefined,
    "aria-describedby": errors[name] ? "quote-error" : undefined,
  });
  if (status?.type === "success")
    return (
      <div className="contact-form" role="status">
        <h2 ref={successRef} tabIndex={-1}>
          Quote request sent
        </h2>
        <Details quote={status.quote} />
        <p>Quantity: {status.quote.quantity}</p>
        {status.quote.custom && (
          <p>
            Custom-design notes: {status.quote.customNotes || "To be discussed"}
          </p>
        )}
        <Estimate quote={status.quote} />
        <p>
          Thanks! We've received your vent details and will email you a quote{" "}
          {replyTime}. Questions in the meantime? Email{" "}
          <a href="mailto:sales@dynamicvent.com">sales@dynamicvent.com</a>.
        </p>
        <p>
          No payment has been taken. Your order is confirmed only after you
          approve a final quote.
        </p>
        {status.confirmationSent ? (
          <p>We've emailed a copy to {form.email.trim()}.</p>
        ) : status.internalSent ? (
          <p>
            We received your message. A confirmation email couldn't be sent, but
            our team has your details.
          </p>
        ) : null}
        <Link className="text-link" to={`/shop?${quoteParams(status.quote)}`}>
          Back to your vent
        </Link>
      </div>
    );
  return (
    <form
      ref={formRef}
      className="contact-form"
      aria-label="Configured vent quote request"
      onSubmit={submit}
      noValidate
    >
      <Details quote={displayConfig} />
      <Link className="text-link" to={shopHref}>
        Edit selections
      </Link>
      <fieldset disabled={loading} className="inquiry-fields">
        <label className="form-label" htmlFor="quote-quantity">
          Quantity
        </label>
        <input
          id="quote-quantity"
          name="quantity"
          type="number"
          min="1"
          max="99"
          step="1"
          value={quantity}
          onChange={changeQuantity}
          required
          aria-invalid={errors.quantity || undefined}
          aria-describedby={`quote-estimate-help${errors.quantity ? " quote-error" : ""}`}
        />
        <Estimate quote={displayConfig} />
        <label className="form-label" htmlFor="quote-name">
          Your name
        </label>
        <input
          {...fieldProps("name")}
          required
          maxLength="150"
          autoComplete="name"
        />
        <label className="form-label" htmlFor="quote-email">
          Email address
        </label>
        <input
          {...fieldProps("email")}
          type="email"
          required
          maxLength="254"
          autoComplete="email"
        />
        <label className="form-label" htmlFor="quote-phone">
          Phone (optional)
        </label>
        <input
          {...fieldProps("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength="30"
          pattern={String.raw`[0-9 +\(\).\-]*`}
        />
        <label className="form-label" htmlFor="quote-postalCode">
          Delivery ZIP / postal code
        </label>
        <input
          {...fieldProps("postalCode")}
          required
          maxLength="20"
          minLength="3"
          pattern={String.raw`[A-Za-z0-9 \-]{3,20}`}
          autoComplete="postal-code"
        />
        {quote.custom && (
          <>
            <label className="form-label" htmlFor="quote-customNotes">
              Custom-design notes
            </label>
            <textarea {...fieldProps("customNotes")} maxLength="500" rows="3" />
          </>
        )}
        <label className="form-label" htmlFor="quote-message">
          Notes / questions (optional)
        </label>
        <textarea {...fieldProps("message")} maxLength="7000" rows="6" />
        <div className="form-trap" aria-hidden="true">
          <label htmlFor="quote-website">Website</label>
          <input
            id="quote-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>
        <button className="button full-width" type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send quote request ↗"}
        </button>
      </fieldset>
      {status?.type === "error" && (
        <p
          id="quote-error"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="contact-status error"
        >
          {status.message}{" "}
          <a href="mailto:sales@dynamicvent.com">Email us directly</a>.
        </p>
      )}
    </form>
  );
}
