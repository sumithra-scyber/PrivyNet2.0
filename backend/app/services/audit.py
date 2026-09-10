import uuid

from sqlalchemy.orm import Session

from app.models.audit_log import AuditEventType, AuditLog


def log_event(
    db: Session,
    event_type: AuditEventType,
    user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
    detail: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        detail=detail,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
