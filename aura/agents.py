from langchain.agents import create_agent
from aura.llm import get_llm
from aura.tools import (
    web_search,
    scrape_url,
    read_document,
    execute_python_code,
    analyze_dataset,
    analyze_image
)

llm = get_llm()

# 1. Research Agent Builders
def build_search_agent():
    """Factory function building Search Agent equipped with web_search."""
    return create_agent(model=llm, tools=[web_search])

def build_reader_agent():
    """Factory function building Reader Agent equipped with scrape_url."""
    return create_agent(model=llm, tools=[scrape_url])

def build_research_agent():
    """Factory function building combined Research Agent equipped with web_search & scrape_url."""
    return create_agent(model=llm, tools=[web_search, scrape_url])

# 2. RAG Agent Builder
def build_rag_agent():
    """Factory function building RAG Agent equipped with read_document."""
    return create_agent(model=llm, tools=[read_document])

# 3. Code Agent Builder
def build_code_agent():
    """Factory function building Code Agent equipped with execute_python_code sandbox."""
    return create_agent(model=llm, tools=[execute_python_code])

# 4. Data Analysis Agent Builder
def build_data_agent():
    """Factory function building Data Analysis Agent equipped with analyze_dataset & execute_python_code."""
    return create_agent(model=llm, tools=[analyze_dataset, execute_python_code])

# 5. Vision Agent Builder
def build_vision_agent():
    """Factory function building Vision Agent equipped with analyze_image."""
    return create_agent(model=llm, tools=[analyze_image])
