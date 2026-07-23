from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


@router.post("/chat")
def chat(req: ChatRequest):
    from backend.rag.retriever import retrieve, _model as _rag_model, _index as _rag_index

    if _rag_model is None or _rag_index is None:
        return {
            "answer": (
                "The knowledge retrieval system is currently unavailable on this deployment tier. "
                "The RAG model requires more memory than the free tier provides.\n\n"
                "You can still use the prediction and heatmap features on the dashboard, "
                "or ask me general questions about wildfire risk."
            ),
            "sources": [],
            "confidence": 0.0,
            "intent": "System",
        }

    results = retrieve(req.message, top_k=5)
    from backend.rag.response_builder import build_response
    response = build_response(req.message, results, req.context)
    return response
