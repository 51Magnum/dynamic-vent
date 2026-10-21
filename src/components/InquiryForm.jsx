import { useState, useRef, useEffect } from "react";
import { quoteConfirmation, generalConfirmation } from "../data/confirmation";
import { sizes, colors } from "../data/options";
import { ventPrices as retailPrices } from "../data/pricing";
import { money } from "../data/quoteEstimate";
import QuoteInquiryForm from "./QuoteInquiryForm";
const MAX_BYTES = 2 * 1024 * 1024;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, content: reader.result.split(",")[1] });
    reader.onerror = () =>
      reject(
        new Error(
          "We could not read your artwork. Please select the file again.",
        ),
      );
    reader.readAsDataURL(file);
  });
function readDraft(key) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key)) || {};
    if (draft.structuredQuote)
      return {
        name: draft.name || "",
        email: draft.email || "",
        message: draft.message || "",
      };
    return draft;
  } catch {
    return {};
  }
}

export default function InquiryForm(props) {
  return props.quote && !props.trade ? (
    <QuoteInquiryForm quote={props.quote} />
  ) : (
    <LegacyInquiryForm {...props} />
  );
}
function LegacyInquiryForm({
  initialMessage = "",
  initialOrderSummary = "",
  inquiryType = "general",
  trade = false,
}) {
  const draftKey = trade ? "dynamicvent-trade-inquiry" : "dynamicvent-inquiry";
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    message: "",
    company: "",
    role: "Builder",
    quantity: "10",
    slider: false,
    size: "4x8",
    finish: "Not decided",
    finishType: "Painted (standard)",
    finishChoice: "Not decided",
    orderSummary: "",
    wording: "",
    deadline: "",
    postalCode: "",
    ...readDraft(draftKey),
    ...(initialMessage ? { message: initialMessage, inquiryType } : {}),
    ...(initialOrderSummary
      ? { orderSummary: initialOrderSummary, message: "", inquiryType: "quote" }
      : {}),
  }));
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef(null);
  useEffect(() => {
    if (status?.type === "error") errorRef.current?.focus();
  }, [status]);
  const [website, setWebsite] = useState("");
  const kind = trade ? "trade" : form.inquiryType || inquiryType;
  const update = (event) => {
    const { name, type, checked, value } = event.target;
    const next = { ...form, [name]: type === "checkbox" ? checked : value };
    setForm(next);
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      /* Form remains usable without storage. */
    }
  };
  const tradeQuantity = Number(form.quantity);
  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setStatus(null);
    if (
      files.length > 3 ||
      files.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES ||
      files.some((file) => !/\.(png|jpe?g|pdf)$/i.test(file.name))
    ) {
      setStatus({
        type: "error",
        message: "Choose up to 3 PNG, JPG, or PDF files totaling 2 MB or less.",
      });
      return;
    }
    setLoading(true);
    try {
      const message = trade
        ? `Trade quote request\nCompany: ${form.company}\nTrade: ${form.role}\nQuantity: ${form.quantity}\nDuct size: ${form.size}\nFinish: ${form.finishChoice}\nCustom wording: ${form.wording || "None specified"}\nNeeded by: ${form.deadline || "Flexible"}\nDelivery ZIP/postal code: ${form.postalCode}\nVolume pricing requested; final pricing to be confirmed.\n\nProject details:\n${form.message}`
        : form.orderSummary
          ? `${form.orderSummary}\n\nCustomer message:\n${form.message || "None provided"}`
          : form.message;
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message,
          inquiryType: kind,
          ...(trade ? {
            tradePricing: { size: form.size, quantity: tradeQuantity, slider: form.slider },
          } : {}),
          sourcePage: window.location.pathname,
          website,
          attachments: await Promise.all(files.map(readFile)),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result.message ||
            "Your inquiry was not sent. Please try again or email sales@dynamicvent.com.",
        );
      setStatus({
        type: "success",
        message: kind === "general" ? generalConfirmation : quoteConfirmation,
        confirmationSent: result.confirmationSent === true,
        internalSent: result.internalSent === true,
      });
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        /* Optional storage. */
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };
  if (status?.type === "success")
    return (
      <div className="contact-form" role="status">
        <p className="eyebrow">INQUIRY SENT</p>
        <h2>Thank you, {form.name}.</h2>
        <p>{status.message}</p>
        {status.confirmationSent ? (
          <p>We've emailed a copy to {form.email.trim()}.</p>
        ) : status.internalSent ? (
          <p>
            We received your message. A confirmation email couldn't be sent, but
            our team has your details.
          </p>
        ) : null}
        <p>
          No payment has been taken. Your order is confirmed only after you
          approve a final quote.
        </p>
        <button
          className="text-link"
          type="button"
          onClick={() => {
            setStatus(null);
            setFiles([]);
          }}
        >
          Send another inquiry →
        </button>
      </div>
    );
  return (
    <form
      className="contact-form"
      onSubmit={submit}
      aria-label={trade ? "Trade quote request" : "Contact and quote request"}
    >
      <fieldset disabled={loading} className="inquiry-fields">
        <label className="form-label" htmlFor="inquiry-name">
          Your name
        </label>
        <input
          id="inquiry-name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={update}
          required
          maxLength="150"
        />
        <label className="form-label" htmlFor="inquiry-email">
          Email address
        </label>
        <input
          id="inquiry-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update}
          required
          maxLength="254"
        />
        {trade && (
          <>
            <label className="form-label" htmlFor="company">
              Company
            </label>
            <input
              id="company"
              name="company"
              autoComplete="organization"
              value={form.company}
              onChange={update}
              required
              maxLength="150"
            />
            <label className="form-label" htmlFor="trade-role">
              Your trade
            </label>
            <select
              id="trade-role"
              name="role"
              value={form.role}
              onChange={update}
            >
              {[
                "Builder",
                "Flooring installer",
                "Interior designer",
                "Other trade",
              ].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <div className="form-pair">
              <div>
                <label className="form-label" htmlFor="trade-quantity">
                  Quantity
                </label>
                <input
                  id="trade-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={form.quantity}
                  onChange={update}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="trade-size">
                  Duct size
                </label>
                <select
                  id="trade-size"
                  name="size"
                  value={form.size}
                  onChange={update}
                >
                  {sizes.map((size) => (
                    <option key={size.label}>{size.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="check-option">
              <input
                type="checkbox" name="slider" checked={form.slider} onChange={update}
              />
              <span>
                Add a shutoff slider
                <small>Doubles the vent price.</small>
              </span>
            </label>
            <p className="field-help" aria-live="polite">
              Standard vents: {money(retailPrices[form.size])} retail per vent.
              {" "}Trade pricing is provided by email after we review your project.
            </p>
            <label className="form-label" htmlFor="trade-finish">
              Finish
            </label>
            <select
              id="trade-finish"
              name="finishChoice"
              value={form.finishChoice}
              onChange={update}
            >
              <option>Not decided</option>
              <optgroup label="Painted (standard)">
                <option>Painted (standard) — color to be confirmed</option>
                {colors.map((color) => (
                  <option
                    key={color.name}
                  >{`Painted (standard) — ${color.name}`}</option>
                ))}
              </optgroup>
              <optgroup label="Powder-coated (upgrade)">
                <option>Powder-coated — color to be confirmed</option>
                {colors.map((color) => (
                  <option
                    key={color.name}
                  >{`Powder-coated — ${color.name}`}</option>
                ))}
              </optgroup>
            </select>
            <p className="field-help">
              <a href="mailto:sales@dynamicvent.com">
                Powder coating available, contact us for pricing
              </a>
            </p>
            <label className="form-label" htmlFor="wording">
              Custom wording (optional)
            </label>
            <input
              id="wording"
              name="wording"
              value={form.wording}
              onChange={update}
              maxLength="500"
            />
            <label className="form-label" htmlFor="artwork">
              Logo or artwork (optional)
            </label>
            <input
              id="artwork"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              multiple
              aria-describedby="artwork-help"
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
            />
            <p id="artwork-help" className="field-help">
              Up to 3 PNG, JPG, or PDF files, 2 MB total. Artwork is attached to
              your quote request. Upload only designs you have permission to
              use. Files must be reselected if you refresh.
            </p>
            <label className="form-label" htmlFor="deadline">
              Needed by (optional)
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={update}
            />
            <label className="form-label" htmlFor="postalCode">
              Delivery ZIP / postal code
            </label>
            <input
              id="postalCode"
              name="postalCode"
              autoComplete="postal-code"
              value={form.postalCode}
              onChange={update}
              required
              maxLength="20"
            />
          </>
        )}
        {form.orderSummary && (
          <section className="quote-order" aria-label="Configured order">
            <h2>Your vent details</h2>
            <pre>{form.orderSummary}</pre>
          </section>
        )}
        <label className="form-label" htmlFor="inquiry-message">
          {trade
            ? "Project details and size breakdown"
            : form.orderSummary
              ? "Your message (optional)"
              : kind === "quote"
                ? "Your configured order and questions"
                : "Tell us about your project"}
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          rows="8"
          value={form.message}
          onChange={update}
          required={!form.orderSummary}
          maxLength={trade || form.orderSummary ? "7000" : "10000"}
        />
        <div className="form-trap" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>
        <button className="button full-width" disabled={loading} type="submit">
          {loading
            ? "Sending…"
            : kind === "general"
              ? "Send your inquiry ↗"
              : "Send quote request ↗"}
        </button>
        <p className="field-help">
          We’ll use your email{trade ? " and artwork" : ""} to respond to this
          inquiry. No payment is collected.
        </p>
      </fieldset>
      {status && (
        <p
          role="alert"
          ref={errorRef}
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
