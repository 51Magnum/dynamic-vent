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
    screen.getByText(money(47 * 2 * 3 + catalog.template.price)),
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
    `Estimated subtotal: ${money(47 * 2 * 3 + catalog.template.price)}`,
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
    "Estimated subtotal: $20.00 before shipping, tax, powder coating, and custom-design charges.",
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
    new RegExp(catalog.template.price.toFixed(2)),
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
