from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, catalogs, predictions, users
from app.core.ml import load_model
from app.database import SessionLocal, engine
from app.database import Base
from app.seed import seed_catalogs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so Base knows about them
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    load_model()

    db = SessionLocal()
    try:
        seed_catalogs(db)
    finally:
        db.close()

    yield


app = FastAPI(title="MedAnalysis API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(users.router)
app.include_router(catalogs.router)


@app.get("/health")
def health():
    return {"status": "ok"}
