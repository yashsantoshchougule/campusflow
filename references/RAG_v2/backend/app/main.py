from datetime import datetime
import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from app.modules.Quiz.quiz import generate_quiz, evaluate_answers, get_recommendations
from pydantic import BaseModel
from app.modules.Ingestion.ingestion import run_ingestion
from fastapi.middleware.cors import CORSMiddleware
import shutil
from typing import List, Dict, Any
from langchain_cohere import CohereEmbeddings, ChatCohere
from langchain_community.vectorstores import FAISS
from app.modules.Qa.query import get_answer
from app.modules.Notes.notes import (
    create_note,
    get_all_notes,
    get_note_content,
    update_note,
    delete_note,
    get_subjects,
    generate_tags,
    fetch_url_title
)
from app.core.supabase_client import supabase
from app.core.auth import get_current_user
from fastapi import Depends

from app.modules.Roadmap.roadmap import (
    generate_roadmap,
    load_roadmap,
    check_existing_roadmap
)
from app.modules.Notes.notes import get_notes_faiss_path
from pathlib import Path


load_dotenv()
app = FastAPI()

print("Starting server...")
print("API Key exists:", bool(os.getenv("COHERE_API_KEY")))

embeddings = CohereEmbeddings(
    model="embed-english-light-v3.0",
    cohere_api_key=os.getenv("COHERE_API_KEY")
)

vectorStoreDB =FAISS.load_local("faiss_index",embeddings,allow_dangerous_deserialization=True)

llm = ChatCohere(
    model="command-r7b-12-2024",
    cohere_api_key=os.getenv("COHERE_API_KEY")
)

class QuizRequest(BaseModel):
    subject: str

class EvaluateRequest(BaseModel):
    quiz: list[Any]
    answers: list[Any]
    subject: str 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Server Online"}

@app.post("/generate-quiz")
def generateQuiz( request: QuizRequest, user=Depends(get_current_user)):
    quiz = generate_quiz(request.subject, llm, vectorStoreDB)
    return {"quiz": quiz}

@app.post("/evaluate")
async def evaluate_endpoint(request: EvaluateRequest, user=Depends(get_current_user)):
    results, weak_topics = evaluate_answers(
        request.quiz, 
        request.answers, 
        request.subject,
        user_id=user.id 
    )
    recommendations = get_recommendations(weak_topics, vectorStoreDB)
    return {
        "results": results,
        "weak_topics": weak_topics,
        "recommendations": recommendations
    }

@app.get("/quiz-history")
def get_quiz_history(subject: str = None):
    history_file = "analytics/quiz_history.json"
    
    if not os.path.exists(history_file):
        return {"history": []}
    
    with open(history_file, "r") as f:
        history = json.load(f)
    
    if subject:
        history = [h for h in history 
                  if h["subject"].lower() == subject.lower()]
    
    return {"history": history}

@app.post("/ingest")
def ingestion(file: UploadFile = File(...)):
    file_path = f"data/uploads/{file.filename}"
    with open(file_path,"wb") as f:
        shutil.copyfileobj(file.file,f)
    
    chunk_count = run_ingestion()
    # Reload FAISS with new data
    global vectorStoreDB
    vectorStoreDB = FAISS.load_local(
        "faiss_index", embeddings,
        allow_dangerous_deserialization=True
    )
    return {
        "message": f"{file.filename} ingested successfully",
        "chunks_created": chunk_count
    }

class AskRequest(BaseModel):
    question: str

@app.post("/ask")
def ask_endpoint(request: AskRequest, user=Depends(get_current_user)):
    response = get_answer(
        question=request.question, 
        llm=llm, 
        uploads_db=vectorStoreDB,
        user_id=user.id,
        embeddings=embeddings 
    )
    return response

# Notes endpoints

# specific first
class GenerateTagsRequest(BaseModel):
    note_content: str
    subject: str

@app.post("/notes/generate-tags")
def generate_tags_endpoint(request: GenerateTagsRequest):
    tags = generate_tags(request.note_content, request.subject, llm)
    return {"tags": tags}

class FetchURLRequest(BaseModel):
    url: str

@app.post("/notes/fetch-url")
def fetch_url_endpoint(request: FetchURLRequest):
    return {"title": fetch_url_title(request.url)}

# supabase endpoints for notes upgrade
@app.post("/notes/ingest")
async def ingest_notes_endpoint(user=Depends(get_current_user)):
    from app.modules.Notes.notes import ingest_notes

    result = await ingest_notes(embeddings, user.id)

    if "error" in result:
        return result

    global notes_db
    notes_db = FAISS.load_local(
        get_notes_faiss_path(user.id),
        embeddings,
        allow_dangerous_deserialization=True
    )

    return result

# general routes for notes
# supabase endpoints for notes upgrade
@app.get("/notes/{filename}")
def get_note_content_endpoint(filename: str, user=Depends(get_current_user)):
    return get_note_content(filename,user_id=user.id)

class UpdateNoteRequest(BaseModel):
    title: str
    content: str
    tags: List[str]
    urls: List[Any] = []

# supabase endpoints for notes upgrade
@app.put("/notes/{filename}")
def update_note_endpoint(filename: str, request: UpdateNoteRequest, user=Depends(get_current_user)):
    return update_note(
        filename=filename,
        title=request.title,
        content=request.content,
        tags=request.tags,
        urls=request.urls,
        user_id=user.id
    )

# supabase endpoints for notes upgrade
@app.delete("/notes/{filename}")
def delete_note_endpoint(filename: str, user=Depends(get_current_user)):
    return delete_note(filename, user_id=user.id)

class CreateNoteRequest(BaseModel):
    subject: str
    title: str
    content: str
    tags: List[str]
    urls: List[Any] = []

# supabase endpoints for notes upgrade
@app.post("/notes")
def create_note_endpoint(request: CreateNoteRequest, user=Depends(get_current_user)):
    result = create_note(
        subject=request.subject,
        title=request.title,
        content=request.content,
        tags=request.tags,
        urls=request.urls,
        user_id=user.id
    )
    return result

# supabase upgrade: get notes for specific user, with optional subject and tags filter
@app.get("/notes")
def get_notes_endpoint(subject: str = None, tags: str = None,user=Depends(get_current_user)):
    print("Fetching notes for:", user)
    tag_list = tags.split(",") if tags else None
    notes = get_all_notes(
        subject, 
        tag_list,
        user_id=user.id
        )
    return {"notes": notes}

@app.get("/subjects")
def get_subjects_endpoint():
    return {"subjects": get_subjects()}

@app.get("/uploads/{subject}")
def get_upload_content(subject: str):
    import glob
    # Find file matching subject name
    files = glob.glob(f"data/uploads/{subject}*")
    if not files:
        return {"error": "No upload found for this subject"}
    
    with open(files[0], "r", encoding="utf-8") as f:
        return {"content": f.read()}

# roadmap endpoints
class RoadmapRequest(BaseModel):
    subject: str
    hours_per_day: int
    target_date: str
    scope: str
    unit_number: int | None = None

class ExtendDateRequest(BaseModel):
    new_target_date: str

class CompleteTopicRequest(BaseModel):
    week: int
    topic_name: str

# supabase upgrade: check if active roadmap exists for user and subject
@app.post("/roadmap")
def generate_roadmap_endpoint(request: RoadmapRequest, user=Depends(get_current_user)):
    # Check if active roadmap exists
    if check_existing_roadmap(request.subject,user_id=user.id):
        return {"error": "Active roadmap exists. Complete or delete it first."}
    result = generate_roadmap(
        subject=request.subject,
        hours_per_day=request.hours_per_day,
        target_date=request.target_date,
        scope=request.scope,
        unit_number=request.unit_number,
        llm=llm,
        user_id=user.id
    ) 
    return result

# supabase upgrade: check if active roadmap exists for user and subject update: there is some problem
@app.get("/roadmap/{subject}")
def get_roadmap_endpoint(subject: str, user=Depends(get_current_user)):
    print("get roadmap")
    print("subject",subject)
    print("user",user.id)

    roadmap = load_roadmap(subject,user_id=user.id)
    # print("Roadmap:", roadmap)

    if not roadmap:
        return {"error": "No roadmap found"}
    return roadmap

# gemini version
@app.delete("/roadmap/{subject}")
def delete_roadmap_endpoint(subject: str, user=Depends(get_current_user)):
    from app.core.supabase_client import supabase
    import os

    # FIX: Added the "s" to "roadmaps" to match your actual table name
    supabase.table("roadmaps").delete().eq("user_id", user.id).eq("subject", subject).execute()

    filepath = f"analytics/roadmaps/roadmap_{subject}.json"
    if os.path.exists(filepath):
        os.remove(filepath)
        print(f"Local file {filepath} deleted successfully.")
    else:
        print(f"Note: Local file {filepath} wasn't found, skipping file deletion.")

    return {"success": True, "message": f"Roadmap for {subject} deleted"}

# supabase updated
@app.put("/roadmap/{subject}/extend")
def extend_roadmap_endpoint(
    subject: str,
    request: ExtendDateRequest,
    user=Depends(get_current_user)
):
    from app.core.supabase_client import supabase

    roadmap = load_roadmap(subject, user_id=user.id)
    if not roadmap:
        return {"error": "No roadmap found"}

    roadmap["target_date"] = request.new_target_date

    supabase.table("roadmaps").update({
        "target_date": request.new_target_date
    }).eq("subject", subject).eq("user_id", user.id).execute()

    return {
        "success": True,
        "new_target_date": request.new_target_date
    }

# supabase upgraded
@app.put("/roadmap/{subject}/complete-topic")
def complete_topic_endpoint(subject: str, request: CompleteTopicRequest, user=Depends(get_current_user)):
    from app.core.supabase_client import supabase
    roadmap = load_roadmap(subject,user_id = user.id)
    if not roadmap:
        return {"error": "No roadmap found"}
    
    # Update topic
    found = False

    for week in roadmap["weeks"]:
        if week["week"] == request.week:
            for item in week["topics"]:
                if item["topic"]["name"] == request.topic_name:
                    item["topic"]["status"] = "completed"
                    item["topic"]["completed_date"] = datetime.now().strftime("%Y-%m-%d")
                    found = True
                    break

    if not found:
        return {"error": "Topic not found"}

    # Save updated weeks back to Supabase
    supabase.table("roadmaps").update({
        "weeks": roadmap["weeks"]
    }).eq("subject", subject).eq("user_id", user.id).execute()

    return {"success": True}

@app.get("/uploads")
def get_uploaded_subjects():
    files = []

    for file in Path("data/uploads").glob("*.md"):
        files.append(file.stem)

    return sorted(files)

# im shifting to modular approch from now on
# book module
from app.modules.books.router import router as books_router
app.include_router(books_router)

# analytics module
from app.modules.Analytics.router import router as analytics_router
app.include_router(analytics_router)

