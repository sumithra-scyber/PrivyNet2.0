import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackPostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class FeedbackCommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class FeedbackCommentOut(BaseModel):
    """Author identity is intentionally never included here."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    body: str
    created_at: datetime


class FeedbackPostOut(BaseModel):
    """Author identity is intentionally never included here."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    body: str
    created_at: datetime
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False
