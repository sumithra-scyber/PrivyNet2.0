import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    recipient_id: uuid.UUID
    body: str = Field(min_length=1, max_length=4000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    body: str
    created_at: datetime
    read_at: datetime | None


class ConversationSummary(BaseModel):
    user_id: uuid.UUID
    full_name: str
    email: str
    last_message: str
    last_message_at: datetime
    unread_count: int
