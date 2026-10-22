"""TDD Integration Tests for BEL-160 (#81):
- GET /v1/wallet/, POST /v1/wallet/topup, POST /v1/wallet/pay
- POST /v1/expert-review/orders/{order_id}/simulate-delivery & /complete
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_wallet_topup_pay_and_expert_escrow_fulfillment_flow(
    client: AsyncClient,
    test_candidate_a: dict,
):
    """Verify end-to-end Wallet ledger (topup, pay, insufficient funds guard) and Expert Escrow delivery & release."""
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. Fetch initial wallet state
    w_res = await client.get("/v1/wallet/", headers=headers)
    assert w_res.status_code == 200
    w0 = w_res.json()
    assert "available_balance_vnd" in w0
    assert "escrow_locked_vnd" in w0
    assert isinstance(w0["transactions"], list)
    init_avail = w0["available_balance_vnd"]

    # 2. Top-up +500,000 VND
    top_res = await client.post(
        "/v1/wallet/topup",
        json={"amount_vnd": 500000, "payment_method": "MoMo QR"},
        headers=headers,
    )
    assert top_res.status_code == 200
    w1 = top_res.json()
    assert w1["available_balance_vnd"] == init_avail + 500000
    assert w1["transactions"][0]["tx_type"] == "TOPUP"
    assert w1["transactions"][0]["amount_vnd"] == 500000

    # 3. Create an Expert Review Order
    ord_res = await client.post(
        "/v1/expert-review/orders/",
        json={
            "package_slug": "pro",
            "resume_url": "https://belooga.com/cv/candidate_a.pdf",
            "target_role": "Senior Golang Engineer",
            "target_companies": "VNG, MoMo",
        },
        headers=headers,
    )
    assert ord_res.status_code == 201
    order_id = ord_res.json()["id"]

    # 4. Pay for Expert Review Order via Wallet Escrow Lock (490,000 VND)
    pay_res = await client.post(
        "/v1/wallet/pay",
        json={
            "amount_vnd": 490000,
            "target_type": "EXPERT_ESCROW_LOCK",
            "order_id": order_id,
            "description": "Tạm giữ Escrow đơn chấm CV Expert Review",
        },
        headers=headers,
    )
    assert pay_res.status_code == 200
    w2 = pay_res.json()
    assert w2["available_balance_vnd"] == w1["available_balance_vnd"] - 490000
    assert w2["escrow_locked_vnd"] == w1["escrow_locked_vnd"] + 490000
    assert w2["transactions"][0]["tx_type"] == "EXPERT_ESCROW_LOCK"

    # 5. Insufficient balance guard (attempt to pay 999,000,000 VND)
    bad_pay = await client.post(
        "/v1/wallet/pay",
        json={
            "amount_vnd": 999000000,
            "target_type": "SYSTEM_PURCHASE",
            "description": "Overdraft attempt",
        },
        headers=headers,
    )
    assert bad_pay.status_code == 400

    # 6. Simulate Expert Review Delivery -> generates detailed critique report & notification
    sim_res = await client.post(
        f"/v1/expert-review/orders/{order_id}/simulate-delivery",
        json={},
        headers=headers,
    )
    assert sim_res.status_code == 200
    sim_ord = sim_res.json()
    assert sim_ord["feedback"] is not None
    assert sim_ord["feedback"]["score_overall"] >= 85
    assert "STAR" in sim_ord["feedback"]["summary_verdict"]

    # 7. Complete Order & Release Escrow (92% Expert / 8% Platform Fee)
    comp_res = await client.post(
        f"/v1/expert-review/orders/{order_id}/complete",
        json={},
        headers=headers,
    )
    assert comp_res.status_code == 200
    comp_ord = comp_res.json()
    assert comp_ord["order_status"] == "completed"

    # Verify wallet escrow_locked_vnd decreased and EXPERT_ESCROW_RELEASE transaction recorded
    w_final = (await client.get("/v1/wallet/", headers=headers)).json()
    assert w_final["escrow_locked_vnd"] < w2["escrow_locked_vnd"]
    assert any(t["tx_type"] == "EXPERT_ESCROW_RELEASE" for t in w_final["transactions"])
