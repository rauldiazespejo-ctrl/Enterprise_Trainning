import uuid
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.learning import (
    Attempt, Question, LearningGap, RemediationPath, DocumentSection, Assignment
)

def analyze_attempt_and_generate_remediation(db: Session, attempt_id: uuid.UUID):
    """
    Analyzes an attempt to find failed questions.
    Groups failures by critical concept and creates Learning Gaps and Remediation Paths.
    """
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise ValueError("Attempt not found")
        
    assignment = db.query(Assignment).filter(Assignment.id == attempt.assignment_id).first()
    if not assignment:
        raise ValueError("Assignment not found")
        
    # Example structure of attempt.responses: 
    # [{"question_id": "uuid", "is_correct": False, "selected_answer": "..."}]
    responses = attempt.responses or []
    
    failed_questions = []
    for resp in responses:
        if not resp.get("is_correct"):
            q = db.query(Question).filter(Question.id == resp.get("question_id")).first()
            if q:
                failed_questions.append(q)
                
    if not failed_questions:
        return {"status": "success", "gaps_created": 0}

    # Group gaps by concept (using the risk_tags or criticality from the section as proxy for concept)
    # This prevents creating 5 gaps if the user failed 5 questions about the same concept.
    concept_groups: Dict[str, List[Question]] = {}
    
    for q in failed_questions:
        section = db.query(DocumentSection).filter(DocumentSection.id == q.section_id).first()
        # Default concept if tags are missing
        concept = "Concepto General" 
        
        if section and section.risk_tags and len(section.risk_tags) > 0:
            concept = section.risk_tags[0] # Group by primary risk tag
            
        if concept not in concept_groups:
            concept_groups[concept] = []
        concept_groups[concept].append(q)
        
    gaps_created = 0
    
    for concept, questions in concept_groups.items():
        # Use the first question's section as the primary source for the micro-lesson
        primary_section_id = questions[0].section_id
        
        # Check if an open gap already exists for this concept and user to avoid duplicates
        existing_gap = db.query(LearningGap).filter(
            LearningGap.user_id == assignment.user_id,
            LearningGap.critical_concept == concept,
            LearningGap.status == "open"
        ).first()
        
        if not existing_gap:
            # Create the Gap
            gap = LearningGap(
                user_id=assignment.user_id,
                question_id=questions[0].id,
                section_id=primary_section_id,
                critical_concept=concept,
                status="open"
            )
            db.add(gap)
            db.commit()
            db.refresh(gap)
            
            # Generate the Remediation Path
            # In a real scenario, we might call the LLM again here to generate a custom micro-lesson based on the concept
            # For now, we mock the micro-lesson generation
            primary_section = db.query(DocumentSection).filter(DocumentSection.id == primary_section_id).first()
            
            remediation = RemediationPath(
                gap_id=gap.id,
                micro_lesson_content=f"Refuerzo sobre: {concept}. Recuerda revisar la sección: {primary_section.title if primary_section else 'Material de apoyo'}",
                status="pending"
            )
            db.add(remediation)
            db.commit()
            
            gaps_created += 1
            
    return {
        "status": "remediation_required",
        "gaps_created": gaps_created,
        "concepts_failed": list(concept_groups.keys())
    }
