import catalog from "../data/catalog.json";
import { RouterHelp } from "./RouterGuidance";
export default function RouterRequirements({ compact = false }) {
  const spec = catalog.routerRequirements;
  const contents = (
    <>
      <p>{spec.recommendation}</p>
      <p>{catalog.template.description}</p>
      <dl>
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
      <p>Vent only: Route {spec.depths.ventOnly} in deep.</p>
      <p>Vent with shutoff slider: Route {spec.depths.withSlider} in deep.</p>
      <p>{spec.depthGuidance}</p>
      <RouterHelp />
    </>
  );
  return compact ? (
    <div>{contents}</div>
  ) : (
    <section
      id="router-requirements"
      className="guide-note"
      aria-labelledby="router-requirements-title"
    >
      <h2 id="router-requirements-title">Recommended router setup</h2>
      {contents}
    </section>
  );
}
