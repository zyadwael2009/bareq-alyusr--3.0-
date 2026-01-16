from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    customers_router,
    merchants_router,
    transactions_router,
    repayments_router
)
from app.routers import admin as admin_router

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    Bareq Al-Yusr API - Buy Now Pay Later Platform
    
    ## Features
    
    * **Customer Registration & Management** - Customers can register, get credit limits, and make purchases
    * **Merchant Registration & Management** - Merchants can register and send purchase requests
    * **Transactions** - Merchants create purchase requests, customers approve/reject
    * **Repayment Plans** - Flexible repayment options from 1-28 months
    * **Credit Limit Management** - Admin can set and update credit limits
    
    ## Transaction Flow
    
    1. Merchant searches for customer by phone
    2. Merchant sends purchase request
    3. Customer approves and selects repayment plan (1-28 months)
    4. Customer's limit decreases, merchant receives payment (minus 0.5% fee)
    5. Customer repays monthly, limit restores as they pay
    """,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(merchants_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(repayments_router, prefix="/api/v1")
app.include_router(admin_router.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.FASTAPI_PORT,
        reload=settings.DEBUG
    )
