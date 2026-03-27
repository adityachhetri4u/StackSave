from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.routers import cards, merchants, recommendations, scraper

settings = get_settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="StackSave API",
    description="Smart savings assistant — find the best coupon + card combo for any transaction.",
    version="1.0.0",
)

# State
app.state.limiter = limiter

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Routers
app.include_router(cards.router, prefix="/api/v1", tags=["Cards"])
app.include_router(merchants.router, prefix="/api/v1", tags=["Merchants"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["Recommendations"])
app.include_router(scraper.router, prefix="/api/v1/scraper", tags=["Scraper"])


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": "StackSave API", "version": "1.0.0"}
