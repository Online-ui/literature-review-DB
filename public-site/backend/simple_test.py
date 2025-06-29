from fastapi import FastAPI # type: ignore

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    print("✅ FastAPI import successful!")
    print("✅ Basic app creation successful!")