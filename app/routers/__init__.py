from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.merchants import router as merchants_router
from app.routers.transactions import router as transactions_router
from app.routers.repayments import router as repayments_router

__all__ = [
    "auth_router",
    "customers_router",
    "merchants_router",
    "transactions_router",
    "repayments_router",
]
