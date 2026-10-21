import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Shop from "./Shop";
import catalog from "../data/catalog.json";
import { money } from "../data/quoteEstimate";
function Inquiry() {
  const { state } = useLocation();
  return <pre>{state.message}</pre>;
}
test("adds the purchased template once alongside slider and vent quantity", () => {
  render(
    <MemoryRouter
      initialEntries={["/shop"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/shop" element={<Shop />} />
        <Route path="/contact" element={<Inquiry />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /6x14/ }));
  fireEvent.click(screen.getByRole("button", { name: "Square 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Antique Pewter" }));
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Add a shutoff slider/ }),
  );
  fireEvent.change(screen.getByLabelText("Number of vents"), {
    target: { value: "3" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Add the installation template/ }),
  );
  expect(
    screen.getByText(
      "Doubles the vent price. Manually restrict or close airflow.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(money(catalog.ventPrices["6x14"] * 2 * 3 + catalog.templatePrices["6x14"])),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText(/Installation kit/)).not.toBeInTheDocument();
  expect(
    screen.getByRole("checkbox", { name: /Add the installation template/ }),
  ).not.toHaveAccessibleName(/estimated/);
  expect(screen.queryByText(/Prefer paper/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: /Request a Quote/ }));
  const inquiry = screen.getByText(/Please quote this/);
  expect(inquiry).toHaveTextContent("Size: 6x14");
  expect(inquiry).toHaveTextContent("Pattern: Square 2");
  expect(inquiry).toHaveTextContent("Finish: Painted (standard)");
  expect(inquiry).toHaveTextContent("Paint color: Antique Pewter");
  expect(inquiry).toHaveTextContent("Shutoff slider: Yes");
  expect(inquiry).toHaveTextContent("Quantity: 3");
  expect(inquiry).toHaveTextContent(
    `Estimated subtotal: ${money(catalog.ventPrices["6x14"] * 2 * 3 + catalog.templatePrices["6x14"])}`,
  );
  expect(inquiry).toHaveTextContent("Installation template: Yes");
  expect(inquiry).not.toHaveTextContent(/kit|refund/i);
});

test("custom wording and powder coating reach the quote inquiry without an invented upgrade price", () => {
  render(
    <MemoryRouter
      initialEntries={["/shop"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/shop" element={<Shop />} />
        <Route path="/contact" element={<Inquiry />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Custom wording or design" }),
  );
  fireEvent.change(screen.getByLabelText("Custom wording or design details"), {
    target: { value: "Welcome Home" },
  });
  fireEvent.change(screen.getByLabelText("Finish type"), {
    target: { value: "Powder-coated" },
  });
  expect(
    screen.getByRole("link", {
      name: "Powder coating available, contact us for pricing",
    }),
  ).toHaveAttribute("href", "mailto:sales@dynamicvent.com");
  fireEvent.click(screen.getByRole("link", { name: /Request a Quote/ }));
  const inquiry = screen.getByText(/Please quote this/);
  expect(inquiry).toHaveTextContent("Custom wording: Welcome Home");
  expect(inquiry).toHaveTextContent("Finish: Powder-coated");
  expect(inquiry).toHaveTextContent(
    `Estimated subtotal: ${money(catalog.ventPrices["4x8"])} before shipping, tax, powder coating, and custom-design charges.`,
  );
});

test("template shows its final catalog price and follows the selected routing depth", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Shop />
    </MemoryRouter>,
  );
  const option = screen.getByRole("checkbox", {
    name: /Add the installation template/,
  });
  expect(option).toHaveAccessibleName(
    /\$45\.00/,
  );
  expect(option).not.toHaveAccessibleName(/estimated/);
  expect(
    screen.queryByText(/printable|paper template/i),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      `Route ${catalog.routerRequirements.depths.ventOnly} in deep`,
    ),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Add a shutoff slider/ }),
  );
  expect(
    screen.getByText(
      `Route ${catalog.routerRequirements.depths.withSlider} in deep`,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(catalog.routerRequirements.recommendation),
  ).toBeInTheDocument();
});


test("template price and subtotal follow every size selection without multiplying templates", () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Shop /></MemoryRouter>);
  const option = screen.getByRole("checkbox", {name:/Add the installation template/});
  expect(option).toHaveAccessibleName(/\$45\.00/);
  fireEvent.click(option);
  fireEvent.change(screen.getByLabelText("Number of vents"), {target:{value:"5"}});
  for (const [size, price] of Object.entries(catalog.templatePrices)) {
    fireEvent.click(screen.getByRole("button", {name:new RegExp(size)}));
    expect(option).toHaveAccessibleName(new RegExp(price.toFixed(2)));
    expect(screen.getByText(money(catalog.ventPrices[size]*5+price))).toBeInTheDocument();
    expect(screen.getByText(`Installation template set (${size})`)).toBeInTheDocument();
  }
  expect(screen.getByText(/Each vent size needs its own template set/)).toBeInTheDocument();
});


test("Shop includes a free template at six and reverts to the selected size price below six", () => {
  render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Shop /></MemoryRouter>);
  const quantity=screen.getByLabelText("Number of vents");
  fireEvent.change(quantity,{target:{value:"4"}});
  expect(screen.getAllByText("Add 2 more 4x8 vents for a free template.")).toHaveLength(2);
  fireEvent.change(quantity,{target:{value:"5"}});
  expect(screen.getAllByText("Add 1 more 4x8 vents for a free template.")).toHaveLength(2);
  fireEvent.click(screen.getByRole("checkbox",{name:/Add the installation template/}));
  expect(screen.getByText(money(catalog.ventPrices["4x8"]*5+catalog.templatePrices["4x8"]))).toBeInTheDocument();
  fireEvent.change(quantity,{target:{value:"6"}});
  const included=screen.getByRole("checkbox",{name:/Installation template set included/});
  expect(included).toBeChecked();
  expect(included).toBeDisabled();
  expect(included).toHaveAccessibleName(/Free \(6\+ vents\).*\$0.00/);
  expect(screen.getAllByText(money(catalog.ventPrices["4x8"]*6))).toHaveLength(2);
  fireEvent.click(screen.getByRole("button",{name:/6x14/}));
  expect(included).toHaveAccessibleName(/69.00/);
  expect(screen.getAllByText(money(catalog.ventPrices["6x14"]*6))).toHaveLength(2);
  fireEvent.change(quantity,{target:{value:"5"}});
  expect(screen.getByRole("checkbox",{name:/Add the installation template/})).not.toBeDisabled();
  expect(screen.getByText(money(catalog.ventPrices["6x14"]*5+catalog.templatePrices["6x14"]))).toBeInTheDocument();
});
