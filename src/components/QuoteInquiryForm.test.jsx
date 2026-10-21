import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Contact from "../pages/Contact";
import Shop from "../pages/Shop";
function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}
const url =
  "/contact?quote=1&size=6x14&pattern=Square-2&color=Antique+Pewter&slider=1&qty=3&kit=withRouter";
function app(entry = url) {
  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Location />
      <Routes>
        <Route path="/contact" element={<Contact />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  sessionStorage.clear();
  global.fetch = jest.fn();
});
afterEach(() => {
  delete global.fetch;
});
function fill() {
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Quote Buyer" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "buyer@example.com" },
  });
}
test("direct quote URL shows the configuration, changes estimate and preserves selections on edit", async () => {
  app();
  expect(
    screen.getByRole("heading", { name: "Request your quote." }),
  ).toBeInTheDocument();
  const details = screen.getByRole("region", { name: "Configured order" });
  expect(details).toHaveTextContent('6x14 (6.6" x 14.6")');
  expect(details).toHaveTextContent("Square 2");
  expect(
    screen.getByRole("region", { name: "Quote estimate" }),
  ).toHaveTextContent("$532.00");
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "5" },
  });
  expect(
    screen.getByRole("region", { name: "Quote estimate" }),
  ).toHaveTextContent("$720.00");
  expect(screen.getByTestId("location")).toHaveTextContent("qty=5");
  fireEvent.click(screen.getByRole("link", { name: "Edit selections" }));
  expect(await screen.findByLabelText("Number of vents")).toHaveValue(5);
  expect(screen.getByRole("button", { name: "Square 2" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText("$720.00")).toBeInTheDocument();
});
test("ZIP validation focuses its field and structured submission shows a focused confirmation", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ internalSent: true, confirmationSent: true }),
  });
  app();
  fill();
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("required");
  expect(screen.getByLabelText("Delivery ZIP / postal code")).toHaveFocus();
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Delivery ZIP / postal code"), {
    target: { value: "83651" },
  });
  fireEvent.change(screen.getByLabelText("Phone (optional)"), {
    target: { value: "+1 (208) 555-0100" },
  });
  fireEvent.change(screen.getByLabelText("Notes / questions (optional)"), {
    target: { value: "Please advise." },
  });
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  const heading = await screen.findByRole("heading", {
    name: "Quote request sent",
  });
  expect(heading).toHaveFocus();
  expect(
    screen.getByText(/We've emailed a copy to buyer@example.com/),
  ).toBeInTheDocument();
  const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(payload).toMatchObject({
    inquiryType: "quote",
    sourcePage: "/contact",
    phone: "+1 (208) 555-0100",
    postalCode: "83651",
    quote: { size: "6x14", quantity: 3, displayedTotal: 532 },
  });
  expect(payload.message).toContain("Please advise.");
  expect(sessionStorage.getItem("dynamicvent-inquiry")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Back to your vent" }));
  expect(await screen.findByLabelText("Number of vents")).toHaveValue(3);
});
test("custom notes restore privately and failed requests retain typed fields and focus alert", async () => {
  sessionStorage.setItem("dynamicvent-shop-wording", "Welcome Home");
  global.fetch.mockResolvedValue({
    ok: false,
    status: 429,
    json: async () => ({ message: "Too many submissions." }),
  });
  app(url + "&custom=1");
  fill();
  expect(screen.getByLabelText("Custom-design notes")).toHaveValue(
    "Welcome Home",
  );
  fireEvent.change(screen.getByLabelText("Custom-design notes"), {
    target: { value: "Private words" },
  });
  fireEvent.change(screen.getByLabelText("Delivery ZIP / postal code"), {
    target: { value: "83651" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Too many");
  await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
  expect(screen.getByLabelText("Custom-design notes")).toHaveValue(
    "Private words",
  );
  expect(screen.getByTestId("location")).not.toHaveTextContent("Private");
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).quote.customNotes).toBe(
    "Private words",
  );
});
test("invalid shop URL clamps quantity and uses catalog defaults", async () => {
  app("/shop?size=99x99&qty=500&color=%3Cscript%3E");
  expect(await screen.findByLabelText("Number of vents")).toHaveValue(99);
  expect(screen.getByRole("button", { name: /4x8/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    screen.getByRole("button", { name: "Burnished Amber" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("typed quote fields survive refresh without turning a general inquiry into a quote", async () => {
  const first = app();
  fill();
  fireEvent.change(screen.getByLabelText("Phone (optional)"), {
    target: { value: "208-555-0100" },
  });
  fireEvent.change(screen.getByLabelText("Delivery ZIP / postal code"), {
    target: { value: "83651" },
  });
  fireEvent.change(screen.getByLabelText("Notes / questions (optional)"), {
    target: { value: "Keep my note" },
  });
  first.unmount();
  const refreshed = app();
  expect(screen.getByLabelText("Phone (optional)")).toHaveValue("208-555-0100");
  expect(screen.getByLabelText("Delivery ZIP / postal code")).toHaveValue(
    "83651",
  );
  expect(screen.getByLabelText("Notes / questions (optional)")).toHaveValue(
    "Keep my note",
  );
  refreshed.unmount();
  app("/contact");
  expect(
    screen.getByRole("button", { name: /Send your inquiry/ }),
  ).toBeInTheDocument();
});
