"""TDD Integration Tests for BEL-160 (#81):
- GET /v1/wallet/, POST /v1/wallet/topup, POST /v1/wallet/pay
- POST /v1/expert-review/orders/{order_id}/simulate-delivery & /complete
"""

import pytest
from httpx import AsyncClient

from tests.payments_support import fund_wallet


@pytest.mark.asyncio
async def test_wallet_topup_pay_and_expert_escrow_fulfillment_flow(
    client: AsyncClient,
    test_candidate_a: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    """Verify end-to-end Wallet ledger (topup, pay, insufficient funds guard) and Expert Escrow delivery & release."""
    headers = {"Authorization": f"Bearer {test_candidate_a['token']}"}

    # 1. New wallets start empty; money only arrives through a signed MoMo IPN
    w0 = (await client.get("/v1/wallet/", headers=headers)).json()
    assert w0["available_balance_vnd"] == 0 and w0["escrow_locked_vnd"] == 0

    # 2. Top-up 1,500,000 VND via MoMo order + IPN
    await fund_wallet(client, test_candidate_a["token"], 1500000, monkeypatch)
    w1 = (await client.get("/v1/wallet/", headers=headers)).json()
    assert w1["available_balance_vnd"] == 1500000
    assert w1["transactions"][0]["tx_type"] == "TOPUP"
    assert w1["transactions"][0]["amount_vnd"] == 1500000

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

    # 4. Pay the "pro" package (5900 USD cents x 250 = 1,475,000 VND) via Wallet Escrow Lock
    pay_res = await client.post(
        "/v1/wallet/pay",
        json={
            "amount_vnd": 1475000,
            "target_type": "EXPERT_ESCROW_LOCK",
            "order_id": order_id,
            "description": "Tạm giữ Escrow đơn chấm CV Expert Review",
        },
        headers=headers,
    )
    assert pay_res.status_code == 200
    w2 = pay_res.json()
    assert w2["available_balance_vnd"] == w1["available_balance_vnd"] - 1475000
    assert w2["escrow_locked_vnd"] == w1["escrow_locked_vnd"] + 1475000
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
    assert w_final["escrow_locked_vnd"] == 0
    assert w_final["available_balance_vnd"] == 25000
    assert any(t["tx_type"] == "EXPERT_ESCROW_RELEASE" for t in w_final["transactions"])
