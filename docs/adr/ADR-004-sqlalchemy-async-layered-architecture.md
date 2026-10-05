# ADR-004: SQLAlchemy 2.0 Async Mapped Models, Repositories, and Services

* **Status:** Accepted
* **Context:** The database schema encompasses relational tables with complex constraints, sequence ordering (`display_order`), and audit histories.
* **Decision:** Standardize on **SQLAlchemy 2.0 Async (`asyncpg`)** using declarative mapped models, Repositories, and Domain Services.
* **Rationale:**
  1. **Type-Safe ORM:** SQLAlchemy 2.0 provides static typing (`Mapped[uuid.UUID]`, `mapped_column()`) preventing runtime column mismatch bugs.
  2. **Pessimistic Locking Support:** First-class support for `.with_for_update()`, enabling atomic sequence reordering without lost updates.
  3. **Connection Pooling Safety:** Explicit session lifecycles (`expire_on_commit=False`) prevent connection leaks under high concurrent traffic.
* **Consequences:**
  * Raw SQL queries inside routers are strictly prohibited. All queries must flow through Repositories, invoked by Domain Services.
