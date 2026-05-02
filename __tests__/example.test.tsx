import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

import EditKeycardPage from "../app/(protected)/keys/[id]/edit/page";

// 1. MOCKID (Peavad olema enne teste)

// Mockime Next.js navigatsiooni
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Mockime API väljakutsed
jest.mock("@/lib/api/keycards", () => ({
  getKeycard: jest.fn(() =>
    Promise.resolve({
      keycardNumber: "999-888",
      active: true,
      validUntil: null,
    }),
  ),
  // Lisame ka update, et vältida vigu kui kood seda kuskil viitab
  updateKeycard: jest.fn(),
}));

// Mockime kasutaja sessiooni
jest.mock("@/components/layout/current-user-provider", () => ({
  useCurrentUser: () => ({
    user: { role: "ADMIN", name: "Test User" },
    status: "authenticated",
  }),
}));

// 2. TESTID

// Lihtne näidistest, et kontrollida kas Jest üldse töötab
test("renders example component", () => {
  render(<div>Hello Jest + SWC!</div>);
  expect(screen.getByText("Hello Jest + SWC!")).toBeInTheDocument();
});

// Päris lehe test
test("renders EditKeycardPage and shows content", async () => {
  render(<EditKeycardPage />);

  // findByText ootab kuni useEffect ja API päring on valmis (vaikimisi kuni 1s)
  const title = await screen.findByText(/Muuda võtmekaarti/i);
  expect(title).toBeInTheDocument();

  // Kontrollime, et API-st tulnud kaardi number on ekraanil
  const input = await screen.findByDisplayValue("999-888");
  expect(input).toBeInTheDocument();
});
