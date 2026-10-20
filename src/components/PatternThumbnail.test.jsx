import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatternThumbnail from "./PatternThumbnail";
test("does not request a pattern image until its area approaches the viewport", () => {
  let notify;
  const disconnect = jest.fn();
  const previous = window.IntersectionObserver;
  window.IntersectionObserver = jest.fn((callback) => {
    notify = callback;
    return { observe: jest.fn(), disconnect };
  });
  try {
    const { rerender } = render(
      <PatternThumbnail src="/vents/thumbnails/4x8/4x8_Chevron.webp" />,
    );
    const image = screen.getByRole("presentation");
    expect(image).not.toHaveAttribute("src");
    act(() => notify([{ isIntersecting: false }]));
    expect(image).not.toHaveAttribute("src");
    act(() => notify([{ isIntersecting: true }]));
    expect(image).toHaveAttribute(
      "src",
      "/vents/thumbnails/4x8/4x8_Chevron.webp",
    );
    rerender(
      <PatternThumbnail src="/vents/thumbnails/6x12/6x12_Chevron.webp" />,
    );
    expect(image).toHaveAttribute(
      "src",
      "/vents/thumbnails/6x12/6x12_Chevron.webp",
    );
    expect(disconnect).toHaveBeenCalled();
  } finally {
    if (previous) window.IntersectionObserver = previous;
    else delete window.IntersectionObserver;
  }
});
