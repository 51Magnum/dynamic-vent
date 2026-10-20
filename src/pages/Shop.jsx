import { useState } from "react";
import { Link } from "react-router-dom";
import { colors, sizes } from "../data/options";
import { ventPrices as prices } from "../data/pricing";
const patterns = [
  "Chevron",
  "HappyHoliday",
  "RecPatter-1",
  "Round-1",
  "Round-2",
  "Round-3",
  "Square-1",
  "Square-2",
  "Square-3",
];
const patternLabel = (name) =>
  name === "HappyHoliday"
    ? "Happy Holiday"
    : name === "RecPatter-1"
      ? "Rectangle"
      : name.replace("-", " ");

const kits = {
  none: { label: "No installation kit", price: 0, refund: 0 },
  templateOnly: { label: "Template only", price: 100, refund: 25 },
  withRouter: { label: "Router + template", price: 250, refund: 225 },
};
const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export default function Shop() {
  const [size, setSize] = useState("4x8");
  const [pattern, setPattern] = useState("Chevron");
  const [custom, setCustom] = useState(false);
  const [wording, setWording] = useState("");
  const [finishType, setFinishType] = useState("Painted (standard)");
  const [color, setColor] = useState(colors[0].name);
  const [slider, setSlider] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [kit, setKit] = useState("none");
  const unitPrice = prices[size] * (slider ? 2 : 1);
  const total = unitPrice * quantity + kits[kit].price;
  const message = `Please quote this DynamicVent configuration:\nSize: ${size}\nPattern: ${custom ? "Custom wording/design" : patternLabel(pattern)}\nCustom wording: ${custom ? wording.trim() || "To be discussed" : "None"}\nFinish: ${finishType}\nPaint color: ${color}\nShutoff slider: ${slider ? "Yes" : "No"}\nQuantity: ${quantity}\nInstallation kit: ${kits[kit].label}\nEstimated subtotal: ${money(total)} before shipping, tax, powder coating, and custom-design charges.${kits[kit].refund ? `\nKit refund upon return: ${money(kits[kit].refund)}` : ""}`;
  return (
    <div className="container section shop-page">
      <div className="page-intro">
        <p className="eyebrow">YOUR FLOOR. YOUR FINISH.</p>
        <h1>Make it your own.</h1>
        <p>Explore the details and build a vent that belongs in your space.</p>
      </div>
      <div className="configurator">
        <div className="product-preview">
          <div className="preview-stage">
            <span className="eyebrow">THE FLUSH-MOUNT COLLECTION</span>
            <img
              src={`/vents/previews/${size}/${size}_${pattern}.webp`}
              fetchpriority="high"
              alt={`${size} vent in the ${patternLabel(pattern)} pattern; pattern preview only`}
            />
            <p>
              {patternLabel(pattern)} <span>/</span> {size}
            </p>
          </div>
          <div className="preview-note">
            <span>Precision-cut aluminum</span>
            <span>Made for wood floors</span>
          </div>
          <p className="muted">
            Pattern shown for reference. Finish swatches are approximate; the
            preview does not change color.
          </p>
        </div>
        <div className="configuration-options">
          <fieldset>
            <legend>
              <span>01</span> Find your size
            </legend>
            <p className="field-help">
              Choose a nominal duct size. Overall vent dimensions are listed
              below.
            </p>
            <div className="size-options">
              {sizes.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  className={size === item.label ? "choice selected" : "choice"}
                  aria-pressed={size === item.label}
                  onClick={() => setSize(item.label)}
                >
                  {item.label}
                  <small>{item.dimensions}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>02</span> Pick a pattern
            </legend>
            <div className="design-type-options">
              <button
                type="button"
                className={!custom ? "choice selected" : "choice"}
                aria-pressed={!custom}
                onClick={() => setCustom(false)}
              >
                Standard pattern
              </button>
              <button
                type="button"
                className={custom ? "choice selected" : "choice"}
                aria-pressed={custom}
                onClick={() => setCustom(true)}
              >
                Custom wording or design
              </button>
            </div>
            {custom && (
              <>
                <label className="form-label" htmlFor="custom-wording">
                  Custom wording or design details
                </label>
                <textarea
                  id="custom-wording"
                  rows="3"
                  maxLength="500"
                  value={wording}
                  onChange={(event) => setWording(event.target.value)}
                />
                <p className="field-help">
                  Describe what you have in mind. Custom designs are priced in
                  your quote; the image shows a standard pattern for reference.
                </p>
              </>
            )}
            <div className="pattern-options">
              {patterns.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    pattern === item
                      ? "pattern-choice selected"
                      : "pattern-choice"
                  }
                  aria-pressed={pattern === item}
                  onClick={() => {
                    setPattern(item);
                    setCustom(false);
                  }}
                >
                  <img
                    src={`/vents/thumbnails/${size}/${size}_${item}.webp`}
                    alt=""
                    loading="lazy"
                  />
                  <span>{patternLabel(item)}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>03</span> Choose your finish
            </legend>
            <label className="form-label" htmlFor="finish-type">
              Finish type
            </label>
            <select
              id="finish-type"
              value={finishType}
              onChange={(event) => setFinishType(event.target.value)}
            >
              <option>Painted (standard)</option>
              <option>Powder-coated</option>
            </select>
            <p className="field-help">
              <a className="text-link" href="mailto:sales@dynamicvent.com">
                Powder coating available, contact us for pricing
              </a>
            </p>
            <p className="field-help">
              Standard vents are painted aluminum. Select a color below; powder
              coating is an optional upgrade.
            </p>
            <div className="color-options">
              {colors.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={
                    color === item.name
                      ? "color-choice selected"
                      : "color-choice"
                  }
                  aria-pressed={color === item.name}
                  onClick={() => setColor(item.name)}
                >
                  <span
                    className="swatch"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>04</span> The finishing details
            </legend>
            <label className="check-option">
              <input
                type="checkbox"
                checked={slider}
                onChange={(e) => setSlider(e.target.checked)}
              />
              <span>
                Add a shutoff slider
                <small>
                  Adds {money(prices[size])} per vent to manually restrict or
                  close airflow.
                </small>
              </span>
            </label>
            <label className="form-label" htmlFor="quantity">
              Number of vents
            </label>
            <input
              id="quantity"
              className="quantity-input"
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                )
              }
            />
            <label className="form-label" htmlFor="kit">
              Installation kit <span className="muted">(one per inquiry)</span>
            </label>
            <select
              id="kit"
              value={kit}
              onChange={(e) => setKit(e.target.value)}
            >
              {Object.entries(kits).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                  {item.price ? ` — ${money(item.price)}` : ""}
                </option>
              ))}
            </select>
            {kits[kit].refund > 0 && (
              <p className="field-help">
                {money(kits[kit].price)} kit charge included below;{" "}
                {money(kits[kit].refund)} refunded upon return.
              </p>
            )}
          </fieldset>
          <div className="configuration-summary">
            <div>
              <span>
                {quantity} × vent at {money(unitPrice)}
              </span>
              <span>{money(unitPrice * quantity)}</span>
            </div>
            {kits[kit].price > 0 && (
              <div>
                <span>{kits[kit].label}</span>
                <span>{money(kits[kit].price)}</span>
              </div>
            )}
            <div className="summary-total">
              <span>Estimated subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <p>
              Shipping, tax, powder coating, and custom-design charges are not
              included. Final pricing and availability will be confirmed with
              you.
            </p>
            <Link
              className="button full-width"
              to="/contact"
              state={{ message, orderSummary: message, inquiryType: "quote" }}
            >
              Request a Quote <span aria-hidden="true">↗</span>
            </Link>
            <small>
              Send your selections to our team. No payment is collected.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
