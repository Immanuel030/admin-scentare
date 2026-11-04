import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Boxes,
  ChartNoAxesCombined, ChevronDown, CircleHelp, CreditCard, Grid2X2,
  LogOut, Menu, Package, Percent, RotateCcw, Search, Settings2, ShoppingBag,
  ShoppingCart, Star, Tags, Users, X,
} from "lucide-react";
import Brand from "../../components/Brand.jsx";
import { useDashboardData } from "./useDashboardData.js";
import ProductsView from "./ProductsView.jsx";
import CategoriesView from "./CategoriesView.jsx";
import InventoryView from "./InventoryView.jsx";
import CustomersView from "./CustomersView.jsx";
import SalesReportsView from "./SalesReportsView.jsx";
import ActivityLogsView from "./ActivityLogsView.jsx";
import OrdersView from "./OrdersView.jsx";
import ReviewsView from "./ReviewsView.jsx";
import PaymentsView from "./PaymentsView.jsx";
import ReturnsView from "./ReturnsView.jsx";
import PromotionsView from "./PromotionsView.jsx";
import SystemNotificationsView from "./SystemNotificationsView.jsx";
import AdminAccountView from "./AdminAccountView.jsx";
const groups = [
  { title: "Overview", links: [["Dashboard", Grid2X2]] },
  {
    title: "Catalog",
    links: [
      ["Products", Package],
      ["Categories", Tags],
      ["Inventory", Boxes, "low-stock"],
    ],
  },
  { title: "Sales", links: [
    ["Orders", ShoppingCart, "pending-orders"],
      ["Payments", CreditCard, "pending-payments"],
    ["Returns & Refunds", RotateCcw, "pending-returns"],
    ["Promotions", Percent],
  ] },
  { title: "People", links: [["Customers", Users], ["Reviews", Star, "pending-reviews"]] },
  { title: "Insights", links: [["Sales & Reports", ChartNoAxesCombined], ["Activity Logs", Activity]] },
  { title: "System", links: [["Notifications", Bell], ["Admin Account", Settings2]] },
];

const sectionIds = {
  Dashboard: "dashboard-overview",
  Products: "best-sellers",
  Categories: "categories-overview",
  Inventory: "low-stock",
  Customers: "customers-overview",
};

function Metric({
  label,
  value,
  change,
  icon: Icon,
  trend = "up",
  tone = "gold",
}) {
  const colors = {
    gold: "bg-[#b69650]/10 text-[#c7a85e]",
    green: "bg-[#568a61]/15 text-[#77b982]",
    red: "bg-[#a44c42]/15 text-[#d27668]",
  };
  return (
    <article className="rounded-lg border border-white/[.06] bg-[#131315] p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#9b968e]">{label}</p>
        <span
          className={`grid size-8 place-items-center rounded-full ${colors[tone]}`}
        >
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-2 font-serif text-[28px] leading-none text-[#f0ece5]">
        {value}
      </p>
      <p
        className={`mt-3 flex items-center gap-1 text-[13px] ${trend === "down" ? "text-[#d27668]" : "text-[#78b786]"}`}
      >
        {trend === "down" ? (
          <ArrowDownRight size={12} />
        ) : (
          <ArrowUpRight size={12} />
        )}
        {change}
      </p>
    </article>
  );
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatStatus = (status = "pending") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const emptyList = Object.freeze([]);

function Dashboard({ onLogout, user, onUserUpdated }) {
  const [active, setActive] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addProductRequested, setAddProductRequested] = useState(false);
  const { data, loading, error, refresh } = useDashboardData();
  const summary = data?.summary || {};
  const orders = data?.recentOrders || emptyList;
  const stock = data?.lowStock || emptyList;
  const weeklySales = data?.weeklySales || emptyList;
  const bestSellers = data?.bestSellers || emptyList;
  const userInitials = (user?.name || "Admin").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const weekTotal = weeklySales.reduce((total, sale) => total + Number(sale.amount || 0), 0);
  const weekPeak = Math.max(1, ...weeklySales.map((sale) => Number(sale.amount || 0)));
  const today = data?.generatedAt
    ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(data.generatedAt))
    : "—";
  const filtered = useMemo(
    () =>
      orders.filter((order) =>
        `${order.order_number} ${order.customer} ${order.items} ${order.status} ${order.payment_status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [orders, search],
  );

  function exportOrders() {
    const columns = ["Order", "Customer", "Items", "Total", "Status", "Payment", "Created"];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      columns,
      ...orders.map((order) => [
        order.order_number,
        order.customer,
        order.items,
        order.total,
        formatStatus(order.status),
        formatStatus(order.payment_status),
        order.created_at,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "scentare-recent-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="dashboard-shell min-h-screen bg-[#0a0a0b] text-[#eae6df]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[238px] flex-col border-r border-white/[.07] bg-[#0d0d0f] transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[72px] items-center border-b border-white/[.06] px-5">
          <Brand />
          <button
            className="ml-auto text-[#87837c] lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="mb-1.5 px-2.5 text-[13px] uppercase tracking-[.18em] text-[#66635f]">
                {group.title}
              </p>
              {group.links.map(([label, Icon, count]) => {
                const badge = count === "low-stock"
                  ? summary.low_stock_count
                  : count === "pending-orders"
                    ? summary.orders_count
                    : count === "pending-payments"
                      ? summary.pending_payments
                      : count === "pending-reviews"
                        ? summary.pending_reviews
                        : count === "pending-returns"
                          ? summary.pending_returns
                    : count;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setMenuOpen(false);
                      if (["Products", "Categories", "Inventory", "Orders", "Payments", "Returns & Refunds", "Promotions", "Customers", "Reviews", "Sales & Reports", "Activity Logs", "Notifications", "Admin Account"].includes(label)) {
                        setActive(label);
                        setSearch("");
                        setAddProductRequested(false);
                      } else if (sectionIds[label]) {
                        setActive(label);
                        document.getElementById(sectionIds[label])?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`mb-0.5 flex h-[34px] w-full items-center gap-2.5 rounded px-2.5 text-left text-[13px] ${active === label ? "bg-[#b1924c]/10 text-[#d5b45e]" : "text-[#aaa69f] hover:bg-white/[.04]"}`}
                  >
                    <Icon size={14} strokeWidth={1.7} />
                    <span className="flex-1">{label}</span>
                    {badge !== undefined && Number(badge) > 0 && (
                      <span className="rounded-full bg-[#c4a345] px-1 text-[13px] text-[#19150d]">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[.06] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-[#28241c] text-[12px] text-[#d0ad5e]">
              {userInitials}
            </span>
            <span className="flex-1">
              <span className="block text-[13px]">{user?.name || "Scentare Admin"}</span>
              <span className="block text-[13px] text-[#74706a]">
                Administrator
              </span>
            </span>
            <Settings2 size={14} className="text-[#77736d]" />
          </div>
          <button
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-2.5 px-2 py-1.5 text-[12px] text-[#77736d] hover:text-[#d1ad60]"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <div className="min-h-screen lg:pl-[238px]">
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-white/[.06] bg-[#0a0a0b]/95 px-4 backdrop-blur sm:px-7">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            className="grid size-8 place-items-center text-[#aaa69f] lg:hidden"
          >
            <Menu size={18} />
          </button>
          <label className="flex h-9 w-full max-w-[330px] items-center gap-2 rounded border border-white/[.06] bg-[#121214] px-3 text-[#77736e]">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={active === "Products" ? "Search products..." : active === "Categories" ? "Search categories..." : active === "Inventory" ? "Search inventory..." : active === "Orders" ? "Search orders..." : active === "Payments" ? "Search payments..." : active === "Returns & Refunds" ? "Search returns & refunds..." : active === "Promotions" ? "Search promotions..." : active === "Notifications" ? "Search notifications..." : active === "Admin Account" ? "Search admin account..." : active === "Customers" ? "Search customers..." : active === "Reviews" ? "Search reviews..." : active === "Sales & Reports" ? "Search sales & reports..." : active === "Activity Logs" ? "Search activity logs..." : "Search dashboard..."}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#62605b]"
            />
          </label>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={refresh}
              title="Refresh dashboard data"
              className="relative grid size-8 place-items-center rounded-full border border-white/10 bg-[#141416] text-[#b8b3ab]"
            >
              <Bell size={14} />
            </button>
            <button
              title="Help"
              className="hidden size-8 place-items-center rounded-full border border-white/10 bg-[#141416] text-[#b8b3ab] sm:grid"
            >
              <CircleHelp size={14} />
            </button>
            <span className="hidden h-7 w-px bg-white/10 sm:block" />
            <button className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-[#27231b] text-[13px] text-[#d0ae64]">
                {userInitials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[12px]">{user?.name || "Scentare Admin"}</span>
                <span className="block text-[13px] text-[#77736d]">
                  Administrator
                </span>
              </span>
              <ChevronDown
                size={12}
                className="hidden text-[#77736d] sm:block"
              />
            </button>
          </div>
        </header>
        {active === "Products" ? (
          <ProductsView search={search} onSearchChange={setSearch} openAdd={addProductRequested} onUpdated={refresh} />
        ) : active === "Categories" ? (
          <CategoriesView search={search} onSearchChange={setSearch} />
        ) : active === "Inventory" ? (
          <InventoryView search={search} onSearchChange={setSearch} onUpdated={refresh} />
        ) : active === "Orders" ? (
          <OrdersView search={search} onSearchChange={setSearch} onUpdated={refresh} />
        ) : active === "Payments" ? (
          <PaymentsView search={search} onSearchChange={setSearch} onUpdated={refresh} />
        ) : active === "Returns & Refunds" ? (
          <ReturnsView search={search} onSearchChange={setSearch} onUpdated={refresh} />
        ) : active === "Promotions" ? (
          <PromotionsView search={search} onSearchChange={setSearch} />
        ) : active === "Notifications" ? (
          <SystemNotificationsView search={search} onSearchChange={setSearch} />
        ) : active === "Admin Account" ? (
          <AdminAccountView onUserUpdated={onUserUpdated} />
        ) : active === "Customers" ? (
          <CustomersView search={search} onSearchChange={setSearch} />
        ) : active === "Reviews" ? (
          <ReviewsView search={search} onSearchChange={setSearch} onUpdated={refresh} />
        ) : active === "Sales & Reports" ? (
          <SalesReportsView search={search} />
        ) : active === "Activity Logs" ? (
          <ActivityLogsView search={search} onSearchChange={setSearch} />
        ) : (
        <main id="dashboard-overview" className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
            <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">
                {active === "Dashboard" ? "Overview" : active}
              </p>
              <h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">
                {active === "Dashboard" ? `Good evening, ${user?.name?.split(" ")[0] || "Admin"}` : active}
              </h1>
              <p className="mt-2 text-[13px] text-[#a09b93]">
                Here’s what’s happening across the store today,{" "}
                <span className="text-[#c4bdb2]">{today}.</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportOrders}
                className="h-[34px] rounded border border-white/10 px-3 text-[12px]"
              >
                Export report
              </button>
              <button
                onClick={() => {
                  setActive("Products");
                  setSearch("");
                  setAddProductRequested(true);
                }}
                className="h-[34px] rounded bg-[#c9a954] px-3 text-[12px] font-semibold text-[#17140e]"
              >
                + Add product
              </button>
            </div>
          </div>
          {error && (
            <div role="alert" className="mb-4 flex items-center justify-between rounded border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-[13px] text-[#e18b7e]">
              <span>{error}</span>
              <button onClick={refresh} className="ml-4 underline">Retry</button>
            </div>
          )}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Metric
              label="Sales this month"
              value={loading ? "…" : formatCurrency(summary.month_sales)}
              change="Paid and delivered orders"
              icon={ShoppingBag}
            />
            <Metric
              label="Orders today"
              value={loading ? "…" : summary.orders_today || 0}
              change={`${summary.pending_orders || 0} pending confirmation`}
              icon={ShoppingCart}
              tone="green"
            />
            <Metric
              label="Low-stock alerts"
              value={loading ? "…" : summary.low_stock_count || 0}
              change={`${summary.out_of_stock_count || 0} out of stock`}
              icon={Activity}
              tone="red"
              trend="down"
            />
            <Metric
              label="New customers (7 days)"
              value={loading ? "…" : summary.new_customers || 0}
              change="Customer accounts created"
              icon={Users}
              tone="green"
            />
          </section>
          <section className="mt-5 grid gap-4 lg:grid-cols-[1.65fr_.85fr]">
            <article id="recent-orders" className="min-w-0 scroll-mt-20 rounded-[5px] border border-white/[.045] bg-[#131315] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base">Recent orders</h2>
                  <p className="mt-1 text-[12px] text-[#76726d]">
                    A snapshot of your latest activity
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActive("Orders");
                    document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-1 text-[12px] text-[#bcb7ae]"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[610px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[.06] text-[13px] text-[#74716b]">
                      {["Order", "Customer", "Items", "Total", "Status"].map(
                        (head) => (
                          <th key={head} className="py-2.5 font-medium">
                            {head}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/[.035] last:border-0"
                      >
                        <td className="py-[11px] text-[12px] font-medium">
                          {order.order_number}
                        </td>
                        <td className="py-[11px] text-[12px] text-[#c5c0b8]">
                          {order.customer}
                        </td>
                        <td className="py-[11px] text-[12px] text-[#99958e]">
                          {order.items}
                        </td>
                        <td className="py-[11px] text-[12px]">{formatCurrency(order.total)}</td>
                        <td className="py-[11px]">
                          <span
                            className={`whitespace-nowrap rounded-full px-2 py-1 text-[13px] ${order.status === "delivered" ? "bg-[#42734a]/20 text-[#83bd8b]" : ["shipped", "out_for_delivery", "confirmed", "preparing", "packed"].includes(order.status) ? "bg-[#876b2b]/20 text-[#d7b85c]" : ["cancelled", "failed_delivery", "returned_to_sender"].includes(order.status) ? "bg-[#873d35]/20 text-[#d47b6d]" : "bg-[#55514a]/25 text-[#b6afa2]"}`}
                          >
                            ● &nbsp;{formatStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-xs text-[#77736d]">
                    {loading ? "Loading orders…" : search ? "No matching orders." : "No recent orders yet."}
                  </p>
                )}
              </div>
            </article>
            <article id="low-stock" className="scroll-mt-20 rounded-[5px] border border-white/[.045] bg-[#131315] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base">Low stock</h2>
                  <p className="mt-1 text-[12px] text-[#76726d]">
                    Products to keep an eye on
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActive("Inventory");
                    document.getElementById("low-stock")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="text-[12px] text-[#bcb7ae]"
                >
                  Manage <ArrowRight size={11} className="inline" />
                </button>
              </div>
              <div className="space-y-3.5">
                {stock.map((product) => (
                  <div key={product.name} className="flex items-center gap-2.5">
                    <img
                      className="size-10 rounded border border-white/10 object-cover"
                      src={product.image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=120&q=75"}
                      alt=""
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[13px] text-[#7e7a73]">
                        {product.stock} units left
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[13px] ${product.stock <= 2 ? "bg-[#853f36]/20 text-[#d37b6d]" : "bg-[#81672c]/20 text-[#d4b358]"}`}
                    >
                      ● {product.stock <= 2 ? "Critical" : "Low"}
                    </span>
                  </div>
                ))}
                {!loading && stock.length === 0 && <p className="py-5 text-center text-[12px] text-[#77736d]">No low-stock products.</p>}
              </div>
            </article>
          </section>
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <article id="sales-overview" className="scroll-mt-20 rounded-[5px] border border-white/[.045] bg-[#131315] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base">Sales overview</h2>
                  <p className="mt-1 text-[12px] text-[#76726d]">
                    Revenue performance this week
                  </p>
                </div>
                <span className="text-[12px] text-[#99948b]">Last 7 days</span>
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className="font-serif text-[25px]">{formatCurrency(weekTotal)}</span>
              </div>
              <div className="relative mt-5 h-[100px] border-b border-l border-white/[.08] px-2">
                <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/[.06]" />
                <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-white/[.06]" />
                <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/[.06]" />
                <div className="absolute inset-x-2 bottom-0 flex h-[90px] items-end justify-between gap-2">
                  {weeklySales.map((sale) => (
                      <div
                        key={sale.date}
                        className="group flex h-full flex-1 items-end"
                      >
                        <div
                          title={`${sale.label}: ${formatCurrency(sale.amount)}`}
                          style={{ height: `${Math.max(2, (Number(sale.amount) / weekPeak) * 100)}%` }}
                          className={`w-full rounded-t-[2px] ${Number(sale.amount) === weekPeak ? "bg-[#c4a153]" : "bg-[#92773e]/55 group-hover:bg-[#c4a153]/70"}`}
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div className="mt-2 flex justify-between text-[13px] text-[#74716b]">
                {weeklySales.map((sale) => <span key={sale.date}>{sale.label}</span>)}
              </div>
            </article>
            <article id="best-sellers" className="scroll-mt-20 rounded-[5px] border border-white/[.045] bg-[#131315] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base">Best sellers</h2>
                  <p className="mt-1 text-[12px] text-[#76726d]">
                    Your customers’ favorites
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActive("Products");
                    document.getElementById("best-sellers")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="text-[12px] text-[#bcb7ae]"
                >
                  View products <ArrowRight size={11} className="inline" />
                </button>
              </div>
              <div className="mt-3 divide-y divide-white/[.05]">
                {bestSellers.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="text-[12px] text-[#69655e]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <img
                      className="size-9 rounded border border-white/10 object-cover"
                      src={product.image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=120&q=75"}
                      alt=""
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[13px] text-[#77736d]">
                        {product.units_sold} sold this month
                      </p>
                    </div>
                    <span className="text-right text-[12px]">
                      {formatCurrency(product.revenue)}
                      <span className="mt-1 block text-[13px] text-[#77736d]">
                        Revenue
                      </span>
                    </span>
                  </div>
                ))}
                {!loading && bestSellers.length === 0 && <p className="py-5 text-center text-[12px] text-[#77736d]">Sales data will appear after orders are paid or delivered.</p>}
              </div>
            </article>
          </section>
          <footer className="mt-7 flex justify-between border-t border-white/[.05] pt-4 text-[13px] text-[#5e5b55]">
            <span>© 2025 Scentare Admin Portal</span>
            <span>All fragrances, beautifully managed.</span>
          </footer>
        </main>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
