export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders & Delivery Tracking</h2>
          <p className="text-sm text-slate-500">
            Canonical tracking lifecycle for Pathao, Steadfast, and RedX
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          Order tracking table and status filter engine scheduled for Phase 3.
        </p>
      </div>
    </div>
  );
}
