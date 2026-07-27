from langchain_community.document_loaders import WebBaseLoader

url  = 'https://www.apple.com/in/iphone-17-pro/'

data = WebBaseLoader(url)

docs = data.load()

print(docs[0].page_content)