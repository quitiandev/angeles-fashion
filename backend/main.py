from fastapi import FastAPI
from routers.categories import router as categories_router

app = FastAPI(title="Angeles Fashion API")
app.include_router(categories_router)


@app.get("/")
def root():
    return {"message": "Welcome to Angeles Fashion API!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
