import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSummary, chatSummary } from '../api/client'
import {
  Star, GitFork, Code2, Clock, Copy, Download,
  ArrowLeft, CheckCheck, Zap, ExternalLink, AlertCircle,
  MessageSquare, Send,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const SECTIONS = [
  {
    key: 'overview',
    label: 'Overview',
    icon: '🔍',
    gradient: 'from-violet-500/10 to-purple-500/10',
    border: 'border-violet-500/20',
    dot: 'bg-violet-400',
  },
  {
    key: 'keyFeatures',
    label: 'Key Features',
    icon: '⭐',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    border: 'border-cyan-500/20',
    dot: 'bg-cyan-400',
  },
  {
    key: 'techStack',
    label: 'Tech Stack',
    icon: '🛠️',
    gradient: 'from-orange-500/10 to-amber-500/10',
    border: 'border-orange-500/20',
    dot: 'bg-orange-400',
  },
  {
    key: 'useCases',
    label: 'Use Cases',
    icon: '💡',
    gradient: 'from-green-500/10 to-emerald-500/10',
    border: 'border-green-500/20',
    dot: 'bg-green-400',
  },
  {
    key: 'beginnerExplanation',
    label: 'Beginner Explanation',
    icon: '🌱',
    gradient: 'from-pink-500/10 to-rose-500/10',
    border: 'border-pink-500/20',
    dot: 'bg-pink-400',
  },
  {
    key: 'technicalExplanation',
    label: 'Technical Explanation',
    icon: '⚙️',
    gradient: 'from-indigo-500/10 to-blue-500/10',
    border: 'border-indigo-500/20',
    dot: 'bg-indigo-400',
  },
]

function MetaBadge({ icon, label, value }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-white font-semibold text-sm">{value}</div>
    </div>
  )
}

function SkeletonResults() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="h-12 w-80 skeleton rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
    </div>
  )
}

export default function ResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [chatPrompt, setChatPrompt] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const contentRef = useRef(null)

  useEffect(() => {
    if (!id) return
    getSummary(id)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopy = () => {
    if (!summary?.content) return
    const c = summary.content
    const text = [
      `# ${summary.repoName} — AI Summary`,
      `URL: ${summary.repoUrl}`,
      '',
      `## Overview\n${c.overview}`,
      '',
      `## Key Features\n${(c.keyFeatures || []).map((f) => `• ${f}`).join('\n')}`,
      '',
      `## Tech Stack\n${(c.techStack || []).join(' · ')}`,
      '',
      `## Use Cases\n${(c.useCases || []).map((u) => `• ${u}`).join('\n')}`,
      '',
      `## Beginner Explanation\n${c.beginnerExplanation}`,
      '',
      `## Technical Explanation\n${c.technicalExplanation}`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleDownload = async () => {
    if (!contentRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#080b14',
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let yLeft = imgH
      let offset = 0
      while (yLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, offset === 0 ? 0 : -offset, pageW, imgH)
        yLeft -= pageH
        offset += pageH
        if (yLeft > 0) pdf.addPage()
      }
      pdf.save(`${summary.repoName}-summary.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!id || !chatPrompt.trim()) return
    setChatLoading(true)
    setChatError('')
    try {
      const res = await chatSummary(id, chatPrompt.trim())
      setChatAnswer(res.answer || '')
    } catch (err) {
      setChatError(err.message)
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <SkeletonResults />

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
      <p className="text-slate-400 mb-8">{error}</p>
      <button onClick={() => navigate('/')} className="btn-primary">← Back to Home</button>
    </div>
  )

  if (!summary) return null
  const c = summary.content || {}

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div ref={contentRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 truncate">
              {summary.owner}/{summary.repoName}
            </h1>
            <a
              href={summary.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm transition-colors"
            >
              {summary.repoUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="copy-btn"
              onClick={handleCopy}
              className="btn-ghost text-sm"
            >
              {copied
                ? <><CheckCheck className="w-4 h-4 text-green-400" /> Copied!</>
                : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
            <button
              id="download-pdf-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary text-sm py-2 px-4"
            >
              {downloading
                ? <><LoadingSpinner size="xs" /> Generating…</>
                : <><Download className="w-4 h-4" /> PDF</>}
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <MetaBadge icon={<Star className="w-3.5 h-3.5 text-yellow-400" />} label="Stars" value={summary.stars?.toLocaleString() ?? '—'} />
          <MetaBadge icon={<GitFork className="w-3.5 h-3.5 text-slate-400" />} label="Forks" value={summary.forks?.toLocaleString() ?? '—'} />
          <MetaBadge icon={<Code2 className="w-3.5 h-3.5 text-cyan-400" />} label="Language" value={summary.language ?? '—'} />
          <MetaBadge icon={<Clock className="w-3.5 h-3.5 text-violet-400" />} label="Last Updated"
            value={summary.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
        </div>

        {/* Cached badge */}
        {summary.cached && (
          <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
            <Zap className="w-3 h-3" />
            Loaded from cache
          </div>
        )}

        {/* Summary sections */}
        <div className="space-y-5">
          {SECTIONS.map((section, idx) => {
            const value = c[section.key]
            if (!value) return null
            const isList = Array.isArray(value)
            return (
              <div
                key={section.key}
                className={`bg-gradient-to-br ${section.gradient} border ${section.border} rounded-2xl p-6 transition-all hover:border-opacity-40`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                  <span className="text-xl">{section.icon}</span>
                  {section.label}
                </h2>

                {isList ? (
                  section.key === 'techStack' ? (
                    <div className="flex flex-wrap gap-2">
                      {value.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-200 border border-white/10">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {value.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm leading-relaxed">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${section.dot}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <p className="text-slate-300 text-sm leading-relaxed">{value}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Ask AI follow-up */}
        <div className="mt-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-3">
            <MessageSquare className="w-4 h-4 text-violet-300" />
            Ask about this repository
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Ask a custom question about architecture, modules, tradeoffs, setup, or use cases.
          </p>
          <form onSubmit={handleChatSubmit} className="space-y-3">
            <textarea
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Example: Explain the likely folder/module structure and data flow."
              disabled={chatLoading}
              rows={4}
              className="input-field w-full text-sm leading-relaxed resize-y"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatPrompt.trim()}
              className="btn-primary text-sm py-2 px-4"
            >
              {chatLoading
                ? <><LoadingSpinner size="xs" /> Thinking…</>
                : <><Send className="w-4 h-4" /> Ask AI</>}
            </button>
          </form>
          {chatError && (
            <p className="mt-3 text-sm text-red-400">{chatError}</p>
          )}
          {chatAnswer && (
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{chatAnswer}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">Summarized on {new Date(summary.createdAt).toLocaleDateString()}</p>
        <div className="flex gap-3">
          <Link to="/dashboard" className="btn-ghost text-sm">View History</Link>
          <Link to="/" className="btn-primary text-sm py-2 px-4">Analyze Another →</Link>
        </div>
      </div>
    </div>
  )
}
