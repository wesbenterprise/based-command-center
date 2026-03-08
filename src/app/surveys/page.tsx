'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────
interface Survey {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: 'active' | 'draft' | 'closed';
  created_at: string;
  question_count: number;
  response_count: number;
}

interface SurveyQuestion {
  id: string;
  survey_id: string;
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
  order_index: number;
}

interface SurveyWithQuestions extends Survey {
  questions: SurveyQuestion[];
}

interface GeneratedQuestion {
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
}

interface GeneratedSurvey {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_name?: string;
  respondent_email?: string;
  answers: Record<string, unknown>;
  created_at: string;
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(0,255,0,0.15)', color: 'var(--accent-green)' },
    draft: { bg: 'rgba(234,179,8,0.15)', color: 'var(--accent-amber)' },
    closed: { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' },
  };
  const c = colors[status] || colors.draft;
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 4,
      fontSize: 11,
      fontFamily: 'var(--font-heading)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.color}`,
    }}>
      {status}
    </span>
  );
}

// ─── Section Header ────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 style={{
      fontSize: 15,
      color: 'var(--text-muted)',
      margin: '0 0 16px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      fontFamily: 'var(--font-heading)',
    }}>
      {title}
    </h3>
  );
}

// ─── Section 1: Survey Viewer ──────────────────────────────
function SurveyViewer({ surveys, onRefresh }: { surveys: Survey[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSurvey, setExpandedSurvey] = useState<SurveyWithQuestions | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (survey: Survey) => {
    if (!confirm(`Delete "${survey.title}"? This will also delete all questions and responses.`)) return;
    setDeletingId(survey.id);
    await fetch(`/api/surveys/${survey.id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (expandedId === survey.id) {
      setExpandedId(null);
      setExpandedSurvey(null);
    }
    onRefresh();
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedSurvey(null);
      return;
    }
    setExpandedId(id);
    const res = await fetch(`/api/surveys/${id}`);
    if (res.ok) {
      setExpandedSurvey(await res.json());
    }
  };

  const handleToggleStatus = async (survey: Survey) => {
    setTogglingId(survey.id);
    const newStatus = survey.status === 'active' ? 'draft' : 'active';
    await fetch(`/api/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setTogglingId(null);
    onRefresh();
  };

  if (surveys.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        No surveys yet. Use the AI Creator below to generate your first survey.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {surveys.map(survey => (
        <div key={survey.id} className="panel" style={{ border: '1px solid rgba(255,0,255,0.2)' }}>
          <div
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
            onClick={() => handleExpand(survey.id)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--accent-magenta)' }}>
                  {survey.title}
                </span>
                <StatusBadge status={survey.status} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '6px 0 0' }}>
                {survey.description}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{survey.question_count} questions</span>
                <span>{survey.response_count} responses</span>
                <span>{new Date(survey.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleStatus(survey); }}
                disabled={togglingId === survey.id}
                style={{
                  background: 'transparent',
                  border: `1px solid ${survey.status === 'active' ? 'var(--accent-amber)' : 'var(--accent-green)'}`,
                  color: survey.status === 'active' ? 'var(--accent-amber)' : 'var(--accent-green)',
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  opacity: togglingId === survey.id ? 0.5 : 1,
                }}
              >
                {survey.status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
              </button>
              <a
                href={`https://based-surveys.vercel.app/s/${survey.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                OPEN ↗
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(survey); }}
                disabled={deletingId === survey.id}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent-red)',
                  color: 'var(--accent-red)',
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  opacity: deletingId === survey.id ? 0.5 : 1,
                }}
              >
                {deletingId === survey.id ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>

          {expandedId === survey.id && expandedSurvey && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
                QUESTIONS
              </div>
              {expandedSurvey.questions.map((q, i) => (
                <div key={q.id} style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'baseline',
                }}>
                  <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontFamily: 'var(--font-heading)', minWidth: 24 }}>
                    Q{i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{q.text}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>({q.type})</span>
                    {q.options && q.options.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Options: {q.options.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section 2: Survey Creator (AI-Powered) ────────────────
function SurveyCreator({ onDeployed }: { onDeployed: () => void }) {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [textContent, setTextContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [preview, setPreview] = useState<GeneratedSurvey | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, []);

  const readFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
      setInputMode('file');
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    const content = inputMode === 'file' ? fileContent : textContent;
    if (!content.trim()) {
      setError('Please provide content to generate a survey from.');
      return;
    }

    setGenerating(true);
    setError('');
    setPreview(null);

    try {
      const res = await fetch('/api/surveys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const survey = await res.json();
      setPreview(survey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!preview) return;
    setDeploying(true);
    setError('');

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: preview.title,
          description: preview.description,
          questions: preview.questions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Deploy failed');
      }

      setPreview(null);
      setTextContent('');
      setFileContent('');
      setFileName('');
      onDeployed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="panel" style={{ border: '1px solid rgba(255,0,255,0.2)' }}>
      {/* Input Mode Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setInputMode('text')}
          style={{
            background: inputMode === 'text' ? 'rgba(255,0,255,0.15)' : 'transparent',
            border: `1px solid ${inputMode === 'text' ? 'var(--accent-magenta)' : 'var(--border-subtle)'}`,
            color: inputMode === 'text' ? 'var(--accent-magenta)' : 'var(--text-muted)',
            padding: '6px 16px',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          PASTE TEXT
        </button>
        <button
          onClick={() => setInputMode('file')}
          style={{
            background: inputMode === 'file' ? 'rgba(255,0,255,0.15)' : 'transparent',
            border: `1px solid ${inputMode === 'file' ? 'var(--accent-magenta)' : 'var(--border-subtle)'}`,
            color: inputMode === 'file' ? 'var(--accent-magenta)' : 'var(--text-muted)',
            padding: '6px 16px',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          UPLOAD FILE
        </button>
      </div>

      {/* Text Input */}
      {inputMode === 'text' && (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Describe the survey you want to create, or paste the document content to generate questions from..."
          style={{
            width: '100%',
            minHeight: 140,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: 12,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* File Upload */}
      {inputMode === 'file' && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-subtle)',
            padding: 40,
            textAlign: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 14,
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          {fileName ? (
            <span style={{ color: 'var(--accent-cyan)' }}>📄 {fileName}</span>
          ) : (
            <span>Drop a file here (PDF, MD, TXT) or click to browse</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.txt,.markdown"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="generate-btn"
        style={{
          marginTop: 16,
          width: '100%',
          padding: '12px 24px',
          background: generating ? 'rgba(255,0,255,0.1)' : 'transparent',
          border: '1px solid var(--accent-magenta)',
          color: 'var(--accent-magenta)',
          fontSize: 14,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.1em',
          cursor: generating ? 'wait' : 'pointer',
          transition: 'all 0.3s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (!generating) {
            e.currentTarget.style.background = 'rgba(255,0,255,0.15)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,255,0.3), 0 0 40px rgba(255,0,255,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!generating) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {generating ? '⟳ GENERATING WITH CLAUDE...' : '✦ GENERATE SURVEY'}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
            PREVIEW
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--accent-cyan)' }}>
              {preview.title}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0' }}>
              {preview.description}
            </p>
          </div>

          {preview.questions.map((q, i) => (
            <div key={i} style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 10,
              alignItems: 'baseline',
            }}>
              <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontFamily: 'var(--font-heading)', minWidth: 24 }}>
                Q{i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                  {q.text}
                  {q.required && <span style={{ color: 'var(--accent-red)', marginLeft: 4 }}>*</span>}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Type: {q.type}</span>
                {q.options && q.options.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {q.options.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="run-btn"
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px 24px',
              fontSize: 14,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.1em',
              cursor: deploying ? 'wait' : 'pointer',
            }}
          >
            {deploying ? '⟳ DEPLOYING...' : '🚀 DEPLOY SURVEY'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section 3: Response Repository ────────────────────────
function ResponseRepository({ surveys }: { surveys: Survey[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const surveysWithResponses = surveys.filter(s => s.response_count > 0);

  const handleExpand = async (surveyId: string) => {
    if (expandedId === surveyId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(surveyId);
    setLoadingId(surveyId);
    const res = await fetch(`/api/surveys/${surveyId}/responses`);
    if (res.ok) {
      setResponses(await res.json());
    }
    setLoadingId(null);
  };

  const handleExport = (surveyId: string) => {
    window.open(`/api/surveys/${surveyId}/responses/csv`, '_blank');
  };

  if (surveysWithResponses.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        No responses collected yet. Responses will appear here once surveys receive submissions.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {surveysWithResponses.map(survey => (
        <div key={survey.id} className="panel" style={{ border: '1px solid rgba(255,0,255,0.2)' }}>
          <div
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => handleExpand(survey.id)}
          >
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--accent-magenta)' }}>
                {survey.title}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 12 }}>
                {survey.response_count} response{survey.response_count !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleExport(survey.id); }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  padding: '4px 12px',
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                EXPORT CSV
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {expandedId === survey.id ? '▾' : '▸'}
              </span>
            </div>
          </div>

          {expandedId === survey.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              {loadingId === survey.id ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Loading responses...</div>
              ) : responses.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>No responses found.</div>
              ) : (
                responses.map((resp, i) => (
                  <div key={resp.id} style={{
                    padding: '12px',
                    borderBottom: i < responses.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>
                        {resp.respondent_name || resp.respondent_email || 'Anonymous'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(resp.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(resp.answers || {}).map(([key, val]) => (
                        <div key={key} style={{ fontSize: 13, display: 'flex', gap: 8 }}>
                          <span style={{ color: 'var(--text-muted)', minWidth: 100, flexShrink: 0 }}>{key}:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSurveys = useCallback(async () => {
    const res = await fetch('/api/surveys');
    if (res.ok) {
      setSurveys(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Page Header */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 24,
            letterSpacing: '0.12em',
            margin: 0,
          }}>
            <span className="neon-magenta">SURVEYS</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
            Create, manage, and analyze surveys with AI-powered generation
          </p>
        </div>

        {/* Section 1: Survey Viewer */}
        <div>
          <SectionHeader title="Survey Viewer" />
          {loading ? (
            <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Loading surveys...
            </div>
          ) : (
            <SurveyViewer surveys={surveys} onRefresh={fetchSurveys} />
          )}
        </div>

        {/* Section 2: AI-Powered Survey Creator */}
        <div>
          <SectionHeader title="AI Survey Creator" />
          <SurveyCreator onDeployed={fetchSurveys} />
        </div>

        {/* Section 3: Response Repository */}
        <div>
          <SectionHeader title="Response Repository" />
          {loading ? (
            <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Loading responses...
            </div>
          ) : (
            <ResponseRepository surveys={surveys} />
          )}
        </div>
      </div>
    </main>
  );
}
