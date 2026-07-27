from langchain_community.vectorstores import Chroma
from langchain_mistralai import MistralAIEmbeddings
from dotenv import load_dotenv
load_dotenv()

from langchain_core.documents import Document

docs = [
    Document(page_content='Python is widely used in Artificial inetelligence', metadata={'source': 'AI_Book'}),
    Document(page_content='Pandas is widely used for data analysis in python ', metadata={'source': 'P_Book'}),
    Document(page_content='Neural networks is widely used in deep learning', metadata={'source': 'DL_Book'}),
]

embedding_model = MistralAIEmbeddings()

vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embedding_model,
    persist_directory='chroma_db'
)

result = vectorstore.similarity_search('What is used for Data Analysis', k=2)

for r in result:
    print(r.page_content)
    print(r.metadata)

retriver  =  vectorstore.as_retriever()

docs = retriver.invoke('Explain deep Learning')

for  d in docs:
    print(d.page_content)