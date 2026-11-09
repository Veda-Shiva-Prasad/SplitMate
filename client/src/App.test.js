import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

test("shows the login page when the user is not signed in", async () => {
  render(<App />);

  expect(
    await screen.findByText(/sign in to splitmate/i),
  ).toBeInTheDocument();
});

test("a protected page redirects to login when there is no token", async () => {
  window.history.pushState({}, "", "/dashboard");

  render(<App />);

  expect(
    await screen.findByText(/sign in to splitmate/i),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");
});

test("unknown routes fall back to the login page", async () => {
  window.history.pushState({}, "", "/this-page-does-not-exist");

  render(<App />);

  expect(
    await screen.findByText(/sign in to splitmate/i),
  ).toBeInTheDocument();
});
