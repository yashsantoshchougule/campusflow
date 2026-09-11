from datetime import datetime
from fileinput import filename
from importlib import metadata
import os
import json

import supabase

NOTES_DIR = "data/notes/"
TAGS_DIR = "tags/"
METADATA_FILE = "notes_metadata.json"

# helper function
def get_notes_faiss_path(user_id):
    return os.path.join("notes_faiss_index",str(user_id))

def generate_filename(subject):
    now = datetime.now()
    now = now.strftime("%Y-%m-%d-%H-%M-%S")
    return f"{now}_{subject}.md"

def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return []
    with open(METADATA_FILE, "r") as f:
        return json.load(f)

def save_metadata(metadata):
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)

def load_tags(subject):
    tag_file = os.path.join(TAGS_DIR, f"{subject}.json")
    
    if os.path.exists(tag_file):
        with open(tag_file, "r") as f:
            data = json.load(f)
            if "units" in data:
                all_topics = []
                for unit in data["units"]:
                    all_topics.extend(unit["topics"])
                return all_topics
            else:
                return data["tags"]
    else:
        with open(os.path.join(TAGS_DIR, "default.json"), "r") as f:
            return json.load(f)["tags"]
        
# supabase endpoints for notes upgrade
def create_note(subject,title,content,tags,urls=[],user_id=None):
    if urls is None:
        urls = []

    word_count = len(content.split())
    if word_count > 500:
        raise ValueError("Content exceeds 500 words limit.")

    filename = generate_filename(subject)  
    now = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    frontmatter = f"""
---
title: {title}
subject: {subject}
tags: {json.dumps(tags)}
created_at: {now}
referenced_urls: {', '.join(urls)}
---
"""
    # filepath = os.path.join(NOTES_DIR, filename)
    # with open(filepath, "w", encoding="utf-8") as f:
    #     f.write(frontmatter + content)

    markdown_content = frontmatter + content
    from app.core.supabase_client import supabase

    upload = supabase.storage.from_("notes").upload(
        path = f"{user_id}/{filename}",
        file = markdown_content.encode("utf-8"),
        file_options={
            "content-type":"text/markdown",
            "upsert": "false"
        } 
    )

    print(upload)

    if not upload:
        return {"error":"upload nahi hua "}

    if user_id:
        from app.core.supabase_client import supabase

        result = supabase.table("notes").insert({
            "user_id": user_id,
            "filename": filename,
            "subject": subject,
            "title": title,
            "tags": tags,
            "urls": urls,
            "word_count": word_count,
            "ingested": False
        }).execute()
    
    return {"success": True, "filename": filename}

#  supabase endpoints for notes upgrade
def get_all_notes(subject=None, tags=None, user_id=None):
    from app.core.supabase_client import supabase
    query = (
        supabase.table("notes")
        .select("*")
        .eq("user_id", user_id)
    )
    if subject:
        query = query.eq("subject", subject)
    result = query.execute()
    notes = result.data
    if tags:
        notes = [
            note for note in notes
            if any(tag in note["tags"] for tag in tags)
        ]
    return notes


    # metadata = load_metadata()
    # print(f"Total notes: {len(metadata)}")
    # print(f"Filtering by subject: {subject}")
    # if metadata:
    #     print(f"First note: {metadata[0]}")
    # if subject:
    #     metadata = [n for n in metadata 
    #                if n["subject"].lower() == subject.lower()]
    # if tags:
    #     metadata = [n for n in metadata 
    #                if any(tag in n["tags"] for tag in tags)]
    # return metadata

# supabase endpoints for notes upgrade
def get_note_content(filename, user_id=None):
    from app.core.supabase_client import supabase

    # verify the note belongs to the user
    results = supabase.table("notes").select("*").eq("user_id", user_id).eq("filename", filename).execute()
    if not results.data:
        return {"error": "Note not found"}
    
    try:
        file_data = supabase.storage.from_("notes").download(f"{user_id}/{filename}")

        return{
            "content":file_data.decode("utf-8")
        }

    except Exception as e:
        print("storage download error:",e)
        return{"error":"file not found"}

    
    # filepath = os.path.join(NOTES_DIR, filename)
    # if not os.path.exists(filepath):
    #     return {"error": "File not found"}
    
    # with open(filepath, "r", encoding="utf-8") as f:
    #     return {"content": f.read()}

#  supabase endpoints for notes upgrade  
def update_note(filename, title, content, tags, urls=[], user_id=None):
    from app.core.supabase_client import supabase
    now = datetime.now()
    file_time = now.strftime("%Y-%m-%d-%H-%M-%S")

    if urls is None:
        urls = []

    word_count = len(content.split())
    if word_count > 500:
        raise ValueError("Content exceeds 500 words limit.")
    
    # get the note from supabase
    results = supabase.table("notes").select("*").eq("user_id", user_id).eq("filename", filename).execute()

    if not results.data:
        return {"error": "Note not found"}
    
    note = results.data[0]
    subject = note["subject"]

    frontmatter = f"""
---
title: {title}
subject: {subject}
tags: {json.dumps(tags)}
updated_at: {file_time}
referenced_urls: {', '.join(map(str,urls))}
---
"""
    
    # filepath = os.path.join(NOTES_DIR, filename)
    # if not os.path.exists(filepath):
    #     return {"error": "File not found"}
    # with open (filepath, "w", encoding="utf-8") as f:
    #     f.write(frontmatter + content)

    markdown_content = frontmatter + content

    supabase.storage.from_("notes").remove(
        [f"{user_id}/{filename}"]
    )

    supabase.storage.from_("notes").upload(
        path=f"{user_id}/{filename}",
        file=markdown_content.encode("utf-8"),
        file_options={
            "content-type":"text/markdown",
            "upsert":False
        }
    )
    
    # update the note in supabase
    supabase.table("notes").update({
        "title": title,
        "tags": tags,
        "urls": urls,
        "last_edited": now.isoformat(),
        "word_count": word_count,
        "ingested": False
    }).eq("user_id", user_id).eq("filename", filename).execute()
    
    return {"success": True}

    
#     metadata = load_metadata()
#     note_meta = next((n for n in metadata if n["filename"] == filename), None)
#     if not note_meta:
#         return {"error": "Note metadata not found"}

#     subject = note_meta["subject"]

#     if not os.path.exists(os.path.join(NOTES_DIR, filename)):
#         return {"error": "File not found"} 

#     now = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
#     frontmatter = f"""
# ---
# title: {title}
# subject: {subject}
# tags: {json.dumps(tags)}
# updates_at: {now}
# referenced_urls: {', '.join(urls)}
# ---
# """
#     with open(os.path.join(NOTES_DIR, filename), "w", encoding="utf-8") as f:
#         f.write(frontmatter + content)
    
#     for note in metadata:
#         if note["filename"] == filename:
#             note["title"] = title
#             note["tags"] = tags
#             note["urls"] = urls
#             note["last_edited"] = now
#             note["ingested"] = False
#             break
    
#     save_metadata(metadata)

# supabase endpoints for notes upgrade
def delete_note(filename, user_id=None):
    from app.core.supabase_client import supabase

    results = supabase.table("notes").select("*").eq("filename", filename).eq("user_id", user_id).execute()
    if not results.data:
        return {"error": "Note not found"}
    
    # filepath = os.path.join(NOTES_DIR, filename)
    # if not os.path.exists(filepath):
    #     return {"error": "File not found"}
    # os.remove(filepath)

    supabase.storage.from_("notes").remove([
        f"{user_id}/{filename}"
    ])

    # delete the note from supabase
    supabase.table("notes").delete().eq("filename", filename).eq("user_id", user_id).execute()
    return {"success": True}

def get_subjects():
    subjects = []
    for file in os.listdir(TAGS_DIR):
        if file.endswith(".json") and file != "default.json":
            subjects.append(file[:-5])
    return subjects

def generate_tags(note_content, subject, llm):
    subject_tags = load_tags(subject)
    preview = note_content[:1000]
    
    prompt = f"""You are a tagging system for study notes.
Select between 3 and 5 most relevant tags from the list below.
RULES:
- Return MINIMUM 3, MAXIMUM 5 tags
- ONLY use tags from predefined list
- Do NOT create new tags
- Return ONLY a JSON array

Predefined tags for {subject}:
{subject_tags}

Note content:
{preview}

Return format: ["tag1", "tag2", "tag3"]"""

    response = llm.invoke(prompt)
    
    try:
        from app.modules.Quiz.quiz import parse_json_response
        tags = parse_json_response(response.content)

        valid_tags = [tag for tag in tags if tag in subject_tags]
        
        if len(valid_tags) < 3:
            valid_tags = subject_tags[:3]
        if len(valid_tags) > 5:
            valid_tags = valid_tags[:5]
            
        return valid_tags
    except:
        return subject_tags[:3]
    
def fetch_url_title(url):
    try:
        import requests
        from bs4 import BeautifulSoup
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.title.string if soup.title else url
        return title.strip()
    except:
        return url
    
# ingest
async def ingest_notes(embeddings, user_id=None):
    from langchain_core.documents import Document
    from langchain_text_splitters import MarkdownHeaderTextSplitter
    from langchain_community.vectorstores import FAISS
    from app.core.supabase_client import supabase
    import os

    # Get all notes for this user
    results = (
        supabase.table("notes")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    if not results.data:
        return {"error": "No notes to ingest"}

    notes = results.data
    documents = []

    # Download each note from Supabase Storage
    for note in notes:
        filename = note["filename"]

        try:
            file_bytes = supabase.storage.from_("notes").download(
                f"{user_id}/{filename}"
            )

            text = file_bytes.decode("utf-8")

            documents.append(
                Document(
                    page_content=text,
                    metadata={"source": filename}
                )
            )

        except Exception as e:
            print(f"Failed to load {filename}: {e}")
            continue

    if not documents:
        return {"error": "No documents to ingest"}

    # Split markdown by headers
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]

    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on
    )

    all_chunks = []

    for doc in documents:
        chunks = splitter.split_text(doc.page_content)

        for chunk in chunks:
            chunk.metadata["source"] = doc.metadata["source"]

        all_chunks.extend(chunks)

    if not all_chunks:
        return {"error": "No chunks created"}

    # Create user-specific FAISS directory
    faiss_path = get_notes_faiss_path(user_id)
    os.makedirs(faiss_path, exist_ok=True)

    vectorstore = FAISS.from_documents(all_chunks, embeddings)
    vectorstore.save_local(faiss_path)

    # Mark notes as ingested
    (
        supabase.table("notes")
        .update({"ingested": True})
        .eq("user_id", user_id)
        .execute()
    )

    return {
        "success": True,
        "chunks_created": len(all_chunks)
    }