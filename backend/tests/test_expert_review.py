"""Integration and Security Tests for Domain 9: Expert CV Review & Monetization."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_experts_and_packages(client: AsyncClient):
    """Verify public endpoints return seeded experts and review packages."""
    # 1. List packages
    res_pkg = await client.get("/v1/expert-review/packages/")
    assert res_pkg.status_code == 200
    packages = res_pkg.json()
    assert len(packages) >= 3
    slugs = [p["slug"] for p in packages]
    assert "essential" in slugs
    assert "pro" in slugs
    assert "elite" in slugs

    # 2. List experts
    res_exp = await client.get("/v1/expert-review/experts/")
    assert res_exp.status_code == 200
    experts = res_exp.json()
    assert len(experts) >= 3
    names = [e["full_name"] for e in experts]
    assert any("Sarah" in n or "Alex" in n for n in names)

    # 3. Filter experts by category
    res_filtered = await client.get("/v1/expert-review/experts/?category=Frontend")
    assert res_filtered.status_code == 200
    filtered = res_filtered.json()
    assert any("Frontend" in e["role_category"] for e in filtered)


@pytest.mark.asyncio
async def test_order_creation_checkout_and_idor_protection(
    client: AsyncClient, test_candidate_a: dict, test_candidate_b: dict
):
    """Verify order creation, checkout state transitions, and IDOR protection."""
    token_a = test_candidate_a["token"]
    token_b = test_candidate_b["token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Unauthenticated creation must fail with 401
    res_unauth = await client.post(
        "/v1/expert-review/orders/",
        json={
            "package_slug": "pro",
            "resume_url": "/uploads/resumes/usera_cv.pdf",
            "target_role": "Senior Frontend Engineer",
        },
    )
    assert res_unauth.status_code == 401

    # 2. Authenticated creation for User A
    order_payload = {
        "package_slug": "pro",
        "resume_url": "/uploads/resumes/usera_cv.pdf",
        "target_role": "Senior Frontend Engineer",
        "target_companies": "Google, Stripe",
        "candidate_notes": "Please focus on quantifying impact in the experience section.",
    }
    res_order = await client.post(
        "/v1/expert-review/orders/", json=order_payload, headers=headers_a
    )
    assert res_order.status_code == 201
    order = res_order.json()
    assert order["package_slug"] == "pro"
    assert order["order_status"] == "pending_payment"
    assert order["amount_paid_cents"] == 5900
    order_id = order["id"]

    # 3. IDOR Guard: User B attempting to checkout User A's order must receive 403 Forbidden
    res_idor = await client.post(
        f"/v1/expert-review/orders/{order_id}/checkout/",
        json={"payment_method": "card"},
        headers=headers_b,
    )
    assert res_idor.status_code == 403

    # 4. User A successfully checks out their order
    res_checkout = await client.post(
        f"/v1/expert-review/orders/{order_id}/checkout/",
        json={"payment_method": "stripe_card", "coupon_code": "BELOOGA10"},
        headers=headers_a,
    )
    assert res_checkout.status_code == 200
    paid_order = res_checkout.json()
    assert paid_order["order_status"] == "paid"
    assert "stripe_card" in paid_order["payment_reference"]

    # 5. User A lists their orders
    res_my_orders = await client.get("/v1/expert-review/orders/my-orders/", headers=headers_a)
    assert res_my_orders.status_code == 200
    my_orders = res_my_orders.json()
    assert len(my_orders) >= 1
    assert any(o["id"] == order_id for o in my_orders)
