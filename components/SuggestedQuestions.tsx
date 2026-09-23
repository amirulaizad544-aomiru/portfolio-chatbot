const SUGGESTED_QUESTIONS = [
  "What projects has Amirul built?",
  "Tell me about EcoQuest.",
  "What technologies does Amirul know?",
  "What did Amirul do during his internship?",
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted">Ask me about:</span>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
