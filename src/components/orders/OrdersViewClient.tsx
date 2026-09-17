'use client';

import React, { useState } from 'react';
import { OrderWithRelations } from '@/modules/orders/orders.types';
import { OrdersTable } from './OrdersTable';
import { OrderTimelineDrawer } from './OrderTimelineDrawer';

interface OrdersViewClientProps {
  orders: OrderWithRelations[];
}

export function OrdersViewClient({ orders }: OrdersViewClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectOrder = (order: OrderWithRelations) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <OrdersTable orders={orders} onSelectOrder={handleSelectOrder} />
      <OrderTimelineDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
}
