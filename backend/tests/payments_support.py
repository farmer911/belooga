"""Test helpers for the MoMo payment flow: a fake MoMo create endpoint and signed IPN bodies."""

import hashlib
import hmac
from typing import Any

import pytest
from httpx import AsyncClient

from app.modules.payments import service as payment_service

PARTNER, ACCESS, SECRET = "MOMOTEST", "test_access_key", "test_secret_key"


class FakeMomo:
    """Stands in for httpx.AsyncClient inside the payments service and records create requests."""

    requests: list[dict[str, Any]] = []
    result_code = 0

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        pass

    async def __aenter__(self) -> "FakeMomo":
        return self

    async def __aexit__(self, *exc: Any) -> None:
        return None

    async def post(self, url: str, json: dict[str, Any]) -> Any:
        FakeMomo.requests.append({"url": url, "json": json})
        body = {
            "resultCode": FakeMomo.result_code,
            "message": "ok" if FakeMomo.result_code == 0 else "rejected",
            "payUrl": f"https://test-payment.momo.vn/pay/{json['orderId']}",
            "qrCodeUrl": "momo://qr",
            "deeplink": "momo://app",
        }

        class _Res:
            status_code = 200
            headers = {"content-type": "application/json"}

            @staticmethod
            def json() -> dict[str, Any]:
                return body

        return _Res()


def configure_momo(monkeypatch: pytest.MonkeyPatch) -> type[FakeMomo]:
    monkeypatch.setenv("MOMO_PARTNER_CODE", PARTNER)
    monkeypatch.setenv("MOMO_ACCESS_KEY", ACCESS)
    monkeypatch.setenv("MOMO_SECRET_KEY", SECRET)
    FakeMomo.requests = []
    FakeMomo.result_code = 0
    monkeypatch.setattr(payment_service.httpx, "AsyncClient", FakeMomo)
    return FakeMomo


def hmac_hex(raw: str, secret: str = SECRET) -> str:
    return hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest()


def signed_ipn(order_id: str, amount: int, result_code: int = 0, trans_id: int = 4088878653) -> dict[str, Any]:
    body: dict[str, Any] = {
        "partnerCode": PARTNER, "orderId": order_id, "requestId": order_id, "amount": amount,
        "orderInfo": "Belooga", "orderType": "momo_wallet", "transId": trans_id, "resultCode": result_code,
        "message": "Successful.", "payType": "qr", "responseTime": 1730000000000, "extraData": "",
    }
    raw = (
        f"accessKey={ACCESS}&amount={amount}&extraData=&message=Successful.&orderId={order_id}"
        f"&orderInfo=Belooga&orderType=momo_wallet&partnerCode={PARTNER}&payType=qr&requestId={order_id}"
        f"&responseTime=1730000000000&resultCode={result_code}&transId={trans_id}"
    )
    body["signature"] = hmac_hex(raw)
    return body


async def fund_wallet(client: AsyncClient, token: str, amount_vnd: int, monkeypatch: pytest.MonkeyPatch) -> None:
    """Top up through the real API path: create a MoMo order, then deliver a signed IPN."""
    configure_momo(monkeypatch)
    res = await client.post(
        "/v1/wallet/topup", json={"amount_vnd": amount_vnd}, headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201, res.text
    ipn = await client.post("/v1/payments/momo/ipn", json=signed_ipn(res.json()["order_id"], amount_vnd))
    assert ipn.status_code == 204, ipn.text
