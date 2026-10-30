"""Integration tests for Domain 13: MoMo payments, IPN verification and wallet ledger."""

import asyncio

import pytest
from httpx import AsyncClient

from tests.payments_support import ACCESS, PARTNER, configure_momo, fund_wallet, hmac_hex, signed_ipn


def _auth(user: dict) -> dict:
    return {"Authorization": f"Bearer {user['token']}"}


@pytest.mark.asyncio
async def test_create_payment_signs_request_and_uses_server_price(
    client: AsyncClient, test_candidate_a: dict, monkeypatch: pytest.MonkeyPatch
):
    fake = configure_momo(monkeypatch)
    res = await client.post(
        "/v1/payments/momo/create-qr",
        json={"package_type": "MICRO_PASS_29K", "amount": 1, "order_info": "ATS pass"},
        headers=_auth(test_candidate_a),
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["amount"] == 29000  # client-sent amount is ignored
    assert data["pay_url"].startswith("https://test-payment.momo.vn/")

    sent = fake.requests[0]["json"]
    raw = (
        f"accessKey={ACCESS}&amount=29000&extraData=&ipnUrl={sent['ipnUrl']}&orderId={data['order_id']}"
        f"&orderInfo=ATS pass&partnerCode={PARTNER}&redirectUrl={sent['redirectUrl']}"
        f"&requestId={data['order_id']}&requestType=captureWallet"
    )
    assert sent["signature"] == hmac_hex(raw)

    status_res = await client.get(
        f"/v1/payments/momo/order-status/{data['order_id']}", headers=_auth(test_candidate_a)
    )
    assert status_res.json()["status"] == "PENDING"


@pytest.mark.asyncio
async def test_payment_endpoints_require_auth_and_hide_other_users_orders(
    client: AsyncClient, test_candidate_a: dict, test_candidate_b: dict, monkeypatch: pytest.MonkeyPatch
):
    configure_momo(monkeypatch)
    body = {"package_type": "MICRO_PASS_59K", "order_info": "x"}
    assert (await client.post("/v1/payments/momo/create-qr", json=body)).status_code == 401
    assert (await client.get("/v1/wallet/")).status_code == 401
    assert (await client.post("/v1/wallet/topup", json={"amount_vnd": 50000})).status_code == 401
    assert (await client.post("/v1/wallet/pay", json={"amount_vnd": 1000})).status_code == 401

    created = await client.post("/v1/payments/momo/create-qr", json=body, headers=_auth(test_candidate_a))
    order_id = created.json()["order_id"]
    other = await client.get(f"/v1/payments/momo/order-status/{order_id}", headers=_auth(test_candidate_b))
    assert other.status_code == 404


@pytest.mark.asyncio
async def test_unconfigured_momo_returns_503(client: AsyncClient, test_candidate_a: dict, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("MOMO_PARTNER_CODE", raising=False)
    res = await client.post("/v1/wallet/topup", json={"amount_vnd": 50000}, headers=_auth(test_candidate_a))
    assert res.status_code == 503


@pytest.mark.asyncio
async def test_topup_credits_only_after_valid_ipn_and_is_idempotent(
    client: AsyncClient, test_candidate_a: dict, monkeypatch: pytest.MonkeyPatch
):
    configure_momo(monkeypatch)
    headers = _auth(test_candidate_a)
    w0 = (await client.get("/v1/wallet/", headers=headers)).json()
    assert w0["available_balance_vnd"] == 0  # new wallets start empty

    order = (await client.post("/v1/wallet/topup", json={"amount_vnd": 200000}, headers=headers)).json()
    assert (await client.get("/v1/wallet/", headers=headers)).json()["available_balance_vnd"] == 0

    forged = {**signed_ipn(order["order_id"], 200000), "signature": "0" * 64}
    assert (await client.post("/v1/payments/momo/ipn", json=forged)).status_code == 400
    tampered = {**signed_ipn(order["order_id"], 200000), "amount": 900000}
    assert (await client.post("/v1/payments/momo/ipn", json=tampered)).status_code == 400

    good = signed_ipn(order["order_id"], 200000)
    assert (await client.post("/v1/payments/momo/ipn", json=good)).status_code == 204
    assert (await client.post("/v1/payments/momo/ipn", json=good)).status_code == 204  # replay
    w1 = (await client.get("/v1/wallet/", headers=headers)).json()
    assert w1["available_balance_vnd"] == 200000
    assert [t["tx_type"] for t in w1["transactions"]] == ["TOPUP"]
    status_res = await client.get(f"/v1/payments/momo/order-status/{order['order_id']}", headers=headers)
    assert status_res.json()["status"] == "PAID"


@pytest.mark.asyncio
async def test_failed_ipn_marks_order_failed_without_credit(
    client: AsyncClient, test_candidate_a: dict, monkeypatch: pytest.MonkeyPatch
):
    configure_momo(monkeypatch)
    headers = _auth(test_candidate_a)
    order = (await client.post("/v1/wallet/topup", json={"amount_vnd": 100000}, headers=headers)).json()
    failed = signed_ipn(order["order_id"], 100000, result_code=1006)
    assert (await client.post("/v1/payments/momo/ipn", json=failed)).status_code == 204
    status_res = await client.get(f"/v1/payments/momo/order-status/{order['order_id']}", headers=headers)
    assert status_res.json()["status"] == "FAILED"
    assert (await client.get("/v1/wallet/", headers=headers)).json()["available_balance_vnd"] == 0


@pytest.mark.asyncio
async def test_concurrent_wallet_payments_cannot_overdraw(
    client: AsyncClient, test_candidate_a: dict, monkeypatch: pytest.MonkeyPatch
):
    await fund_wallet(client, test_candidate_a["token"], 50000, monkeypatch)
    headers = _auth(test_candidate_a)
    results = await asyncio.gather(*[
        client.post("/v1/wallet/pay", json={"amount_vnd": 20000, "description": f"buy {i}"}, headers=headers)
        for i in range(5)
    ])
    assert sorted(r.status_code for r in results) == [200, 200, 400, 400, 400]
    assert (await client.get("/v1/wallet/", headers=headers)).json()["available_balance_vnd"] == 10000


def test_momo_secret_key_production_guard_and_cors_origins(monkeypatch: pytest.MonkeyPatch):
    """MOMO_SECRET_KEY is mandatory in production; CORS_ORIGINS parses env."""
    from app.modules.payments.service import get_momo_secret_key
    from app.main import get_cors_origins

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("MOMO_SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError, match="MOMO_SECRET_KEY"):
        get_momo_secret_key()

    monkeypatch.setenv("CORS_ORIGINS", "https://belooga.com, https://app.belooga.com ")
    assert get_cors_origins() == ["https://belooga.com", "https://app.belooga.com"]
