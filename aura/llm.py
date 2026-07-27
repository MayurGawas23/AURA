from langchain_core.language_models.chat_models import BaseChatModel
from langchain_mistralai import ChatMistralAI
from aura.config import settings

def get_llm(
    model_name: str | None = None,
    temperature: float | None = None,
    **kwargs
) -> BaseChatModel:
    """Factory function for initializing LLM instances."""
    target_model = model_name or settings.DEFAULT_MODEL
    target_temp = temperature if temperature is not None else settings.TEMPERATURE

    return ChatMistralAI(
        model=target_model,
        temperature=target_temp,
        api_key=settings.MISTRAL_API_KEY if settings.MISTRAL_API_KEY else None,
        **kwargs
    )
