import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleRoute } from "@/components/auth/RoleRoute";

// General Pages
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MarketplacePage } from "@/pages/MarketplacePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { FpoPortal } from "@/pages/FpoPortal";
import { LogisticsPortal } from "@/pages/LogisticsPortal";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { NotificationPreferencesPage } from "@/pages/NotificationPreferencesPage";

// Admin Pages
import { FarmerVerificationListPage } from "@/pages/admin/FarmerVerificationListPage";
import { FarmerReviewPage } from "@/pages/admin/FarmerReviewPage";
import { ProduceVerificationListPage } from "@/pages/admin/ProduceVerificationListPage";
import { ProduceReviewPage } from "@/pages/admin/ProduceReviewPage";
import { VerificationHistoryPage } from "@/pages/admin/VerificationHistoryPage";
import { AdminLogisticsPage } from "@/pages/admin/AdminLogisticsPage";
import { AdminCollectionPointsPage } from "@/pages/admin/AdminCollectionPointsPage";
import { AdminDemandIntelligencePage } from "@/pages/admin/AdminDemandIntelligencePage";

// Farmer Pages
import { FarmerDashboard } from "@/pages/FarmerDashboard";
import { FarmerProfilePage } from "@/pages/farmer/FarmerProfilePage";
import { FarmsListPage } from "@/pages/farmer/FarmsListPage";
import { AddFarmPage } from "@/pages/farmer/AddFarmPage";
import { EditFarmPage } from "@/pages/farmer/EditFarmPage";
import { ProduceListPage } from "@/pages/farmer/ProduceListPage";
import { AddProducePage } from "@/pages/farmer/AddProducePage";
import { ProduceDetailPage } from "@/pages/farmer/ProduceDetailPage";
import { EditProducePage } from "@/pages/farmer/EditProducePage";
import { FarmerOrdersPage } from "@/pages/farmer/FarmerOrdersPage";
import { FarmerOrderDetailPage } from "@/pages/farmer/FarmerOrderDetailPage";
import { FarmerDemandIntelligencePage } from "@/pages/farmer/FarmerDemandIntelligencePage";
import { FarmerDemandHistoryPage } from "@/pages/farmer/FarmerDemandHistoryPage";
import { FarmerMatchingPage } from "@/pages/farmer/FarmerMatchingPage";
import { MarketPricesPage } from "@/pages/farmer/MarketPricesPage";

// Buyer Pages (Phase 8 & 13)
import { CartPage } from "@/pages/buyer/CartPage";
import { CheckoutPage } from "@/pages/buyer/CheckoutPage";
import { BuyerOrdersPage } from "@/pages/buyer/BuyerOrdersPage";
import { BuyerOrderDetailPage } from "@/pages/buyer/BuyerOrderDetailPage";
import { BuyerOrderTrackingPage } from "@/pages/buyer/BuyerOrderTrackingPage";
import { BuyerAddressesPage } from "@/pages/buyer/BuyerAddressesPage";
import { BuyerDashboard } from "@/pages/buyer/BuyerDashboard";
import { BuyerMatchingPage } from "@/pages/buyer/BuyerMatchingPage";
import { BuyerPreferencesPage } from "@/pages/buyer/BuyerPreferencesPage";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/market-prices" element={<MarketPricesPage />} />
      <Route path="/marketplace/products/:produceId" element={<ProductDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Role-Protected Pages: FARMER */}
      <Route
        path="/farmer/market-prices"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <MarketPricesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/profile"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerProfilePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/farms"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmsListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/farms/new"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <AddFarmPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/farms/:farmId/edit"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <EditFarmPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/produce"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <ProduceListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/produce/new"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <AddProducePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/produce/:produceId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <ProduceDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/produce/:produceId/edit"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <EditProducePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/orders"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerOrdersPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/orders/:orderId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerOrderDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/demand-intelligence"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerDemandIntelligencePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/demand-intelligence/history"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerDemandHistoryPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/matching"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["FARMER"]}>
              <FarmerMatchingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Pages: BUYER & CONSUMER */}
      <Route path="/buyer" element={<Navigate to="/buyer/dashboard" replace />} />
      <Route
        path="/buyer/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/matching"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerMatchingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/preferences"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerPreferencesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/marketplace"
        element={<MarketplacePage />}
      />
      <Route
        path="/buyer/cart"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <CartPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/checkout"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <CheckoutPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/orders"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerOrdersPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/orders/:orderId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerOrderDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/orders/:orderId/tracking"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerOrderTrackingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/addresses"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["BUYER", "ADMIN", "CONSUMER"]}>
              <BuyerAddressesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Pages: ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logistics"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <AdminLogisticsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/collection-points"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <AdminCollectionPointsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/demand-intelligence"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <AdminDemandIntelligencePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/farmers"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <FarmerVerificationListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/farmers/:farmerId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <FarmerReviewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/produce"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <ProduceVerificationListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/produce/:produceId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <ProduceReviewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/history"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <VerificationHistoryPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Pages: FPO (Admin) */}
      <Route
        path="/fpo/portal"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ADMIN"]}>
              <FpoPortal />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Role-Protected Pages: LOGISTICS */}
      <Route
        path="/logistics/portal"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["LOGISTICS"]}>
              <LogisticsPortal />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logistics/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["LOGISTICS"]}>
              <LogisticsPortal />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Phase 14: Notifications & Preferences */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/notifications"
        element={
          <ProtectedRoute>
            <NotificationPreferencesPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
