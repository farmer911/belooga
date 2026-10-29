"""Google OAuth 2.0 authorization-code exchange (OpenID userinfo)."""

import os
from typing import Optional

from fastapi import HTTPException, status
import httpx

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


async def fetch_google_identity(code: str, redirect_uri: str, code_verifier: Optional[str]) -> dict:
    """Exchange a Google authorization code and return the verified OpenID userinfo claims."""
    client_id, client_secret = os.getenv("GOOGLE_CLIENT_ID"), os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google sign-in is not configured")
    form = {
        "code": code, "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": redirect_uri, "grant_type": "authorization_code",
    }
    if code_verifier:
        form["code_verifier"] = code_verifier
    async with httpx.AsyncClient(timeout=10) as client:
        token_res = await client.post(GOOGLE_TOKEN_URL, data=form)
        if token_res.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google authorization code")
        info_res = await client.get(
            GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {token_res.json()['access_token']}"}
        )
    if info_res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google userinfo request failed")
    return info_res.json()
