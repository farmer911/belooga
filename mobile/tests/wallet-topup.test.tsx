import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as WebBrowser from "expo-web-browser";
import CareerScreen from "../app/(tabs)/career";
import { mockFetch, on, renderWithQuery, resetSession, signIn } from "./test-utils";

beforeEach(resetSession);

const PAY_URL = "https://test-payment.momo.vn/v2/gateway/pay?orderId=topup_1";

it("opens the MoMo pay URL and re-reads the wallet instead of crediting the balance locally", async () => {
  signIn();
  const calls = mockFetch(
    on("GET", "/v1/wallet/balance", { available_balance_vnd: 0, escrow_locked_vnd: 0, transactions: [] }),
    on("POST", "/v1/wallet/topup", { order_id: "topup_1", pay_url: PAY_URL, status: "PENDING" })
  );

  await renderWithQuery(<CareerScreen />);
  expect(await screen.findByText("Khả dụng: 0 VND")).toBeTruthy();

  await fireEvent.press(screen.getByTestId("mobile-wallet-topup-chip-500000"));
  await fireEvent.press(screen.getByTestId("mobile-wallet-topup-submit-btn"));

  await waitFor(() => expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(PAY_URL));
  const topup = calls.find((c) => c.method === "POST");
  expect(topup?.body).toEqual({ amount_vnd: 500000, payment_method: "MOMO_QR" });
  expect(topup?.headers.Authorization).toBe("Bearer access-1");

  expect(await screen.findByTestId("mobile-wallet-topup-pending")).toBeTruthy();
  await waitFor(() => expect(calls.filter((c) => c.url.endsWith("/v1/wallet/balance"))).toHaveLength(2));
  // Server still reports 0 until the IPN lands; the UI must not show 500k.
  expect(screen.getByText("Khả dụng: 0 VND")).toBeTruthy();
  expect(screen.queryByText(/500\.000 VND/)).toBeNull();
});

it("reports an error and opens nothing when the API returns no pay URL", async () => {
  signIn();
  mockFetch(
    on("GET", "/v1/wallet/balance", { available_balance_vnd: 0, escrow_locked_vnd: 0 }),
    on("POST", "/v1/wallet/topup", { available_balance_vnd: 100000, escrow_locked_vnd: 0 })
  );

  await renderWithQuery(<CareerScreen />);
  await fireEvent.press(await screen.findByTestId("mobile-wallet-topup-submit-btn"));

  expect(await screen.findByTestId("mobile-wallet-topup-error")).toBeTruthy();
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

it("asks anonymous users to sign in instead of querying the demo wallet", async () => {
  const calls = mockFetch();
  await renderWithQuery(<CareerScreen />);
  expect(screen.getByTestId("mobile-wallet-signin")).toBeTruthy();
  expect(calls).toHaveLength(0);
});
