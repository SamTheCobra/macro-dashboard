import { useEffect, useState } from 'react'
import { getThesisNews } from '../utils/api'
import { sentimentColor, fmtRelative } from '../utils/formatters'
import { ExternalLink, Newspaper } from 'lucide-react'

export default function NewsPanel({ thesisId }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getThesisNews(thesisId)
      .then(d => setArticles(d.articles || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [thesisId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card-sm animate-pulse">
            <div className="h-3 w-3/4 bg-terminal-muted rounded mb-2" />
            <div className="h-3 w-1/2 bg-terminal-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-terminal-dim text-sm p-4">{error}</div>
  }

  if (!articles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-terminal-dim">
        <Newspaper size={28} className="mb-3 opacity-30" />
        <div className="text-sm">No news found.</div>
        <div className="text-xs mt-1">Set NEWS_API_KEY in .env for better results.</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {articles.map((a, i) => {
        const sColor = sentimentColor(a.sentiment)
        return (
          <div
            key={i}
            className="card-sm hover:border-terminal-green/30 transition-colors"
            style={{ borderLeft: `2px solid ${sColor}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-terminal-text hover:text-terminal-green transition-colors line-clamp-2"
                >
                  {a.title}
                </a>
                {a.summary && (
                  <div className="text-xs text-terminal-dim mt-1 line-clamp-2">{a.summary}</div>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-terminal-dim">{a.source}</span>
                  <span className="text-xs text-terminal-dim">{fmtRelative(a.published)}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ color: sColor, backgroundColor: `${sColor}15` }}
                  >
                    {a.sentiment}
                  </span>
                </div>
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-dim hover:text-terminal-green shrink-0 mt-0.5"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
