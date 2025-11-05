
export type AssessmentType = 'career' | 'personality' | 'skills';

export type Question = string;

export type Assessments = Record<AssessmentType, Question[]>;

export type Answers = Record<number, string>;

export interface Recommendation {
  career: string;
  reason: string;
}

export type TestState = 'idle' | 'in-progress' | 'completed';

export type View = 'student' | 'admin';
