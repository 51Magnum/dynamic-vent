import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import catalog from "../data/catalog.json";
import HowItWorks from "./HowItWorks";
import Policies from "./Policies";
import FAQ from "./FAQ";
jest.mock("../data/catalog.json", () =>
  JSON.parse(JSON.stringify(jest.requireActual("../data/catalog.json"))),
);
const original = JSON.parse(JSON.stringify(catalog));
beforeEach(() => {
  Object.assign(catalog, JSON.parse(JSON.stringify(original)));
});
function page(element) {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {element}
    </MemoryRouter>,
  );
}
test("unconfirmed router section hides all placeholder text, even if confirmed is toggled early", () => {
  catalog.routerRequirements.confirmed = true;
  const { container } = page(<HowItWorks />);
  const section = screen.getByRole("region", {
    name: "Router & base plate requirements",
  });
  expect(section).toHaveTextContent("Routed depth: 0.25 in.");
  expect(section).toHaveTextContent(
    "We're finalizing the exact router and base plate specifications.",
  );
  expect(container).not.toHaveTextContent("[SHANE:");
  expect(
    screen.getByRole("link", {
      name: /Explore vents & the installation template/,
    }),
  ).toBeInTheDocument();
});
test("confirmed router section lists only completed owner specifications", () => {
  catalog.routerRequirements = {
    confirmed: true,
    router: "Fixture router",
    basePlate: "Fixture base plate",
    bit: "Fixture bit",
    guideBushing: "none",
    routedDepthInches: 0.25,
  };
  page(<HowItWorks />);
  const section = screen.getByRole("region", {
    name: "Router & base plate requirements",
  });
  for (const value of [
    "Fixture router",
    "Fixture base plate",
    "Fixture bit",
    "none",
    "Routed depth: 0.25 in.",
  ])
    expect(section).toHaveTextContent(value);
  expect(section).not.toHaveTextContent("finalizing");
});
test("policy keeps vent terms and adds safe template terms with optional printable copy", () => {
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
  first.unmount();
  catalog.template.returnTerms =
    "Ask sales before returning your unused template.";
  catalog.template.printableAvailable = true;
  const second = render(<Policies />);
  expect(
    second.container.querySelector("#installation-template"),
  ).toHaveTextContent(catalog.template.returnTerms);
  expect(
    screen.getByText(
      "The printable paper template is free and isn't returnable.",
    ),
  ).toBeInTheDocument();
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
