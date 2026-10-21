import catalog from "../data/catalog.json";
export function RouterHelp() {
  const spec = catalog.routerRequirements;
  return (
    <p className="field-help">
      {spec.helpBeforeEmail}{" "}
      <a href="mailto:sales@dynamicvent.com">sales@dynamicvent.com</a>{" "}
      {spec.helpAfterEmail}
    </p>
  );
}
export default function RouterGuidance() {
  return (
    <>
      <p className="field-help">{catalog.routerRequirements.recommendation}</p>
      <RouterHelp />
    </>
  );
}
