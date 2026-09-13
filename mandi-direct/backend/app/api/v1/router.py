from fastapi import APIRouter
from app.api.v1.endpoints import (
    addresses,
    admin,
    admin_price_observations,
    auth,
    cart,
    demand,
    earnings,
    farmers,
    health,
    logistics,
    market_prices,
    marketplace,
    matching,
    notifications,
    orders,
    payouts,
    price_intelligence,
    produce,
    reference,
    reviews,
    roles,
    vehicles,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(roles.router)
api_router.include_router(reference.router)
api_router.include_router(farmers.router, prefix="/farmers")
api_router.include_router(farmers.router, prefix="/farmer")
api_router.include_router(produce.router, prefix="/farmers")
api_router.include_router(produce.router, prefix="/farmer")
api_router.include_router(market_prices.router, prefix="/market-prices", tags=["Market Prices"])
api_router.include_router(price_intelligence.router, prefix="/price-intelligence", tags=["Price Intelligence"])
api_router.include_router(demand.router, prefix="/demand-intelligence", tags=["Demand Intelligence"])
api_router.include_router(demand.admin_router, prefix="/admin/demand-intelligence", tags=["Admin Demand Intelligence"])
api_router.include_router(admin_price_observations.router, prefix="/admin/price-observations", tags=["Admin Price Observations"])
api_router.include_router(earnings.router, prefix="/farmer/earnings", tags=["Farmer Earnings"])
api_router.include_router(payouts.farmer_payout_router, prefix="/farmer/payouts", tags=["Farmer Payouts"])
api_router.include_router(payouts.admin_payout_router, prefix="/admin/payouts", tags=["Admin Payouts"])
api_router.include_router(admin.router)
api_router.include_router(marketplace.router, prefix="/marketplace")
api_router.include_router(addresses.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(logistics.router)
api_router.include_router(vehicles.router)
api_router.include_router(reviews.router)
api_router.include_router(matching.router, tags=["Smart Matching"])
api_router.include_router(notifications.router, tags=["Notifications"])

