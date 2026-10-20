import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Shop from "./Shop";
function Inquiry() {
  const { state } = useLocation();
  return <pre>{state.message}</pre>;
}
test("includes slider, quantity and kit charge in the inquiry while keeping the return refund separate", () => {
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
  fireEvent.change(screen.getByLabelText(/Installation kit/), {
    target: { value: "withRouter" },
  });
  expect(
    screen.getByText(
      "Doubles the vent price. Manually restrict or close airflow.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("$532.00")).toBeInTheDocument();
  expect(screen.getByText(/\$225.00 refunded upon return/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: /Request a Quote/ }));
  const inquiry = screen.getByText(/Please quote this/);
  expect(inquiry).toHaveTextContent("Size: 6x14");
  expect(inquiry).toHaveTextContent("Pattern: Square 2");
  expect(inquiry).toHaveTextContent("Finish: Painted (standard)");
  expect(inquiry).toHaveTextContent("Paint color: Antique Pewter");
  expect(inquiry).toHaveTextContent("Shutoff slider: Yes");
  expect(inquiry).toHaveTextContent("Quantity: 3");
  expect(inquiry).toHaveTextContent("Estimated subtotal: $532.00");
  expect(inquiry).toHaveTextContent("Kit refund upon return: $225.00");
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
