# Orders Domain Module (`/src/modules/orders`)

## 1. Purpose & Responsibilities
- Unified order ingestion from multiple platforms (WooCommerce, Shopify).
- Courier tracking code association (Pathao, Steadfast, RedX).
- Order status state transitions and immutable audit timeline logging in `order_status_history`.
- Paginated, indexed search across order numbers, customer phones, and districts.

## 2. Public API Surface (`index.ts`)
- `ordersService.getOrders(tenantId, params): Promise<PaginatedOrdersResult>`
- `ordersService.getOrderDetails(tenantId, orderId): Promise<OrderWithHistory | null>`
- `ordersService.processIncomingOrder(input: CreateOrderInput): Promise<Order>`
- `ordersService.updateCourierStatus(tenantId, orderId, newStatus, rawCourierStatus, source, note)`
- Types: `NormalizedOrderStatus`, `OrderFilterParams`, `PaginatedOrdersResult`, `CreateOrderInput`.
- Schemas: `orderFilterSchema`, `updateOrderStatusSchema`.

## 3. Data Flow Diagram
```mermaid
sequenceDiagram
    participant Connector as Integrations Module
    participant Service as OrdersService
    participant Repo as OrdersRepository
    participant DB as PostgreSQL (orders, history)

    Connector->>Service: processIncomingOrder(input)
    Service->>Repo: upsertOrder(input)
    Repo->>DB: UPSERT INTO orders (tenant_id, external_id)
    DB-->>Repo: Order record
    Repo-->>Service: Order record
    Service-->>Connector: Order record
```

## 4. Environment Variables Required
- `DATABASE_URL`

## 5. Testing Strategy
- Unit tests for order status updates and idempotency.
- Filter schema validation tests.

## 6. Known Limitations
- CSV export capability is planned for Phase 3.
