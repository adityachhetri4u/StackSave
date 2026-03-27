from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(HTTPException):
    """Custom application exception with standardized error format."""

    def __init__(self, status_code: int, code: str, message: str, details: dict = None):
        self.error_code = code
        self.error_message = message
        self.error_details = details or {}
        super().__init__(
            status_code=status_code,
            detail={
                "error": {
                    "code": code,
                    "message": message,
                    "details": details or {},
                }
            },
        )


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.error_message,
                "details": exc.error_details,
            }
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": {"errors": [
                    {"field": ".".join(str(l) for l in e.get("loc", [])), "message": e.get("msg", "")}
                    for e in errors
                ]},
            }
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "details": {},
            }
        },
    )
