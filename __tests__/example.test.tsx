import { render, screen } from "@testing-library/react";
import React from "react";

function ExampleComponent() {
  return <div>Hello Jest + SWC!</div>;
}

test("renders example component", () => {
  render(<ExampleComponent />);
  expect(screen.getByText("Hello Jest + SWC!")).toBeInTheDocument();
});
