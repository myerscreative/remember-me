import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorFallback } from "./error-fallback";

describe("ErrorFallback", () => {
  it("renders default title and message", () => {
    render(<ErrorFallback />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/we encountered an unexpected error/i)).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(
      <ErrorFallback
        title="Custom Error"
        message="Custom error message here."
      />
    );
    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    expect(screen.getByText("Custom error message here.")).toBeInTheDocument();
  });

  it("shows Try Again button when reset is provided", async () => {
    const reset = jest.fn();
    const user = userEvent.setup();
    render(<ErrorFallback reset={reset} />);
    const tryAgain = screen.getByRole("button", { name: /try again/i });
    expect(tryAgain).toBeInTheDocument();
    await user.click(tryAgain);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("shows Go Home link when showHomeLink is true", () => {
    render(<ErrorFallback showHomeLink />);
    const homeLink = screen.getByRole("link", { name: /go home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("hides Go Home link when showHomeLink is false", () => {
    render(<ErrorFallback showHomeLink={false} />);
    expect(screen.queryByRole("link", { name: /go home/i })).not.toBeInTheDocument();
  });
});
