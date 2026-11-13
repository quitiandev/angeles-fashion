from fastapi import FastAPI
from routers.categories import router as categories_router
from routers import auth
from routers.clients import router as clients_router
from routers.garments import router as garments_router
from routers.sales import router as sales_router
from routers.rentals import router as rentals_router
from routers import reports
from routers.users import router as users_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Angeles Fashion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories_router)
app.include_router(auth.router)
app.include_router(clients_router)
app.include_router(garments_router)
app.include_router(sales_router)
app.include_router(rentals_router)
app.include_router(reports.router)
app.include_router(users_router)


@app.get("/")
def root():
    return {"message": "Welcome to Angeles Fashion API!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
