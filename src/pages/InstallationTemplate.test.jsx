import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import catalog from "../data/catalog.json";
import HowItWorks from "./HowItWorks";
import Policies from "./Policies";
import FAQ from "./FAQ";
function page(element) {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {element}
    </MemoryRouter>,
  );
}
test("recommended router setup lists all approved specifications and both depth choices", () => {
  const { container } = page(<HowItWorks />);
  const section = screen.getByRole("region", {
    name: "Recommended router setup",
  });
  for (const field of [
    "recommendation",
    "router",
    "sameBaseFits",
    "basePlate",
    "bit",
    "depthGuidance",
  ])
    expect(section).toHaveTextContent(catalog.routerRequirements[field]);
  expect(section).toHaveTextContent(
    `Vent only: Route ${catalog.routerRequirements.depths.ventOnly} in deep.`,
  );
  expect(section).toHaveTextContent(
    `Vent with shutoff slider: Route ${catalog.routerRequirements.depths.withSlider} in deep.`,
  );
  expect(section).toHaveTextContent(catalog.template.description);
  expect(container).not.toHaveTextContent(/\[SHANE:|not compatible/i);
});
test("policy keeps vent terms and describes the physical template purchase", () => {
  const first = render(<Policies />);
  const section = first.container.querySelector("#installation-template");
  expect(section).toHaveTextContent("Installation templates are sold outright");
  expect(section).toHaveTextContent("Questions about returning a template?");
  expect(first.container.textContent).not.toMatch(
    /\brent(al|ed)?\b|deposit|kit/i,
  );
  expect(first.container.querySelector("#returns")).toHaveTextContent(
    "within 30 days of delivery for a full refund",
  );
  expect(first.container.querySelector("#warranty")).toHaveTextContent(
    "30 days from delivery",
  );
  expect(section).not.toHaveTextContent("printable paper");
});
test("FAQ tools answer points directly to the requirements section", () => {
  page(<FAQ />);
  const item = screen.getByText("Do I need special tools?").closest("details");
  expect(item).toHaveTextContent(
    "one DynamicVent installation template (sold separately; one template works for every vent)",
  );
  expect(within(item).getByRole("link", { hidden: true })).toHaveAttribute(
    "href",
    "/how-it-works#router-requirements",
  );
});

test("router FAQ includes both depths and replaces the blanket-depth answer", () => {
  page(<FAQ />);
  const item = screen.getByText("Which router do I need?").closest("details");
  expect(item).toHaveTextContent(catalog.routerRequirements.recommendation);
  expect(item).toHaveTextContent(catalog.routerRequirements.basePlate);
  expect(item).toHaveTextContent(catalog.routerRequirements.bit);
  expect(item).toHaveTextContent(
    `Route ${catalog.routerRequirements.depths.ventOnly} in deep`,
  );
  expect(item).toHaveTextContent(
    `Route ${catalog.routerRequirements.depths.withSlider} in deep`,
  );
  const thickness = screen
    .getByText("How thick are the vents?")
    .closest("details");
  expect(thickness).toHaveTextContent("for a vent only");
  expect(thickness).toHaveTextContent("for a vent with the shutoff slider");
});
