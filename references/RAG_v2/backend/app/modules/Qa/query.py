from dotenv import load_dotenv
import os
from app.modules.Notes.notes import get_notes_faiss_path
from langchain_community.vectorstores import FAISS

load_dotenv()
def get_answer(question, llm, uploads_db, user_id, embeddings):
    # Load user's notes FAISS
    notes_path = get_notes_faiss_path(user_id)
    notes_docs = []
    
    if os.path.exists(f"{notes_path}/index.faiss"):
        notes_db = FAISS.load_local(
            notes_path, 
            embeddings,  # use embeddings here, not llm.embeddings
            allow_dangerous_deserialization=True
        )
        notes_docs = notes_db.similarity_search(question, k=3)
    
    # Get from shared uploads
    uploads_docs = uploads_db.similarity_search(question, k=3)
    
    # Combine
    all_docs = notes_docs + uploads_docs
    context = "\n\n".join([doc.page_content for doc in all_docs])
    
    # Build prompt
    prompt = f"""You are a helpful study assistant.
Answer using ONLY the context below in 2-4 sentences.
Paraphrase in your own words, no bullet points or headers.
If answer is not in context say "I don't have enough information in your notes."

Context:
{context}

Question: {question}

Answer:"""
    
    response = llm.invoke(prompt)
    
    return {
        "answer": response.content,
        "sources": list(set([
            doc.metadata.get("source", "")
            for doc in all_docs
        ]))
    }