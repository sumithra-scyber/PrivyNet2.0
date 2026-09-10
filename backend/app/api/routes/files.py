import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.audit_log import AuditEventType
from app.models.shared_file import SharedFile
from app.models.user import User
from app.schemas.file import SharedFileOut
from app.services.audit import log_event

router = APIRouter(prefix="/api/files", tags=["files"])
settings = get_settings()


def _storage_path() -> Path:
    path = Path(settings.STORAGE_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/upload", response_model=SharedFileOut, status_code=201)
async def upload_file(
    recipient_id: uuid.UUID,
    file: UploadFile,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share a file with yourself")

    recipient = db.get(User, recipient_id)
    if recipient is None or not recipient.is_active:
        raise HTTPException(status_code=404, detail="Recipient not found")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds maximum allowed size")

    stored_filename = f"{uuid.uuid4()}_{file.filename}"
    dest = _storage_path() / stored_filename
    dest.write_bytes(contents)

    record = SharedFile(
        owner_id=current_user.id,
        recipient_id=recipient_id,
        original_filename=file.filename or "file",
        stored_filename=stored_filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_event(
        db,
        AuditEventType.FILE_ACCESS,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        detail=f"Uploaded '{record.original_filename}' shared with {recipient.email}",
    )
    return record


@router.get("/shared-with-me", response_model=list[SharedFileOut])
def list_shared_with_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SharedFile)
        .filter(SharedFile.recipient_id == current_user.id)
        .order_by(SharedFile.created_at.desc())
        .all()
    )


@router.get("/shared-by-me", response_model=list[SharedFileOut])
def list_shared_by_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SharedFile)
        .filter(SharedFile.owner_id == current_user.id)
        .order_by(SharedFile.created_at.desc())
        .all()
    )


@router.get("/{file_id}/download")
def download_file(
    file_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.get(SharedFile, file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")

    is_authorized = current_user.id in (record.owner_id, record.recipient_id)
    if not is_authorized:
        log_event(
            db,
            AuditEventType.UNAUTHORIZED_ACCESS,
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
            detail=f"Attempted to download file {file_id} without permission",
        )
        raise HTTPException(status_code=403, detail="You do not have access to this file")

    path = _storage_path() / record.stored_filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File content missing on server")

    log_event(
        db,
        AuditEventType.FILE_DOWNLOAD,
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        detail=f"Downloaded '{record.original_filename}' (file {file_id})",
    )
    return FileResponse(
        path=path,
        filename=record.original_filename,
        media_type=record.content_type,
    )
