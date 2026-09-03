import { NormalizedOrderStatus, CourierProvider } from '@prisma/client';

export { NormalizedOrderStatus, CourierProvider };

export interface StatusMappingResult {
  normalizedStatus: NormalizedOrderStatus;
  rawStatus: string;
  courier: CourierProvider;
}

/**
 * Pathao status mapping implementation
 */
export function mapPathaoStatus(raw: string): NormalizedOrderStatus {
  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'pickup_requested':
    case 'pending':
    case 'order_created':
      return NormalizedOrderStatus.processing;

    case 'assigned_for_pickup':
    case 'picked':
    case 'picked_up':
      return NormalizedOrderStatus.shipped;

    case 'in_transit':
    case 'at_sorting_hub':
    case 'dispatched':
    case 'out_for_delivery':
      return NormalizedOrderStatus.on_the_way;

    case 'delivered':
    case 'successful':
      return NormalizedOrderStatus.delivered;

    case 'partial_delivered':
    case 'partial_delivery':
      return NormalizedOrderStatus.partial;

    case 'return':
    case 'returned':
    case 'returned_to_merchant':
    case 'delivery_failed':
    case 'rto':
      return NormalizedOrderStatus.return;

    case 'exchange':
    case 'exchange_delivered':
      return NormalizedOrderStatus.exchange;

    case 'cancelled':
    case 'canceled':
      return NormalizedOrderStatus.cancelled;

    default:
      return NormalizedOrderStatus.processing;
  }
}

/**
 * Steadfast status mapping implementation
 */
export function mapSteadfastStatus(raw: string): NormalizedOrderStatus {
  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'in_review':
    case 'pending':
    case 'hold':
      return NormalizedOrderStatus.processing;

    case 'picked':
    case 'pickup_done':
      return NormalizedOrderStatus.shipped;

    case 'in_transit':
    case 'dispatched':
    case 'out_for_delivery':
    case 'rider_assigned':
      return NormalizedOrderStatus.on_the_way;

    case 'delivered':
    case 'partial_delivered': // Steadfast sometimes flags partial separately
      if (normalized === 'partial_delivered') {
        return NormalizedOrderStatus.partial;
      }
      return NormalizedOrderStatus.delivered;

    case 'returned':
    case 'cancelled_and_returned':
    case 'return_pending':
      return NormalizedOrderStatus.return;

    case 'exchange_pending':
    case 'exchange_done':
      return NormalizedOrderStatus.exchange;

    case 'cancelled':
    case 'canceled':
      return NormalizedOrderStatus.cancelled;

    default:
      return NormalizedOrderStatus.processing;
  }
}

/**
 * RedX status mapping implementation
 */
export function mapRedxStatus(raw: string): NormalizedOrderStatus {
  const normalized = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');

  switch (normalized) {
    case 'pickup-requested':
    case 'ready-for-pickup':
    case 'pending':
      return NormalizedOrderStatus.processing;

    case 'picked-up':
    case 'picked':
      return NormalizedOrderStatus.shipped;

    case 'in-transit':
    case 'reached-destination-hub':
    case 'out-for-delivery':
      return NormalizedOrderStatus.on_the_way;

    case 'delivered':
      return NormalizedOrderStatus.delivered;

    case 'partial-delivered':
    case 'partial-delivery':
      return NormalizedOrderStatus.partial;

    case 'returned-to-origin':
    case 'returned':
    case 'cancelled':
    case 'delivery-failed':
      return NormalizedOrderStatus.return;

    case 'exchange-delivered':
    case 'exchange':
      return NormalizedOrderStatus.exchange;

    case 'pickup-cancelled':
      return NormalizedOrderStatus.cancelled;

    default:
      return NormalizedOrderStatus.processing;
  }
}

/**
 * Master status normalizer router
 */
export function normalizeCourierStatus(
  courier: CourierProvider,
  rawStatus: string
): NormalizedOrderStatus {
  switch (courier) {
    case CourierProvider.PATHAO:
      return mapPathaoStatus(rawStatus);
    case CourierProvider.STEADFAST:
      return mapSteadfastStatus(rawStatus);
    case CourierProvider.REDX:
      return mapRedxStatus(rawStatus);
  }
}
