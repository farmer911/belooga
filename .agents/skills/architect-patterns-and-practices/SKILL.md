---
name: architect-patterns-and-practices
description: Authoritative Technical Standard & System Architecture Patterns for Principal Architects and Technical Directors. Enforces zero-compromise best practices across Distributed System Reliability, Transactional Outbox Pattern, Circuit Breakers with Jitter, SAGA Distributed Transactions, Inward Dependency Rules, and Dual-Key Reviewer Governance.
---

# 🏛️ PRINCIPAL SYSTEMS ARCHITECT — PRODUCTION PATTERNS & STANDARDS

> **Role Authority:** Principal Systems Architect & Chief Technology Officer (10+ Years Experience)  
> **Status:** MANDATORY & ENFORCED FOR ALL SYSTEM TOPOLOGIES & CROSS-DOMAIN DESIGNS  
> **Core Principle:** ZERO-COMPROMISE PRODUCTION STANDARD. No single point of failure (SPOF), no dual-write distributed corruption, no cascading service collapse, and absolute empirical proof of completion.

---

## 1. DISTRIBUTED DATA CONSISTENCY & THE TRANSACTIONAL OUTBOX PATTERN

* **The Problem (Dual-Write Failure Mode):** An application cannot update a local database and publish an event to a remote message broker (Kafka, RabbitMQ, Redis) atomically across a network. If one succeeds and the other fails, data becomes corrupt permanently.
* **The Invariant:** All domain events MUST be persisted within the SAME database transaction as the business entity mutation.
* **Best Practice Blueprint:**
  ```
  ┌────────────────────────────────────────────────────────┐
  │ 1. INCOMING COMMAND REQUEST (e.g. Upload Video Pitch)   │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. ATOMIC DATABASE TRANSACTION BEGINS                  │
  │ • Write Entity: INSERT INTO media_files (...)          │
  │ • Write Event:  INSERT INTO outbox_events (            │
  │     event_type = 'video.uploaded', payload = {...}     │
  │   )                                                    │
  │ • ATOMIC COMMIT OR ROLLBACK                            │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. CHANGE DATA CAPTURE (CDC) / OUTBOX POLLER           │
  │ • Reads outbox_events table reliably                   │
  │ • Publishes to Message Broker with At-Least-Once ack   │
  │ • Marks event as PROCESSED                             │
  └────────────────────────────────────────────────────────┘
  ```

---

## 2. SYSTEM RESILIENCE & CASCADING FAILURE PREVENTION

When integrating with third-party APIs (Cloudflare, AWS S3, OAuth providers, AI inference engines), systems must withstand dependency degradation without collapsing.

### 2.1. Circuit Breaker Pattern
* **State Machine:**
  * `CLOSED`: Normal operation; all requests pass through.
  * `OPEN`: If error rate exceeds 50% over a 10-second rolling window, open circuit immediately. Fail fast with an instant 503 error without calling the external dependency.
  * `HALF-OPEN`: After a 30-second cooldown, allow a single probe request. If successful, reset to `CLOSED`; if failed, return to `OPEN`.

### 2.2. Exponential Backoff with Full Jitter
* Retrying failed network requests at fixed intervals causes the **Thundering Herd Problem**, overwhelming recovering servers.
* **Mandatory Algorithm:**
  $$T_{\text{delay}} = \text{random}(0, \min(M_{\max}, B \times 2^{\text{attempt}}))$$
  *Where $B = 0.5\text{s}$, $M_{\max} = 10\text{s}$.*

---

## 3. CROSS-SERVICE TRANSACTIONS: THE SAGA PATTERN

* **The Invariant:** Distributed 2-Phase Commit (2PC) does not scale and creates distributed locking bottlenecks. Multi-service business workflows must implement the SAGA Pattern.
* **Choreography vs. Orchestration:**
  * **Choreography (Event-Driven):** For small workflows ($\le 3$ services). Services react to domain events independently.
  * **Orchestration (Centralized Coordinator):** For complex business workflows ($\ge 4$ steps, e.g. candidate onboarding: identity ➔ profile ➔ media upload ➔ search vector compilation). A centralized SAGA Orchestrator manages state transitions and executes **Compensating Transactions** if any step fails.

---

## 4. INWARD DEPENDENCY RULE & ARCHITECTURAL PURITY

Every module in the Belooga enterprise must adhere to strict boundary isolation:
1. **Domain Core:** Contains zero dependencies on database drivers, web frameworks, or third-party SDKs.
2. **Pluggable Adapters:** Third-party storage (S3/Disk), mailers, and payment processors must implement an internal abstract interface. Swapping a vendor requires editing only 1 adapter file, leaving 100% of domain services untouched.
3. **Conway's Law Alignment:** Code directories must mirror operational domain boundaries to prevent cross-team merge conflicts and deployment deadlocks.

---

## 5. DUAL-KEY CODE REVIEW GOVERNANCE

Trust in autonomous execution agents is capped at **50%**. No feature branch or pull request is merged without passing through the **Dual-Key Reviewer Gate**:

```
┌────────────────────────────────────────────────────────────┐
│ PULL REQUEST (PROPOSED CODE MODIFICATIONS)                 │
└─────────────────────────────┬──────────────────────────────┘
                              ▼
          ┌───────────────────────────────────────┐
          │ DUAL-KEY ADVERSARIAL REVIEWERS        │
          ├───────────────────┬───────────────────┤
          │ Senior FE Reviewer│ Senior BE Reviewer│
          │ (`fe-reviewer`)   │ (`be-reviewer`)   │
          └─────────┬─────────┴─────────┬─────────┘
                    │                   │
                    ▼                   ▼
          [Both Reviewers Emit Formal APPROVAL?]
                    │
            NO ─────┴───── YES
            │               │
            ▼               ▼
      [REJECT TO AGENT]   [CHIEF ARCHITECT FINAL SIGN-OFF & MERGE]
```

---

## 6. REJECTION CHECKLIST FOR PRINCIPAL ARCHITECT AUDITS

Before approving any architectural design proposal:
- [ ] No direct synchronous dependencies exist between decoupled service domains.
- [ ] Any distributed mutation includes an Outbox or SAGA Compensating Transaction strategy.
- [ ] External APIs are guarded by Circuit Breakers and Jittered Retries.
- [ ] Database locking strategy prevents deadlocks via deterministic row ordering.
- [ ] The change introduces zero breaking changes to existing client API contracts.
