"""TDD Test Suite for BEL-516: Kafka-Style Partitioned Event Stream, DLQ, and Kubernetes Probes."""

import os
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.events import PartitionedEventStream
from app.main import app


@pytest.mark.asyncio
async def test_partitioned_event_stream_ordering_consumer_group_and_dlq():
    """Verify Kafka-style key partitioning, FIFO ordering per partition, consumer offsets, and DLQ."""
    broker = PartitionedEventStream(topic="test.domain.events", num_partitions=4, max_retries=2)
    processed_keys = []

    async def handler(evt: dict):
        if evt["payload"].get("poison"):
            raise RuntimeError("Simulated downstream handler failure")
        processed_keys.append((evt["partition"], evt["offset"], evt["payload"]["seq"]))

    broker.subscribe("analytics-consumer-group", handler)

    # 1. Same partition_key always maps to the exact same partition in strict FIFO order
    p0 = broker.publish(event_type="PROFILE_VIEWED", partition_key="user_alex", payload={"seq": 1})
    p1 = broker.publish(event_type="PROFILE_VIEWED", partition_key="user_alex", payload={"seq": 2})
    p2 = broker.publish(event_type="PROFILE_VIEWED", partition_key="user_alex", payload={"seq": 3})
    assert p0["partition"] == p1["partition"] == p2["partition"]
    assert [p0["offset"], p1["offset"], p2["offset"]] == [0, 1, 2]

    # 2. Publish a poison event that will fail and route to Dead-Letter Queue (DLQ)
    broker.publish(event_type="WEBHOOK_FAILED", partition_key="user_poison", payload={"seq": 99, "poison": True})

    stats_before = broker.get_status()
    assert stats_before["total_published"] == 4
    assert stats_before["total_lag"] == 4

    summary = await broker.drain_all()
    assert summary["processed"] == 3
    assert summary["dlq_routed"] == 1

    stats_after = broker.get_status()
    assert stats_after["total_lag"] == 0
    assert stats_after["dlq_size"] == 1
    assert stats_after["dlq_Sample"][0]["event_type"] == "WEBHOOK_FAILED"
    assert [item[2] for item in processed_keys] == [1, 2, 3]


@pytest.mark.asyncio
async def test_event_stream_api_endpoints_and_k8s_liveness_readiness_probes():
    """Verify /v1/events/status, /v1/events/publish, /health/live, /health/ready, and k8s manifests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Kubernetes Liveness Probe (non-DB event-loop check)
        live_res = await client.get("/health/live")
        assert live_res.status_code == 200
        live_body = live_res.json()
        assert live_body["status"] == "alive"
        assert live_body["probe"] == "liveness"

        # 2. Kubernetes Readiness Probe (DB + Cache + Event Stream readiness check)
        ready_res = await client.get("/health/ready")
        assert ready_res.status_code == 200
        ready_body = ready_res.json()
        assert ready_body["status"] == "ready"
        assert ready_body["probe"] == "readiness"
        assert ready_body["checks"]["postgres"] == "ok"
        assert ready_body["checks"]["cache"] == "ok"
        assert ready_body["checks"]["event_stream"] == "ok"

        # 3. Publish & Drain Domain Event via /v1/events/*
        pub_res = await client.post(
            "/v1/events/publish",
            json={
                "event_type": "CANDIDATE_SHORTLISTED",
                "partition_key": "alexnguyen",
                "payload": {"recruiter": "stripe_hr", "score": 94},
            },
        )
        assert pub_res.status_code == 200
        pub_data = pub_res.json()
        assert "partition" in pub_data
        assert "offset" in pub_data

        status_res = await client.get("/v1/events/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["num_partitions"] == 4
        assert status_data["total_published"] >= 1

    # 4. Verify production Kubernetes Deployment + HPA manifest exists
    k8s_path = os.path.join(os.path.dirname(__file__), "..", "..", "k8s", "deployment-and-hpa.yaml")
    assert os.path.exists(k8s_path)
    with open(k8s_path, "r", encoding="utf-8") as f:
        k8s_yaml = f.read()
    assert "/health/live" in k8s_yaml
    assert "/health/ready" in k8s_yaml
    assert "HorizontalPodAutoscaler" in k8s_yaml

    # 5. Verify Frontend Service Worker (sw.js) and PWA Manifest exist and enforce security bypasses
    repo_root = os.path.join(os.path.dirname(__file__), "..", "..")
    sw_path = os.path.join(repo_root, "frontend", "public", "sw.js")
    manifest_path = os.path.join(repo_root, "frontend", "public", "manifest.webmanifest")
    assert os.path.exists(sw_path)
    assert os.path.exists(manifest_path)
    with open(sw_path, "r", encoding="utf-8") as f:
        sw_code = f.read()
    assert "belooga-static-v1" in sw_code
    assert "belooga-api-swr-v1" in sw_code
    assert "QUEUE_OFFLINE_MUTATION" in sw_code
    assert "notificationclick" in sw_code
    assert 'request.headers.get("Authorization")' in sw_code
    assert 'request.headers.get("Range")' in sw_code
