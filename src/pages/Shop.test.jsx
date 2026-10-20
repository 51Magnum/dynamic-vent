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
    screen.getByRole("checkbox", { name: /Add an airflow slider/ }),
  );
  fireEvent.change(screen.getByLabelText("Number of vents"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText(/Installation kit/), {
    target: { value: "withRouter" },
  });
  expect(screen.getByText("$532.00")).toBeInTheDocument();
  expect(screen.getByText(/\$225.00 refunded upon return/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: /Ask about this design/ }));
  const inquiry = screen.getByText(/I'd like to discuss/);
  expect(inquiry).toHaveTextContent("Size: 6x14");
  expect(inquiry).toHaveTextContent("Pattern: Square 2");
  expect(inquiry).toHaveTextContent("Finish: Antique Pewter");
  expect(inquiry).toHaveTextContent("Airflow slider: Yes");
  expect(inquiry).toHaveTextContent("Quantity: 3");
  expect(inquiry).toHaveTextContent("Estimated subtotal: $532.00");
  expect(inquiry).toHaveTextContent("Kit refund upon return: $225.00");
});
