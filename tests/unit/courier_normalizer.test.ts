import { describe, it, expect } from 'vitest';
import {
  mapPathaoStatus,
  mapSteadfastStatus,
  mapRedxStatus,
  normalizeCourierStatus,
} from '../../src/modules/integrations/couriers/status-normalizer';
import { CourierProvider, NormalizedOrderStatus } from '@prisma/client';

describe('Courier Status Normalizer Engine', () => {
  describe('Pathao Status Normalization', () => {
    it('maps processing and pickup requested', () => {
      expect(mapPathaoStatus('Pickup_Requested')).toBe(NormalizedOrderStatus.processing);
      expect(mapPathaoStatus('Pending')).toBe(NormalizedOrderStatus.processing);
    });

    it('maps pickup done to shipped', () => {
      expect(mapPathaoStatus('Picked')).toBe(NormalizedOrderStatus.shipped);
      expect(mapPathaoStatus('Assigned_For_Pickup')).toBe(NormalizedOrderStatus.shipped);
    });

    it('maps in transit and hubs to on_the_way', () => {
      expect(mapPathaoStatus('In_Transit')).toBe(NormalizedOrderStatus.on_the_way);
      expect(mapPathaoStatus('At_Sorting_Hub')).toBe(NormalizedOrderStatus.on_the_way);
    });

    it('maps delivered and partial', () => {
      expect(mapPathaoStatus('Delivered')).toBe(NormalizedOrderStatus.delivered);
      expect(mapPathaoStatus('Partial_Delivered')).toBe(NormalizedOrderStatus.partial);
    });

    it('maps return and cancelled', () => {
      expect(mapPathaoStatus('Return')).toBe(NormalizedOrderStatus.return);
      expect(mapPathaoStatus('Returned_To_Merchant')).toBe(NormalizedOrderStatus.return);
      expect(mapPathaoStatus('Cancelled')).toBe(NormalizedOrderStatus.cancelled);
    });
  });

  describe('Steadfast Status Normalization', () => {
    it('maps review and pending to processing', () => {
      expect(mapSteadfastStatus('in_review')).toBe(NormalizedOrderStatus.processing);
      expect(mapSteadfastStatus('pending')).toBe(NormalizedOrderStatus.processing);
    });

    it('maps picked to shipped', () => {
      expect(mapSteadfastStatus('picked')).toBe(NormalizedOrderStatus.shipped);
    });

    it('maps in_transit and dispatched to on_the_way', () => {
      expect(mapSteadfastStatus('in_transit')).toBe(NormalizedOrderStatus.on_the_way);
      expect(mapSteadfastStatus('dispatched')).toBe(NormalizedOrderStatus.on_the_way);
    });

    it('maps delivered and partial', () => {
      expect(mapSteadfastStatus('delivered')).toBe(NormalizedOrderStatus.delivered);
      expect(mapSteadfastStatus('partial_delivered')).toBe(NormalizedOrderStatus.partial);
    });

    it('maps returned and exchange', () => {
      expect(mapSteadfastStatus('returned')).toBe(NormalizedOrderStatus.return);
      expect(mapSteadfastStatus('cancelled_and_returned')).toBe(NormalizedOrderStatus.return);
      expect(mapSteadfastStatus('exchange_pending')).toBe(NormalizedOrderStatus.exchange);
    });
  });

  describe('RedX Status Normalization', () => {
    it('maps pickup-requested to processing', () => {
      expect(mapRedxStatus('pickup-requested')).toBe(NormalizedOrderStatus.processing);
      expect(mapRedxStatus('ready-for-pickup')).toBe(NormalizedOrderStatus.processing);
    });

    it('maps picked-up to shipped', () => {
      expect(mapRedxStatus('picked-up')).toBe(NormalizedOrderStatus.shipped);
    });

    it('maps in-transit and destination hub to on_the_way', () => {
      expect(mapRedxStatus('in-transit')).toBe(NormalizedOrderStatus.on_the_way);
      expect(mapRedxStatus('reached-destination-hub')).toBe(NormalizedOrderStatus.on_the_way);
    });

    it('maps delivered and returned', () => {
      expect(mapRedxStatus('delivered')).toBe(NormalizedOrderStatus.delivered);
      expect(mapRedxStatus('returned-to-origin')).toBe(NormalizedOrderStatus.return);
    });
  });

  describe('Master normalizeCourierStatus router', () => {
    it('routes each courier correctly', () => {
      expect(normalizeCourierStatus(CourierProvider.PATHAO, 'Delivered')).toBe(
        NormalizedOrderStatus.delivered
      );
      expect(normalizeCourierStatus(CourierProvider.STEADFAST, 'in_transit')).toBe(
        NormalizedOrderStatus.on_the_way
      );
      expect(normalizeCourierStatus(CourierProvider.REDX, 'pickup-requested')).toBe(
        NormalizedOrderStatus.processing
      );
    });
  });
});
