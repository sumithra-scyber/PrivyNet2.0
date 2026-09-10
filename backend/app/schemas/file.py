import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SharedFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    recipient_id: uuid.UUID
    original_filename: str
    content_type: str
    size_bytes: int
    created_at: datetime
