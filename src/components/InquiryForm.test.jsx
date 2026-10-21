import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import InquiryForm from "./InquiryForm";
import { quoteConfirmation } from "../data/confirmation";
beforeEach(() => {
  sessionStorage.clear();
  global.fetch = jest.fn();
});
afterEach(() => {
  delete global.fetch;
});
function identity() {
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Trade Buyer" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "buyer@example.com" },
  });
}
test("configured quote survives a refresh and is sent with the customer details", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: "Quote received." }),
  });
  const first = render(
    <InquiryForm
      initialMessage="Size: 6x14; Quantity: 12"
      inquiryType="quote"
    />,
  );
  identity();
  first.unmount();
  render(<InquiryForm />);
  expect(
    screen.getByLabelText("Your configured order and questions"),
  ).toHaveValue("Size: 6x14; Quantity: 12");
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  await screen.findByText(quoteConfirmation);
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.inquiryType).toBe("quote");
  expect(body.message).toContain("Quantity: 12");
  expect(body.email).toBe("buyer@example.com");
  expect(sessionStorage.getItem("dynamicvent-inquiry")).toBeNull();
});
test("failed delivery preserves the inquiry and offers direct email", async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    json: async () => ({ message: "Your inquiry was not sent." }),
  });
  render(<InquiryForm initialMessage="Size: 4x8" inquiryType="quote" />);
  identity();
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("not sent");
  expect(
    screen.getByLabelText("Your configured order and questions"),
  ).toHaveValue("Size: 4x8");
  expect(screen.queryByText("INQUIRY SENT")).not.toBeInTheDocument();
});
test("trade quote includes quantity, wording, company and the uploaded logo", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: "Trade request received." }),
  });
  render(<InquiryForm trade />);
  identity();
  for (const [label, value] of [
    ["Company", "Builder Co"],
    ["Quantity", "25"],
    ["Custom wording (optional)", "Welcome"],
    ["Delivery ZIP / postal code", "83651"],
    ["Project details and size breakdown", "All 4x8, with airflow sliders."],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.change(screen.getByLabelText("Finish", { exact: true }), {
    target: { value: "Painted (standard) — Brown" },
  });
  fireEvent.change(screen.getByLabelText("Logo or artwork (optional)"), {
    target: {
      files: [
        new File(["%PDF-1.4 artwork"], "logo.pdf", { type: "application/pdf" }),
      ],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.inquiryType).toBe("trade");
  expect(body.message).toContain("Quantity: 25");
  expect(body.message).toContain("Custom wording: Welcome");
  expect(body.message).toContain("Builder Co");
  expect(body.message).toContain("Finish: Painted (standard) — Brown");
  expect(body.attachments[0].name).toBe("logo.pdf");
  expect(body.attachments[0].content).toBeTruthy();
  await screen.findByText(quoteConfirmation);
});

test("configured order is retained separately from the customer's editable message", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  const summary =
    "Size: 6x14\nPattern: Custom wording/design\nCustom wording: Welcome Home\nShutoff slider: Yes\nFinish: Powder-coated\nPaint color: Brown\nQuantity: 4";
  const first = render(
    <InquiryForm initialOrderSummary={summary} inquiryType="quote" />,
  );
  identity();
  fireEvent.change(screen.getByLabelText("Your message (optional)"), {
    target: { value: "Please ship to Nampa." },
  });
  first.unmount();
  render(<InquiryForm />);
  expect(
    screen.getByRole("region", { name: "Configured order" }),
  ).toHaveTextContent("Welcome Home");
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  await screen.findByText(quoteConfirmation);
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.message).toContain(summary);
  expect(body.message).toContain("Customer message:\nPlease ship to Nampa.");
  expect(body.name).toBe("Trade Buyer");
  expect(body.email).toBe("buyer@example.com");
});

test("trade pricing separates unit price from quantity total and offers one finish selector", () => {
  render(<InquiryForm trade />);
  expect(
    screen.getByText(/Standard vents: \$42.00 retail per vent/),
  ).toHaveTextContent("Trade pricing is provided by email after we review your project.");
  fireEvent.change(screen.getByLabelText("Duct size"), {
    target: { value: "6x12" },
  });
  expect(
    screen.getByText(/Standard vents: \$67.00 retail per vent/),
  ).toHaveTextContent("Trade pricing is provided by email after we review your project.");
  expect(screen.getAllByLabelText("Finish", { exact: true })).toHaveLength(1);
  expect(screen.queryByLabelText("Finish type")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Finish", { exact: true })).toHaveValue(
    "Not decided",
  );
});

test("confirmation copy appears only when the server confirms delivery", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ internalSent: true, confirmationSent: true }),
  });
  render(<InquiryForm initialMessage="Quote please" inquiryType="quote" />);
  identity();
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  expect(
    await screen.findByText("We've emailed a copy to buyer@example.com."),
  ).toBeInTheDocument();
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).sourcePage).toBe(
    window.location.pathname,
  );
});
test("internal-only success explains the missing confirmation", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ internalSent: true, confirmationSent: false }),
  });
  render(<InquiryForm initialMessage="Quote please" inquiryType="quote" />);
  identity();
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  expect(
    await screen.findByText(/A confirmation email couldn't be sent/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/We've emailed a copy/)).not.toBeInTheDocument();
});
test("429 preserves the form and focuses the error alert", async () => {
  const message =
    "Too many submissions. Please wait a few minutes or email sales@dynamicvent.com.";
  global.fetch.mockResolvedValue({
    ok: false,
    status: 429,
    json: async () => ({ message }),
  });
  render(<InquiryForm initialMessage="Keep my quote" inquiryType="quote" />);
  identity();
  fireEvent.click(screen.getByRole("button", { name: /Send quote request/ }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(message);
  await waitFor(() => expect(alert).toHaveFocus());
  expect(
    screen.getByLabelText("Your configured order and questions"),
  ).toHaveValue("Keep my quote");
  expect(screen.getByLabelText("Email address")).toHaveValue(
    "buyer@example.com",
  );
});


test("Trade pricing is quoted by email without public discount tiers or estimates", () => {
  render(<InquiryForm trade />);
  fireEvent.change(screen.getByLabelText("Quantity"), {target:{value:"100"}});
  fireEvent.click(screen.getByRole("checkbox", {name:/Add a shutoff slider/}));
  expect(screen.getByText(/Standard vents:/)).toHaveTextContent("Trade pricing is provided by email after we review your project.");
  expect(screen.queryByText(/Trade discount|Estimated standard-vent total|25%/)).not.toBeInTheDocument();
});
