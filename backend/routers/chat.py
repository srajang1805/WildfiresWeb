from fastapi import APIRouter
from pydantic import BaseModel
from backend.rag.retriever import retrieve
from backend.rag.response_builder import build_response

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


@router.post("/chat")
def chat(req: ChatRequest):
    results = retrieve(req.message, top_k=5)
    response = build_response(req.message, results, req.context)
    return response
