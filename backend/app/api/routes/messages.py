import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import ConversationSummary, MessageCreate, MessageOut

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post("", response_model=MessageOut, status_code=201)
def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    recipient = db.get(User, payload.recipient_id)
    if recipient is None or not recipient.is_active:
        raise HTTPException(status_code=404, detail="Recipient not found")

    message = Message(
        sender_id=current_user.id,
        recipient_id=payload.recipient_id,
        body=payload.body,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """One row per user this person has exchanged messages with,
    with the latest message preview and unread count."""
    messages = (
        db.query(Message)
        .filter(
            or_(
                Message.sender_id == current_user.id,
                Message.recipient_id == current_user.id,
            )
        )
        .order_by(Message.created_at.desc())
        .all()
    )

    summaries: dict[uuid.UUID, ConversationSummary] = {}
    unread_counts: dict[uuid.UUID, int] = {}

    for m in messages:
        other_id = m.recipient_id if m.sender_id == current_user.id else m.sender_id
        if m.recipient_id == current_user.id and m.read_at is None:
            unread_counts[other_id] = unread_counts.get(other_id, 0) + 1
        if other_id not in summaries:
            other_user = db.get(User, other_id)
            if other_user is None:
                continue
            summaries[other_id] = ConversationSummary(
                user_id=other_id,
                full_name=other_user.full_name,
                email=other_user.email,
                last_message=m.body,
                last_message_at=m.created_at,
                unread_count=0,
            )

    for user_id, summary in summaries.items():
        summary.unread_count = unread_counts.get(user_id, 0)

    return list(summaries.values())


@router.get("/with/{other_user_id}", response_model=list[MessageOut])
def get_conversation(
    other_user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.sender_id == current_user.id,
                    Message.recipient_id == other_user_id,
                ),
                and_(
                    Message.sender_id == other_user_id,
                    Message.recipient_id == current_user.id,
                ),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Mark incoming messages as read.
    unread_incoming = [
        m for m in messages if m.recipient_id == current_user.id and m.read_at is None
    ]
    if unread_incoming:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        for m in unread_incoming:
            m.read_at = now
        db.commit()

    return messages
