import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SuggestPlaceDialog } from "@/components/map/suggest-place-dialog";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderDialog() {
  const onOpenChange = vi.fn();
  render(<SuggestPlaceDialog open onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

function fillRequiredFields(gmapsLink: string) {
  fireEvent.change(screen.getByLabelText("Place name"), {
    target: { value: "City Library" },
  });
  fireEvent.change(screen.getByLabelText("City"), {
    target: { value: "Mumbai" },
  });
  fireEvent.change(screen.getByLabelText("Google Maps link"), {
    target: { value: gmapsLink },
  });
}

describe("SuggestPlaceDialog", () => {
  it.each([
    ["an unrelated host", "https://example.com/not-a-map"],
    ["a Google lookalike host", "https://maps.google.com.evil.example/maps/place/x"],
    ["an insecure Google Maps URL", "http://maps.google.com/?q=19.0176,72.8562"],
    ["a URL with credentials", "https://user@maps.google.com/?q=19.0176,72.8562"],
    ["a URL with a custom port", "https://maps.google.com:444/?q=19.0176,72.8562"],
  ])("rejects %s before submission", (_caseName, gmapsLink) => {
    renderDialog();
    fillRequiredFields(gmapsLink);

    const submit = screen.getByRole("button", { name: "Open GitHub issue" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain("valid Google Maps link");
  });

  it("keeps the form open and exposes a fallback when the popup is blocked", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const { onOpenChange } = renderDialog();
    fillRequiredFields("https://maps.google.com/?q=19.0176,72.8562");

    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(openSpy).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Place name")).toHaveProperty("value", "City Library");
    expect(screen.getByLabelText("City")).toHaveProperty("value", "Mumbai");
    expect(screen.getByLabelText("Google Maps link")).toHaveProperty(
      "value",
      "https://maps.google.com/?q=19.0176,72.8562",
    );

    const fallback = screen.getByRole("link", { name: "Open the GitHub issue manually" });
    expect(fallback.getAttribute("href")).toContain("github.com/StudentSuite/StudyMap/issues/new?");
    expect(fallback.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it.each([
    "https://www.google.com/maps/place/City+Library",
    "https://goo.gl/maps/abc123",
  ])("accepts the canonical Google Maps form %s", (gmapsLink) => {
    const openedWindow = { opener: window } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(openedWindow);
    const { onOpenChange } = renderDialog();
    fillRequiredFields(gmapsLink);

    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(openedWindow.opener).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("severs the opener before closing after a successful new tab", () => {
    const openedWindow = { opener: window } as unknown as Window;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(openedWindow);
    const { onOpenChange } = renderDialog();
    fillRequiredFields("https://maps.app.goo.gl/abc123");

    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(openSpy).toHaveBeenCalledOnce();
    expect(openSpy.mock.calls[0]).toHaveLength(2);
    expect(openedWindow.opener).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
