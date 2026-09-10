import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.feedback_comment import FeedbackComment
from app.models.feedback_like import FeedbackLike
from app.models.feedback_post import FeedbackPost
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCommentCreate,
    FeedbackCommentOut,
    FeedbackPostCreate,
    FeedbackPostOut,
)

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


def _serialize_post(post: FeedbackPost, db: Session, current_user: User) -> FeedbackPostOut:
    like_count = db.query(FeedbackLike).filter(FeedbackLike.post_id == post.id).count()
    comment_count = (
        db.query(FeedbackComment).filter(FeedbackComment.post_id == post.id).count()
    )
    liked_by_me = (
        db.query(FeedbackLike)
        .filter(FeedbackLike.post_id == post.id, FeedbackLike.user_id == current_user.id)
        .first()
        is not None
    )
    return FeedbackPostOut(
        id=post.id,
        body=post.body,
        created_at=post.created_at,
        like_count=like_count,
        comment_count=comment_count,
        liked_by_me=liked_by_me,
    )


@router.post("", response_model=FeedbackPostOut, status_code=201)
def create_post(
    payload: FeedbackPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = FeedbackPost(author_id=current_user.id, body=payload.body)
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize_post(post, db, current_user)


@router.get("", response_model=list[FeedbackPostOut])
def list_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = db.query(FeedbackPost).order_by(FeedbackPost.created_at.desc()).all()
    return [_serialize_post(p, db, current_user) for p in posts]


@router.post("/{post_id}/like", response_model=FeedbackPostOut)
def toggle_like(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.get(FeedbackPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = (
        db.query(FeedbackLike)
        .filter(FeedbackLike.post_id == post_id, FeedbackLike.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(FeedbackLike(post_id=post_id, user_id=current_user.id))
    db.commit()
    return _serialize_post(post, db, current_user)


@router.get("/{post_id}/comments", response_model=list[FeedbackCommentOut])
def list_comments(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return (
        db.query(FeedbackComment)
        .filter(FeedbackComment.post_id == post_id)
        .order_by(FeedbackComment.created_at.asc())
        .all()
    )


@router.post("/{post_id}/comments", response_model=FeedbackCommentOut, status_code=201)
def create_comment(
    post_id: uuid.UUID,
    payload: FeedbackCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.get(FeedbackPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = FeedbackComment(
        post_id=post_id, author_id=current_user.id, body=payload.body
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
