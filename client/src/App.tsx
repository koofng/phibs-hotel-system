import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PublicLayout } from "./components/PublicLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GuestsPage } from "./pages/GuestsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { InvoicePage } from "./pages/InvoicePage";
import { LoginPage } from "./pages/LoginPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import { PublicConfirmationPage } from "./pages/PublicConfirmationPage";
import { ReceiptPage } from "./pages/ReceiptPage";
import { ReservationDetailPage } from "./pages/ReservationDetailPage";
import { ReservationsPage } from "./pages/ReservationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/book" element={<PublicBookingPage />} />
        <Route path="/book/confirmation/:id" element={<PublicConfirmationPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reservations/:id" element={<ReservationDetailPage />} />
          <Route path="/guests" element={<GuestsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/invoices/:id" element={<InvoicePage />} />
          <Route path="/payments/:id/receipt" element={<ReceiptPage />} />

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
