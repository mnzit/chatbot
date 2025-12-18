import chromadb
from sentence_transformers import SentenceTransformer
from app.core.config import settings

class VectorService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def create_collection(self, name: str, context: str):
        collection = self.client.get_or_create_collection(name=name)
        embeddings = self.model.encode(context)
        collection.add(
            embeddings=[embeddings.tolist()],
            documents=[context],
            ids=["context_1"]
        )
        return collection

    def query(self, collection_name: str, message: str):
        collection = self.client.get_collection(name=collection_name)
        query_embedding = self.model.encode(message)
        results = collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=1
        )
        if results.get('documents') and results['documents'][0]:
            return results['documents'][0][0]
        return "No context found."

vector_service = VectorService()
