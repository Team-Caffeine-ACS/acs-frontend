import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import EditKeycardPage from "@/app/(protected)/keys/[id]/edit/page";
import { getKeycard, updateKeycard } from "@/lib/api/keycards";
import { useCurrentUser } from "@/components/layout/current-user-provider";

// 1. MOCKID
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/keycards", () => ({
  getKeycard: jest.fn(),
  updateKeycard: jest.fn(),
}));

// NB! useCurrentUser peab olema jest.fn(), et saaksime selle väärtust testides muuta
jest.mock("@/components/layout/current-user-provider", () => ({
  useCurrentUser: jest.fn(),
}));

describe("EditKeycardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Vaikimisi oleme sisselogitud Adminina
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: { role: "ADMIN", name: "Test Admin" },
      status: "authenticated",
    });
  });

  test("laeb andmed ja täidab vormi", async () => {
    (getKeycard as jest.Mock).mockResolvedValue({
      keycardNumber: "999-888",
      active: true,
      validUntil: null,
    });

    render(<EditKeycardPage />);

    const input = await screen.findByDisplayValue("999-888");
    expect(input).toBeInTheDocument();
  });

  test("lubab muuta kaardi numbrit ja salvestada", async () => {
    (getKeycard as jest.Mock).mockResolvedValue({
      keycardNumber: "999-888",
      active: true,
    });
    (updateKeycard as jest.Mock).mockResolvedValue({ success: true });

    render(<EditKeycardPage />);

    const input = await screen.findByDisplayValue("999-888");
    fireEvent.change(input, { target: { value: "111-222" } });

    const saveButton = screen.getByRole("button", { name: /Salvesta/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateKeycard).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({
          keycardNumber: "111-222",
        }),
      );
    });
  });

  test("näitab veateadet, kui andmete laadimine ebaõnnestub", async () => {
    // Simuleerime API viga
    (getKeycard as jest.Mock).mockRejectedValue(new Error("API viga"));

    render(<EditKeycardPage />);

    // See tekst peab ühtima sinu terminalis nähtud tekstiga!
    const errorMsg = await screen.findByText(
      /Võtmekaardi andmete laadimine ebaõnnestus/i,
    );
    expect(errorMsg).toBeInTheDocument();
  });

  test("näitab sisu, kui andmed on laetud", async () => {
    // 1. Mockime eduka vastuse
    (getKeycard as jest.Mock).mockResolvedValue({
      keycardNumber: "999-888",
      active: true,
    });

    // 2. Hoiame admin rolli, et vältida "õiguste" viga
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: { role: "ADMIN" },
      status: "authenticated",
    });

    render(<EditKeycardPage />);

    // 3. Kontrollime pealkirja, mis on su terminali väljundis näha
    const title = await screen.findByText(/Muuda võtmekaarti/i);
    expect(title).toBeInTheDocument();
  });
});
