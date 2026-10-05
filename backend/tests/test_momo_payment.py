"""Integration Tests for Domain 13: MoMo Payments & Webhook Idempotency Engine."""

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_momo_payment_flow_and_idempotency(client: AsyncClient):
    """Test full MoMo payment cycle: Create QR -> Check Status -> IPN Webhook -> Idempotent Guard."""
    # 1. Create QR Payment for Micro-Pass 29k
    create_payload = {
        "package_type": "MICRO_PASS_29K",
        "amount": 29000.0,
        "order_info": "Gói 1-Click Tối Ưu Lề CV Chuẩn ATS"
    }
    res_create = await client.post("/v1/payments/momo/create-qr", json=create_payload)
    assert res_create.status_code == 201
    order_data = res_create.json()
    order_id = order_data["order_id"]
    assert order_id.startswith("MOMO-")
    assert order_data["amount"] == 29000.0
    assert "qr_code_url" in order_data

    # 2. Poll initial order status -> Must be PENDING
    res_status_1 = await client.get(f"/v1/payments/momo/order-status/{order_id}")
    assert res_status_1.status_code == 200
    assert res_status_1.json()["status"] == "PENDING"

    # 3. Simulate MoMo IPN Webhook Success Call
    ipn_payload = {
        "order_id": order_id,
        "trans_id": "MOMO_TRANS_998877",
        "result_code": 0,
        "signature": "mock_signature_valid",
        "amount": 29000.0
    }
    res_ipn = await client.post("/v1/payments/momo/ipn", json=ipn_payload)
    assert res_ipn.status_code == 200
    assert res_ipn.json()["status"] == "PAID"

    # 4. Assert order status changed to PAID
    res_status_2 = await client.get(f"/v1/payments/momo/order-status/{order_id}")
    assert res_status_2.status_code == 200
    assert res_status_2.json()["status"] == "PAID"

    # 5. Idempotency Guard: Second IPN call with same order_id must not double-charge
    res_ipn_duplicate = await client.post("/v1/payments/momo/ipn", json=ipn_payload)
    assert res_ipn_duplicate.status_code == 200
    assert res_ipn_duplicate.json()["status"] == "ALREADY_PROCESSED"
