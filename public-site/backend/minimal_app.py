from fastapi import FastAPI

app = FastAPI(
    title="Literature Review Database",
    description="A simple literature review database",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"message": "Hello World", "status": "working"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)