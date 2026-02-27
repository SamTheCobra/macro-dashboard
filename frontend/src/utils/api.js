import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Theses
export const getTheses = (status) =>
  api.get('/theses/', { params: status ? { status } : {} }).then(r => r.data)

export const getThesis = (id) =>
  api.get(`/theses/${id}`).then(r => r.data)

export const createThesis = (data) =>
  api.post('/theses/', data).then(r => r.data)

export const updateThesis = (id, data) =>
  api.put(`/theses/${id}`, data).then(r => r.data)

export const deleteThesis = (id) =>
  api.delete(`/theses/${id}`)

export const closeThesis = (id, retro) =>
  api.post(`/theses/${id}/close`, { retro }).then(r => r.data)

// Assumptions
export const addAssumption = (thesisId, data) =>
  api.post(`/theses/${thesisId}/assumptions`, data).then(r => r.data)

export const updateAssumption = (id, data) =>
  api.put(`/theses/assumptions/${id}`, data).then(r => r.data)

export const deleteAssumption = (id) =>
  api.delete(`/theses/assumptions/${id}`)

// Invalidation conditions
export const addInvalidation = (thesisId, data) =>
  api.post(`/theses/${thesisId}/invalidations`, data).then(r => r.data)

export const updateInvalidation = (id, data) =>
  api.put(`/theses/invalidations/${id}`, data).then(r => r.data)

export const deleteInvalidation = (id) =>
  api.delete(`/theses/invalidations/${id}`)

// Effects
export const addEffect = (thesisId, data) =>
  api.post(`/theses/${thesisId}/effects`, data).then(r => r.data)

export const deleteEffect = (id) =>
  api.delete(`/theses/effects/${id}`)

// Proxy indicators
export const addIndicator = (thesisId, data) =>
  api.post(`/theses/${thesisId}/indicators`, data).then(r => r.data)

export const deleteIndicator = (id) =>
  api.delete(`/theses/indicators/${id}`)

// Catalysts
export const addCatalyst = (thesisId, data) =>
  api.post(`/theses/${thesisId}/catalysts`, data).then(r => r.data)

export const updateCatalyst = (id, data) =>
  api.put(`/theses/catalysts/${id}`, data).then(r => r.data)

export const deleteCatalyst = (id) =>
  api.delete(`/theses/catalysts/${id}`)

// Bets
export const getBets = (thesisId) =>
  api.get(`/theses/${thesisId}/bets`).then(r => r.data)

export const createBet = (thesisId, data) =>
  api.post(`/theses/${thesisId}/bets`, data).then(r => r.data)

export const updateBet = (id, data) =>
  api.put(`/bets/${id}`, data).then(r => r.data)

export const deleteBet = (id) =>
  api.delete(`/bets/${id}`)

export const addScenario = (betId, data) =>
  api.post(`/bets/${betId}/scenarios`, data).then(r => r.data)

export const deleteScenario = (id) =>
  api.delete(`/scenarios/${id}`)

// Journal
export const getJournal = (thesisId) =>
  api.get(`/theses/${thesisId}/journal`).then(r => r.data)

export const addJournalEntry = (thesisId, data) =>
  api.post(`/theses/${thesisId}/journal`, data).then(r => r.data)

export const deleteJournalEntry = (thesisId, entryId) =>
  api.delete(`/theses/${thesisId}/journal/${entryId}`)

// Market data
export const getPriceHistory = (ticker, force = false) =>
  api.get(`/market-data/price/${ticker}`, { params: { force } }).then(r => r.data)

export const getFredHistory = (seriesId, force = false) =>
  api.get(`/market-data/fred/${seriesId}`, { params: { force } }).then(r => r.data)

export const triggerRefresh = () =>
  api.post('/market-data/refresh').then(r => r.data)

// Regime
export const getCurrentRegime = () =>
  api.get('/regime/current').then(r => r.data)

export const getAllRegimeCompat = () =>
  api.get('/regime/all-compat').then(r => r.data)

// News
export const getThesisNews = (thesisId) =>
  api.get(`/theses/${thesisId}/news`).then(r => r.data)

// Portfolio
export const getPortfolioOverview = () =>
  api.get('/portfolio/overview').then(r => r.data)

export const getPortfolioExposure = () =>
  api.get('/portfolio/exposure').then(r => r.data)

export const getCorrelation = () =>
  api.get('/portfolio/correlation').then(r => r.data)

export const getAllBets = () =>
  api.get('/portfolio/all-bets').then(r => r.data)

export default api
