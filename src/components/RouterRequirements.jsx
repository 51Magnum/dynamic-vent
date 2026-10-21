import catalog from "../data/catalog.json";

export default function RouterRequirements() {
  const spec = catalog.routerRequirements;
  const fields = [
    ["Router", "router"],
    ["Base plate", "basePlate"],
    ["Bit", "bit"],
    ["Guide bushing", "guideBushing"],
  ];
  const ready =
    spec.confirmed &&
    fields.every(
      ([, key]) =>
        typeof spec[key] === "string" &&
        spec[key].trim() &&
        !/\[SHANE:/i.test(spec[key]),
    );
  return (
    <section
      id="router-requirements"
      className="guide-note"
      aria-labelledby="router-requirements-title"
    >
      <h2 id="router-requirements-title">
        Router &amp; base plate requirements
      </h2>
      {ready && (
        <dl>
          {fields.map(([label, key]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{spec[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      <p>Routed depth: {spec.routedDepthInches} in.</p>
      {!ready && (
        <p>
          We're finalizing the exact router and base plate specifications. Email{" "}
          <a href="mailto:sales@dynamicvent.com">sales@dynamicvent.com</a>{" "}
          before you route and we'll confirm what you need.
        </p>
      )}
    </section>
  );
}
