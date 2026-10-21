import catalog from "../data/catalog.json";
import { RouterHelp } from "./RouterGuidance";
export default function RouterRequirements({ compact = false }) {
  const spec = catalog.routerRequirements;
  const contents = (
    <>
      <p className="router-setup__lead">{spec.recommendation}</p>
      <div className="router-setup__grid">
        {!compact && (
          <figure className="router-setup__diagram">
            <a
              href="/images/router-setup-diagram.png"
              target="_blank"
              rel="noreferrer"
              aria-label="Open router setup diagram at full size"
            >
              <img
                src="/images/router-setup-diagram.png"
                alt="Top view of the recommended round sub-base and a section view showing how the router sits inside the template. Full specifications and routing depths are listed below."
                loading="lazy"
                width="2100"
                height="1275"
              />
              <span className="router-setup__image-link">
                Open full-size diagram ↗
              </span>
            </a>
            <figcaption>{catalog.template.description}</figcaption>
          </figure>
        )}
        <dl className="router-setup__specs">
          <div>
            <dt>Router</dt>
            <dd>
              {spec.router}. {spec.sameBaseFits}
            </dd>
          </div>
          <div>
            <dt>Sub-base</dt>
            <dd>{spec.basePlate}</dd>
          </div>
          <div>
            <dt>Bit</dt>
            <dd>{spec.bit}</dd>
          </div>
        </dl>
      </div>
      {compact && <p>{catalog.template.description}</p>}
      <div className="router-setup__depths">
        <p>
          <span>Vent only:</span>{" "}
          <strong>Route {spec.depths.ventOnly} in deep.</strong>
        </p>
        <p>
          <span>Vent with shutoff slider:</span>{" "}
          <strong>Route {spec.depths.withSlider} in deep.</strong>
        </p>
      </div>
      <p className="router-setup__measurement">{spec.depthGuidance}</p>
      <RouterHelp />
    </>
  );
  return compact ? (
    <div className="router-setup router-setup--compact">{contents}</div>
  ) : (
    <section
      id="router-requirements"
      className="router-setup"
      aria-labelledby="router-requirements-title"
    >
      <h2 id="router-requirements-title">Recommended router setup</h2>
      {contents}
    </section>
  );
}
