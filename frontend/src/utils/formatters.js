import { format, parseISO, formatDistanceToNow } from 'date-fns'

export const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy HH:mm') } catch { return d }
}

export const fmtRelative = (d) => {
  if (!d) return '—'
  try { return formatDistanceToNow(parseISO(d), { addSuffix: true }) } catch { return d }
}

export const fmtPct = (v, decimals = 1) => {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(decimals)}%`
}

export const fmtPrice = (v, decimals = 2) => {
  if (v === null || v === undefined) return '—'
  return `$${Number(v).toFixed(decimals)}`
}

export const fmtNumber = (v, decimals = 2) => {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(decimals)
}

export const healthColor = (score) => {
  if (score >= 70) return '#00ff88'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export const healthLabel = (score) => {
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Moderate'
  if (score >= 30) return 'Weak'
  return 'Critical'
}

export const pnlColor = (pct) => {
  if (pct === null || pct === undefined) return '#8b949e'
  return pct >= 0 ? '#00ff88' : '#ef4444'
}

export const convictionColor = (score) => {
  if (score >= 8) return '#00ff88'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

export const evidenceColor = (rating) => {
  switch (rating) {
    case 'strong': return '#00ff88'
    case 'mixed': return '#f59e0b'
    case 'weak': return '#ef4444'
    default: return '#8b949e'
  }
}

export const regimeColor = (regime) => {
  const map = {
    risk_on: '#22c55e',
    risk_off: '#ef4444',
    stagflation: '#f59e0b',
    reflation: '#f97316',
    tightening: '#8b5cf6',
    easing: '#06b6d4',
    neutral: '#6b7280',
  }
  return map[regime] || '#6b7280'
}

export const compatBadge = (compat) => {
  switch (compat) {
    case 'favored': return { text: 'REGIME FAVORED', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' }
    case 'challenged': return { text: 'REGIME CHALLENGED', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    default: return { text: 'REGIME NEUTRAL', color: '#8b949e', bg: 'rgba(139,148,158,0.1)' }
  }
}

export const statusColor = (status) => {
  switch (status) {
    case 'active': return '#00ff88'
    case 'watching': return '#f59e0b'
    case 'closed': return '#8b949e'
    default: return '#8b949e'
  }
}

export const tagLabel = (tag) => {
  const map = {
    new_data: 'New Data',
    catalyst: 'Catalyst',
    changed_mind: 'Changed Mind',
    reaffirmed: 'Reaffirmed',
  }
  return map[tag] || tag
}

export const tagColor = (tag) => {
  const map = {
    new_data: '#3b82f6',
    catalyst: '#8b5cf6',
    changed_mind: '#ef4444',
    reaffirmed: '#00ff88',
  }
  return map[tag] || '#8b949e'
}

export const sentimentColor = (s) => {
  if (s === 'positive') return '#00ff88'
  if (s === 'negative') return '#ef4444'
  return '#8b949e'
}

export const expectedDirectionLabel = (dir) => {
  if (dir === 'up') return '↑'
  if (dir === 'down') return '↓'
  return '→'
}
