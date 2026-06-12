import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { generateSummary } from '../api/client'
import { Github, Sparkles, Zap, Star, GitFork, ArrowRight, Lock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const EXAMPLES = [
  'https://github.com/facebook/react',
  'https://github.com/vercel/next.js',
  'https://github.com/tailwindlabs/tailwindcss',
  'https://github.com/microsoft/vscode',
]

const FEATURES = [
  { icon: <Zap className="w-5 h-5 text-cyan-400" />, title: 'Instant Analysis', desc: 'Get comprehensive AI summaries in seconds using Groq.' },
  { icon: <Star className="w-5 h-5 text-violet-400" />, title: 'Smart Caching', desc: 'Summaries are cached — revisit repos without repeated API calls.' },
  { icon: <GitFork className="w-5 h-5 text-indigo-400" />, title: 'Rich Metadata', desc: 'Stars, forks, language, last updated — all pulled from GitHub automatically.' },
]

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [analysisMode, setAnalysisMode] = useState('general')
  const [userPrompt, setUserPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    if (!user) {
      navigate('/login', { state: { returnUrl: '/', repoUrl: url } })
      return
    }
    setLoading(true)
    setError('')
    try {
      const summary = await generateSummary(url.trim(), {
        analysisMode,
        userPrompt: userPrompt.trim(),
      })
      navigate(`/results/${summary.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-cyan-600/5 blur-[80px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Badge */}
        <div className="animate-fadeIn inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Groq
        </div>

        {/* Headline */}
        <h1 className="animate-fadeIn text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6 max-w-4xl">
          Understand any{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            GitHub repo
          </span>
          {' '}instantly
        </h1>

        <p className="animate-fadeIn text-lg text-slate-400 max-w-xl mb-12 leading-relaxed">
          Paste any GitHub URL and get an AI-generated summary — overview, tech stack,
          features, use cases, and more. All in one click.
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="animate-fadeIn w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="github-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={loading}
                className="input-field pl-12 py-4 text-base"
              />
            </div>
            <button
              id="summarize-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary py-4 px-8 text-base whitespace-nowrap"
            >
              {loading ? (
                <><LoadingSpinner size="sm" /> Analyzing…</>
              ) : user ? (
                <><Sparkles className="w-5 h-5" /> Summarize</>
              ) : (
                <><Lock className="w-4 h-4" /> Sign in to summarize</>
              )}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Analysis mode</label>
              <select
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value)}
                disabled={loading}
                className="input-field py-2.5 text-sm"
              >
                <option value="general">General summary</option>
                <option value="codebase">Codebase structure analysis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Custom prompt (optional)</label>
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="e.g. focus on architecture and module boundaries"
                disabled={loading}
                className="input-field py-2.5 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left">
              {error}
            </div>
          )}
        </form>

        {/* Examples */}
        <div className="animate-fadeIn mt-6">
          <p className="text-xs text-slate-600 mb-2">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((repo) => (
              <button
                key={repo}
                onClick={() => setUrl(repo)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 transition-all"
              >
                {repo.replace('https://github.com/', '')}
              </button>
            ))}
          </div>
        </div>

        {!user && (
          <p className="animate-fadeIn mt-8 text-sm text-slate-500">
            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Create a free account</Link>
            {' '}to start summarizing repositories.
          </p>
        )}
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto w-full px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 hover:border-white/20 transition-all group">
              <div className="mb-4 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
