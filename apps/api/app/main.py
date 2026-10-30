from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models.database import init_db
from .routes import scans, trackers, copilot, policy

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

# Also initialize immediately on module import so testing client works out of the box
init_db()

app = FastAPI(
    title="PRIVACYLENS Intelligence API",
    description="Deterministic & Explainable Privacy Inspection Engine for Websites",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js dashboard and browser extensions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scans.router)
app.include_router(trackers.router)
app.include_router(copilot.router)
app.include_router(policy.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "PRIVACYLENS Core API",
        "version": "1.0.0",
        "engine": "Deterministic + Grounded Copilot",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.app.main:app", host="0.0.0.0", port=8000, reload=True)
