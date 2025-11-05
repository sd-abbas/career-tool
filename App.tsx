
import React, { useState, useCallback, useMemo } from 'react';
import type { Assessments, AssessmentType, Answers, Recommendation, TestState, View, Question } from './types';
import { getCareerRecommendations } from './services/geminiService';

const initialAssessments: Assessments = {
  career: ["Do you enjoy solving complex puzzles and problems?", "Are you interested in how technology shapes the world?", "Do you prefer tasks that have a clear, measurable outcome?"],
  personality: ["When facing a group project, do you naturally take the lead or prefer to play a supporting role?", "Are you more energized by interacting with a large group of people or by having a deep conversation with one or two individuals?", "Do you make decisions more with your head (logic) or your heart (feelings)?"],
  skills: ["On a scale of 1-5, how comfortable are you with public speaking?", "On a scale of 1-5, how would you rate your ability to work with data (spreadsheets, analytics)?", "On a scale of 1-5, how proficient are you in a creative skill (e.g., writing, design, music)?"]
};

// --- Reusable UI Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
}
const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 sm:p-8 ${className}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, className = '', variant = 'primary', ...props }, ref) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-transform transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };
  return (
    <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => (
  <select className={`w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`} {...props}>
    {children}
  </select>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input className={`w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`} {...props} />
);

// --- View Components ---

const Header: React.FC = () => (
  <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
    <div className="container mx-auto px-4 py-6 text-center">
      <h1 className="text-3xl md:text-4xl font-bold">AI-Powered Career Assessment</h1>
      <p className="mt-2 text-indigo-200 text-lg">Discover your path to a fulfilling career.</p>
    </div>
  </header>
);

interface TabsProps {
  activeView: View;
  setActiveView: (view: View) => void;
}
const Tabs: React.FC<TabsProps> = ({ activeView, setActiveView }) => (
  <nav className="bg-white shadow-sm -mt-1 sticky top-0 z-10">
    <div className="container mx-auto flex justify-center p-2">
      <button
        onClick={() => setActiveView('student')}
        className={`px-6 py-2 font-medium text-lg rounded-md ${activeView === 'student' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        Student
      </button>
      <button
        onClick={() => setActiveView('admin')}
        className={`px-6 py-2 font-medium text-lg rounded-md ${activeView === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        Admin
      </button>
    </div>
  </nav>
);

interface AdminViewProps {
  assessments: Assessments;
  onAddQuestion: (type: AssessmentType, question: Question) => void;
  onRemoveQuestion: (type: AssessmentType, index: number) => void;
}
const AdminView: React.FC<AdminViewProps> = ({ assessments, onAddQuestion, onRemoveQuestion }) => {
  const [selectedTestType, setSelectedTestType] = useState<AssessmentType>('career');
  const [newQuestion, setNewQuestion] = useState('');

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      onAddQuestion(selectedTestType, newQuestion.trim());
      setNewQuestion('');
    }
  };
  
  const questions = useMemo(() => assessments[selectedTestType], [assessments, selectedTestType]);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Manage Assessments</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="adminTestType" className="block text-sm font-medium text-slate-700 mb-1">Test Type</label>
            <Select id="adminTestType" value={selectedTestType} onChange={(e) => setSelectedTestType(e.target.value as AssessmentType)}>
              <option value="career">Career Test</option>
              <option value="personality">Personality Test</option>
              <option value="skills">Skills Evaluation</option>
            </Select>
          </div>
          <div>
            <label htmlFor="newQuestion" className="block text-sm font-medium text-slate-700 mb-1">New Question</label>
            <Input
              id="newQuestion"
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter a new question"
            />
          </div>
          <Button onClick={handleAddQuestion} className="w-full sm:w-auto">Add Question</Button>
        </div>
      </Card>
      <Card>
        <h3 className="text-xl font-bold text-slate-800 mb-4 capitalize">{selectedTestType} Questions</h3>
        <ul className="space-y-3">
          {questions.length > 0 ? questions.map((q, i) => (
            <li key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
              <span className="text-slate-700 mr-4">{i+1}. {q}</span>
              <Button variant="danger" onClick={() => onRemoveQuestion(selectedTestType, i)} className="px-2 py-1 text-sm">
                Remove
              </Button>
            </li>
          )) : <p className="text-slate-500">No questions for this assessment yet.</p>}
        </ul>
      </Card>
    </div>
  );
};

interface StudentViewProps {
  assessments: Assessments;
}
const StudentView: React.FC<StudentViewProps> = ({ assessments }) => {
  const [selectedTestType, setSelectedTestType] = useState<AssessmentType>('career');
  const [testState, setTestState] = useState<TestState>('idle');
  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestions = useMemo(() => assessments[selectedTestType], [assessments, selectedTestType]);

  const handleStartTest = () => {
    setAnswers({});
    setResults([]);
    setTestState('in-progress');
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleSubmitTest = async () => {
    setIsLoading(true);
    setTestState('completed');
    const recommendations = await getCareerRecommendations(selectedTestType, currentQuestions, answers);
    setResults(recommendations);
    setIsLoading(false);
  };

  const isSubmitDisabled = useMemo(() => {
    return currentQuestions.some((_, index) => !answers[index]?.trim());
  }, [answers, currentQuestions]);
  
  return (
    <Card>
      {testState === 'idle' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Take an Assessment</h2>
          <p className="text-slate-600 mb-6">Select a test to begin your career discovery journey.</p>
          <div className="max-w-xs mx-auto space-y-4">
            <Select value={selectedTestType} onChange={(e) => setSelectedTestType(e.target.value as AssessmentType)}>
              <option value="career">Career Test</option>
              <option value="personality">Personality Test</option>
              <option value="skills">Skills Evaluation</option>
            </Select>
            <Button onClick={handleStartTest} className="w-full">Start Test</Button>
          </div>
        </div>
      )}

      {testState === 'in-progress' && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 capitalize">{selectedTestType} Test</h2>
          <div className="space-y-6">
            {currentQuestions.map((q, i) => (
              <div key={i}>
                <label className="block font-medium text-slate-700 mb-2">{i + 1}. {q}</label>
                <Input type="text" value={answers[i] || ''} onChange={(e) => handleAnswerChange(i, e.target.value)} placeholder="Your answer here..." />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-4">
             <Button variant="secondary" onClick={() => setTestState('idle')}>Cancel</Button>
             <Button onClick={handleSubmitTest} disabled={isSubmitDisabled}>Submit Answers</Button>
          </div>
        </div>
      )}

      {testState === 'completed' && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Results</h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-slate-600">Our AI is analyzing your results...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700">Recommended Career Paths:</h3>
              <ul className="space-y-4">
                {results.map((rec, i) => (
                  <li key={i} className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-800">{rec.career}</h4>
                    <p className="text-slate-600 mt-1">{rec.reason}</p>
                  </li>
                ))}
              </ul>
              <Button onClick={() => setTestState('idle')} className="mt-4">Take Another Test</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeView, setActiveView] = useState<View>('student');
  const [assessments, setAssessments] = useState<Assessments>(initialAssessments);

  const handleAddQuestion = useCallback((type: AssessmentType, question: Question) => {
    setAssessments(prev => ({
      ...prev,
      [type]: [...prev[type], question]
    }));
  }, []);

  const handleRemoveQuestion = useCallback((type: AssessmentType, index: number) => {
    setAssessments(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <Tabs activeView={activeView} setActiveView={setActiveView} />
      <main className="container mx-auto p-4 md:p-6">
        {activeView === 'student' ? <StudentView assessments={assessments} /> : <AdminView assessments={assessments} onAddQuestion={handleAddQuestion} onRemoveQuestion={handleRemoveQuestion} />}
      </main>
    </div>
  );
}
