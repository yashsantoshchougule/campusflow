import asyncio
import sys

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth import require_user
from app.routes import notes, timetable, assistant, pen2pdf, dashboard, study_ai, notices_intelligence

# Fix for Playwright on Windows - use WindowsSelectorEventLoopPolicy
# This resolves NotImplementedError when trying to launch browser subprocesses
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


app = FastAPI(
    title="CampusFlow",
    description="Student academic decision engine",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Include routers
protected = [Depends(require_user)]
app.include_router(notes.router, dependencies=protected)
app.include_router(timetable.router, dependencies=protected)
app.include_router(assistant.router, dependencies=protected)
app.include_router(study_ai.router, dependencies=protected)
app.include_router(notices_intelligence.router, dependencies=protected)
app.include_router(pen2pdf.router, dependencies=protected)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to CampusFlow v2.0 API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    # Ensure Windows event loop policy is set before uvicorn starts
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
