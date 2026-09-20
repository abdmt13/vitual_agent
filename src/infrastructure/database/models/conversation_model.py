from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.infrastructure.database.models.base import Base


class ConversationModel(Base):
    __tablename__ = "chatbot_conversations"

    session_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    previous_response_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    messages: Mapped[List["MessageModel"]] = relationship(
        "MessageModel",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="MessageModel.id"
    )
