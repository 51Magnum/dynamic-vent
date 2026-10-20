import { useState } from "react";
import { useLocation } from "react-router-dom";
export default function Contact() {
  const { state } = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: state?.message || "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.message || "We could not send your message. Please try again.",
        );
      setStatus({
        type: "success",
        message: data.message || "Thank you. Your message has been sent.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container section contact-grid">
      <div>
        <div className="page-intro">
          <p className="eyebrow">LET’S TALK DETAILS</p>
          <h1>
            A better finish
            <br />
            starts here.
          </h1>
          <p>
            Choosing a size, exploring a custom pattern, or planning a whole
            project? Tell us what you have in mind.
          </p>
        </div>
        <div className="contact-aside">
          <h2>Made for your project.</h2>
          <p>
            Homeowners, builders, and designers are all welcome. Include your
            duct dimensions, quantities, and any questions so we can help you
            find the right fit.
          </p>
        </div>
      </div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength="150"
        />
        <label className="form-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          maxLength="254"
        />
        <label className="form-label" htmlFor="message">
          Tell us about your project
        </label>
        <textarea
          id="message"
          name="message"
          rows="8"
          value={formData.message}
          onChange={handleChange}
          required
          maxLength="10000"
        />
        <button className="button full-width" disabled={loading} type="submit">
          {loading ? "Sending…" : "Send your inquiry ↗"}
        </button>
        <p className="field-help">
          We’ll use your email to respond to your inquiry.
        </p>
        {status && (
          <p
            role={status.type === "error" ? "alert" : "status"}
            className={`contact-status ${status.type}`}
          >
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
}
