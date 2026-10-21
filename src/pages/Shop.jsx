import { useState, useEffect } from "react";
import RouterGuidance from "../components/RouterGuidance";
import PatternThumbnail from "../components/PatternThumbnail";
import { Link, useSearchParams } from "react-router-dom";
import { colors, sizes } from "../data/options";
import catalog from "../data/catalog.json";
import {
  estimate,
  formatQuote,
  money,
  routeDepth,
} from "../data/quoteEstimate";
import {
  defaults,
  parseQuoteParams,
  quoteParams,
  readShopWording,
  saveShopWording,
} from "../data/quoteParams";
const patterns = catalog.patterns.map((item) => item.id);
const patternLabel = (id) =>
  catalog.patterns.find((item) => item.id === id)?.label;
export default function Shop() {
  const [params, setParams] = useSearchParams();
  // Render defaults on server and first client render, then restore the URL.
  const [config, setConfig] = useState(defaults);
  const [wording, setWordingState] = useState("");
  useEffect(() => {
    setConfig(parseQuoteParams(params));
  }, [params]);
  useEffect(() => {
    setWordingState(readShopWording());
  }, []);
  const update = (change) => {
    const next = { ...config, ...change };
    setConfig(next);
    setParams(quoteParams(next), { replace: true });
  };
  const setWording = (value) => {
    setWordingState(value);
    saveShopWording(value);
  };
  const {
    size,
    pattern,
    custom,
    finishType,
    color,
    slider,
    quantity,
    template,
  } = config;
  const setSize = (size) => update({ size });
  const setCustom = (custom) => update({ custom });
  const setPattern = (pattern) => update({ pattern, custom: false });
  const setFinishType = (finishType) => update({ finishType });
  const setColor = (color) => update({ color });
  const setSlider = (slider) => update({ slider });
  const setQuantity = (quantity) => update({ quantity: Math.trunc(quantity) });
  const setTemplate = (template) => update({ template });
  const { unitPrice, total } = estimate(config);
  const quote = { ...config, customNotes: wording };
  const message = `Please quote this DynamicVent configuration:\n${formatQuote(quote)}`;
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
              decoding="async"
              width="960"
              height="620"
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
                  }}
                >
                  <PatternThumbnail
                    src={`/vents/thumbnails/${size}/${size}_${item}.webp`}
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
              {catalog.finishTypes.map((finish) => (
                <option key={finish}>{finish}</option>
              ))}
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
                  Doubles the vent price. Manually restrict or close airflow.
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
            <label className="check-option">
              <input
                type="checkbox"
                checked={template}
                onChange={(event) => setTemplate(event.target.checked)}
                aria-describedby="template-help"
              />
              <span>
                Add the installation template{" "}
                <small>
                  {money(catalog.template.price)}
                  {catalog.template.priceConfirmed ? "" : " (estimated)"}
                </small>
              </span>
            </label>
            <p id="template-help" className="field-help">
              {catalog.template.description} One template works for any number
              of vents, and it's yours to keep.
            </p>
            <RouterGuidance />
            <p className="field-help">Route {routeDepth(slider)} in deep</p>
            <Link className="text-link" to="/how-it-works#router-requirements">
              Router and base plate requirements →
            </Link>
          </fieldset>
          <div className="configuration-summary">
            <div>
              <span>
                {quantity} × vent at {money(unitPrice)}
              </span>
              <span>{money(unitPrice * quantity)}</span>
            </div>
            {template && (
              <div>
                <span>Installation template</span>
                <span>
                  {money(catalog.template.price)}
                  {catalog.template.priceConfirmed ? "" : " (estimated)"}
                </span>
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
              to={`/contact?quote=1&${quoteParams(config)}`}
              state={{
                quote,
                message,
                orderSummary: message,
                inquiryType: "quote",
              }}
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
