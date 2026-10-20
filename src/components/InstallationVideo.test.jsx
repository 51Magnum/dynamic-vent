import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InstallationVideo from "./InstallationVideo";
test("does not load the third-party player until the visitor chooses to play", () => {
  render(<InstallationVideo />);
  expect(
    screen.queryByTitle("How to install DynamicVent"),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Play DynamicVent installation video" }),
  );
  expect(screen.getByTitle("How to install DynamicVent")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/0Ic_XOCtcm4?autoplay=1&rel=0",
  );
});
