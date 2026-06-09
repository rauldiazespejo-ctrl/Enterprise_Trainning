from app.database import Base
from app.models.core import Company, Client, User
from app.models.learning import (
    Procedure, ProcedureVersion, DocumentSection,
    Course, Lesson, Infographic, Question,
    TrainingMatrix, Assignment, Attempt,
    LearningGap, RemediationPath, Certification, Alert
)
