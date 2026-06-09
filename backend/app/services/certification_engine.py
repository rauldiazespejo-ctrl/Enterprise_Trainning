import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.learning import (
    Attempt, Assignment, Course, ProcedureVersion, Certification, LearningGap
)

def evaluate_and_grant_certification(db: Session, user_id: uuid.UUID, course_id: uuid.UUID):
    """
    Evaluates if a user is eligible for certification.
    Conditions:
    1. Exam passed (latest attempt score >= passing_score).
    2. All learning gaps for this course's sections are closed.
    3. Procedure version is still published/active.
    """
    assignment = db.query(Assignment).filter(
        Assignment.user_id == user_id, 
        Assignment.course_id == course_id
    ).first()
    
    if not assignment:
        return {"status": "error", "message": "No assignment found"}

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return {"status": "error", "message": "Course not found"}

    # Condition 1: Check latest attempt
    latest_attempt = db.query(Attempt).filter(
        Attempt.assignment_id == assignment.id
    ).order_by(Attempt.created_at.desc()).first()
    
    if not latest_attempt or latest_attempt.score is None:
        return {"status": "pending", "message": "No valid attempt found"}
        
    if latest_attempt.score < course.passing_score:
        return {"status": "pending", "message": f"Score {latest_attempt.score} below passing score {course.passing_score}"}

    # Condition 2: Check learning gaps
    open_gaps = db.query(LearningGap).filter(
        LearningGap.user_id == user_id,
        LearningGap.status == "open"
    ).all()
    
    # We should filter open_gaps by this course's procedure_version_id, but for simplicity we check if there are ANY open gaps
    # related to the sections of this course.
    if len(open_gaps) > 0:
        return {"status": "pending", "message": "There are open learning gaps that need remediation"}

    # Condition 3: Check procedure version
    proc_version = db.query(ProcedureVersion).filter(ProcedureVersion.id == course.procedure_version_id).first()
    if proc_version.status not in ["published", "active"]:
        return {"status": "error", "message": "Procedure version is no longer active"}

    # All conditions met, grant certification
    # Check if they already have an active cert
    existing_cert = db.query(Certification).filter(
        Certification.user_id == user_id,
        Certification.procedure_version_id == proc_version.id,
        Certification.status == "active"
    ).first()
    
    if existing_cert:
        return {"status": "success", "message": "Certification already active", "certification_id": existing_cert.id}

    # Issue new cert valid for 1 year
    new_cert = Certification(
        user_id=user_id,
        procedure_version_id=proc_version.id,
        status="active",
        expires_at=datetime.utcnow() + timedelta(days=365)
    )
    
    # Invalidate older versions of certs for the same procedure (base procedure)
    # This involves joining ProcedureVersion to find older certs for the same Procedure and marking them "superseded".
    
    db.add(new_cert)
    
    # Mark assignment as completed
    assignment.status = "completed"
    
    db.commit()
    db.refresh(new_cert)
    
    return {
        "status": "certified",
        "message": "Certification granted successfully",
        "certification_id": new_cert.id
    }
