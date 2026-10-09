from fastapi import FastAPI

app = FastAPI(title="Angeles Fashion API")


@app.get("/")
def root():
    return {"message": "Welcome to Angeles Fashion API!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
