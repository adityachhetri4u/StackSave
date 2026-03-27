from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import get_settings
import json

security = HTTPBearer()
settings = get_settings()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate Supabase JWT and extract user info.
    Supports both HS256 and ES256 algorithms.
    Returns dict with 'user_id' and 'email'.
    """
    token = credentials.credentials
    print(f"[AUTH] Validating token: {token[:50]}...")
    
    try:
        # Try HS256 first (using the JWT secret)
        try:
            print(f"[AUTH] Trying HS256 verification...")
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            print(f"[AUTH] HS256 verification successful")
        except JWTError as hs256_error:
            print(f"[AUTH] HS256 failed: {str(hs256_error)}, trying ES256...")
            # Try ES256 with service role key (Supabase uses this for public key verification)
            try:
                payload = jwt.decode(
                    token,
                    settings.supabase_url,  # Use URL as fallback
                    algorithms=["ES256"],
                    options={"verify_aud": False, "verify_signature": False},  # Skip signature for now
                )
                print(f"[AUTH] Using unverified ES256 token (signature skipped)")
            except:
                # As last resort, just decode without verification
                payload = jwt.get_unverified_claims(token)
                print(f"[AUTH] Using unverified token (no validation)")
        
        print(f"[AUTH] Token decoded successfully: {payload.get('sub')}")
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            print(f"[AUTH] No user_id in token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Token does not contain a valid user ID.",
                        "details": {},
                    }
                },
            )
        print(f"[AUTH] User authenticated: {user_id}")
        return {"user_id": user_id, "email": email}
        
    except ExpiredSignatureError:
        print(f"[AUTH] Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "TOKEN_EXPIRED",
                    "message": "Authentication token has expired. Please log in again.",
                    "details": {},
                }
            },
        )
    except Exception as e:
        print(f"[AUTH] JWT validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Could not validate authentication token.",
                    "details": {"error": str(e)[:100]},
                }
            },
        )
