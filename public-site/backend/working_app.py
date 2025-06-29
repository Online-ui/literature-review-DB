from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Literature Review Database")

class Project(BaseModel):
    id: int
    title: str
    author: str
    institution: str

# Sample data
sample_projects = [
    Project(id=1, title="AI in Healthcare", author="John Doe", institution="MIT"),
    Project(id=2, title="Climate Change Research", author="Jane Smith", institution="Stanford"),
    Project(id=3, title="Quantum Computing", author="Bob Johnson", institution="Caltech")
]

@app.get("/")
async def root():
    return {"message": "Literature Review Database", "status": "working"}

@app.get("/api/projects/", response_model=List[Project])
async def get_projects():
    return sample_projects

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: int):
    for project in sample_projects:
        if project.id == project_id:
            return project
    return {"error": "Project not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)