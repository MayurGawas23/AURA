from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_text_splitters import TokenTextSplitter
data = TextLoader('document loaders/notes.txt')
splitter = CharacterTextSplitter.from_tiktoken_encoder(
    chunk_size = 10,
    chunk_overlap = 1
)

docs = data.load()
chunks = splitter.split_documents(docs)
print(len(chunks))