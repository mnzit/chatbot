import chromadb
import io
import PyPDF2
from sentence_transformers import SentenceTransformer
from app.core.config import settings

class VectorService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text

    def create_collection(self, name: str, context: str, pdf_files: list = None):
        collection = self.client.get_or_create_collection(name=name)
        
        full_context = context
        if pdf_files:
            for pdf_file in pdf_files:
                pdf_text = self.extract_text_from_pdf(pdf_file)
                full_context += "\n" + pdf_text
        
        # We might want to chunk large contexts for better RAG performance
        # For now, we'll keep it simple and add the whole thing as one document
        # or split by paragraphs/lines if it's too big.
        
        # Simple chunking by 1000 characters for now to avoid token limits
        chunks = [full_context[i:i+1000] for i in range(0, len(full_context), 1000)]
        
        embeddings = self.model.encode(chunks)
        collection.add(
            embeddings=embeddings.tolist(),
            documents=chunks,
            ids=[f"doc_{i}" for i in range(len(chunks))]
        )
        return collection

    def query(self, collection_name: str, message: str):
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            return "No background context found for this bot."
            
        query_embedding = self.model.encode(message)
        results = collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=3 # Get top 3 chunks for better context
        )
        
        if results.get('documents') and results['documents'][0]:
            return "\n".join(results['documents'][0])
        return "No specific context found for this query."

vector_service = VectorService()
