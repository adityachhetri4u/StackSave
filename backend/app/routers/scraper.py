from fastapi import APIRouter, Depends, HTTPException, status
from app.models.scraper import ScraperRequest, ScraperResponse
from app.services.scraper.dynamic import scrape_product_offers

router = APIRouter()

@router.post("/product-offers", response_model=ScraperResponse)
def scrape_product(request: ScraperRequest):
    """
    Dynamically scrape a product URL (Amazon/Flipkart) 
    and return the base price + extracted bank offers via Playwright.
    """
    if "amazon.in" not in request.url and "flipkart.com" not in request.url:
        raise HTTPException(
            status_code=400, 
            detail="Only Amazon India and Flipkart product URLs are supported."
        )
        
    try:
        response = scrape_product_offers(request.url)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to scrape product page: {str(e)}"
        )
