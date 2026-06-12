import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getHistory, deleteSummary } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  Star, GitFork, Clock, Trash2, ExternalLink,
  Plus, Code2, LayoutDashboard,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-36 skeleton rounded" />
        <div className="h-5 w-16 skeleton rounded-full" />
      </div>
      <div className="h-3 w-48 skeleton rounded" />
      <div className="flex gap-4">
        <div className="h-3 w-12 skeleton rounded" />
        <div className="h-3 w-12 skeleton rounded" />
        <div className="h-3 w-16 skeleton rounded" />
      </div>
      <div className="h-16 skeleton rounded" />
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-8 skeleton rounded-lg" />
        <div className="w-10 h-8 skeleton rounded-lg" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    getHistory()
      .then(({ summaries }) => setSummaries(summaries))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteSummary(id)
      setSummaries((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const LANG_COLORS = {
    JavaScript: 'text-yellow-400', TypeScript: 'text-blue-400',
    Python: 'text-cyan-400', Go: 'text-teal-400', Rust: 'text-orange-400',
    Java: 'text-red-400', 'C++': 'text-purple-400', Ruby: 'text-rose-400',
  }
  const langColor = (lang) => LANG_COLORS[lang] || 'text-slate-400'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Your Repositories
          </h1>
          <p className="text-slate-400 mt-1">
            Welcome back, <span className="text-violet-300">{user?.name || user?.email}</span>!
            {' '}{summaries.length > 0 && `${summaries.length} repo${summaries.length !== 1 ? 's' : ''} analyzed.`}
          </p>
        </div>
        <Link to="/" className="btn-primary text-sm py-2.5 px-5 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Analyze New Repo
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-3xl">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No repos analyzed yet</h2>
          <p className="text-slate-400 max-w-sm mb-8">
            Paste any GitHub URL on the home page and get an instant AI-powered summary.
          </p>
          <Link to="/" className="btn-primary">Analyze your first repo →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {summaries.map((s) => (
            <div
              key={s.id}
              className="glass-card rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-200 group flex flex-col"
            >
              <div className="flex-1">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors text-base truncate">
                    {s.repoName}
                  </h3>
                  {s.language && (
                    <span className={`text-xs font-medium shrink-0 ${langColor(s.language)}`}>
                      {s.language}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 truncate mb-4">{s.owner}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    {s.stars?.toLocaleString() ?? '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {s.forks?.toLocaleString() ?? '—'}
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Preview */}
                {s.content?.overview && (
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {s.content.overview}
                  </p>
                )}

                {/* Tech stack pills */}
                {s.content?.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.content.techStack.slice(0, 4).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">
                        {t}
                      </span>
                    ))}
                    {s.content.techStack.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-slate-600">+{s.content.techStack.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => navigate(`/results/${s.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 hover:border-violet-500/40 rounded-lg text-violet-300 hover:text-violet-200 text-sm font-medium transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Summary
                </button>

                {confirmDelete === s.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {deletingId === s.id ? <LoadingSpinner size="xs" /> : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-2 bg-white/5 rounded-lg text-slate-400 text-xs transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(s.id)}
                    className="flex items-center justify-center px-3 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
