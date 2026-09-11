import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.auth import require_user
from app.routes.dashboard import router

app = FastAPI()
app.include_router(router)


def test_missing_token_is_rejected():
    try:
        asyncio.run(require_user())
    except HTTPException as error:
        assert error.status_code == 401
    else:
        raise AssertionError("Missing authentication token was accepted")


def test_dashboard_endpoint_rejects_anonymous_request():
    response = TestClient(app).get("/api/dashboard/summary")
    assert response.status_code == 401


if __name__ == "__main__":
    test_missing_token_is_rejected()
    test_dashboard_endpoint_rejects_anonymous_request()
    print("backend auth gate: ok")
