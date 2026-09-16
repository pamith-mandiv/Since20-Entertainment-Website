const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BASE_URL = `${API_ORIGIN.replace(/\/$/, '')}/api`;

// Base URL for media assets (images, audio) served by the backend
export const BASE_MEDIA_URL = API_ORIGIN.replace(/\/$/, '');


let token = sessionStorage.getItem('token') || null;

export const setAuthToken = (newToken) => {
  token = newToken;
  if (newToken) {
    sessionStorage.setItem('token', newToken);
  } else {
    sessionStorage.removeItem('token');
  }
};

export const getAuthToken = () => token;

export const logout = () => {
  setAuthToken(null);
  sessionStorage.removeItem('user');
  window.location.href = '/auth/login';
};

// Generic fetch wrapper
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = { ...options.headers };
  
  const activeToken = token || sessionStorage.getItem('token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body
  });

  const data = await response.json();

  if (!response.ok) {
    // Only clear token if explicitly confirmed as invalid or expired token
    const errMsg = (data && data.message ? data.message : '').toLowerCase();
    if (response.status === 401 && (errMsg.includes('expired') || errMsg.includes('invalid token'))) {
      setAuthToken(null);
      sessionStorage.removeItem('user');
    }
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

export const api = {
  // Auth
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  
  // Releases
  uploadRelease: (formData) => request('/releases/upload', {
    method: 'POST',
    body: formData
  }),
  updateRelease: (id, formData) => request(`/releases/update/${id}`, {
    method: 'PUT',
    body: formData
  }),
  getMyReleases: () => request('/releases/my', { method: 'GET' }),
  
  // Admin routes
  getAllArtists: () => request('/releases/artists/all', { method: 'GET' }),
  getAllReleases: () => request('/releases/all', { method: 'GET' }),
  approveRelease: (id) => request(`/releases/approve/${id}`, { method: 'PUT' }),
  distributeRelease: (id, spotifyLink, appleMusicLink, youtubeLink) => request(`/releases/distribute/${id}`, { 
    method: 'PUT',
    body: { spotify_link: spotifyLink, apple_music_link: appleMusicLink, youtube_link: youtubeLink }
  }),
  requestCorrection: (id, note) => request(`/releases/correction/${id}`, {
    method: 'PUT',
    body: { correction_note: note }
  }),
  rejectRelease: (id) => request(`/releases/reject/${id}`, { method: 'PUT' }),
  adminTogglePortfolio: (userId, active) => Promise.resolve({ success: true, active }),
  
  // Support Messages (Help Chat)
  submitSupportMessage: (message) => request('/support/message', { method: 'POST', body: { message } }),
  getAllSupportMessages: () => request('/support/all', { method: 'GET' }),
  getMySupportMessages: () => request('/support/my', { method: 'GET' }),
  replySupportMessage: (id, reply) => request(`/support/reply/${id}`, { method: 'PUT', body: { reply } }),
  
  // Portfolio
  getPublicPortfolio: (slug) => request(`/portfolio/${slug}`, { method: 'GET' }),
  getMyPortfolio: () => request('/portfolio/my/data', { method: 'GET' }),
  savePortfolioBasic: (data) => request('/portfolio/my/basic', { method: 'POST', body: data }),
  savePortfolioImages: (formData) => request('/portfolio/my/images', { method: 'POST', body: formData }),
  savePortfolioSocials: (links) => request('/portfolio/my/socials', { method: 'POST', body: { links } }),
  savePortfolioTheme: (theme_options) => request('/portfolio/my/theme', { method: 'POST', body: { theme_options } }),
  addPortfolioCatalogItem: (formData) => request('/portfolio/my/catalog', { method: 'POST', body: formData }),
  reorderPortfolioCatalog: (orderUpdates) => request('/portfolio/my/catalog/reorder', { method: 'PUT', body: { orderUpdates } }),
  deletePortfolioCatalogItem: (id) => request(`/portfolio/my/catalog/${id}`, { method: 'DELETE' }),
  setFeaturedReleases: (release_ids) => request('/portfolio/my/feature', { method: 'POST', body: { release_ids } }),
  removePortfolioImage: (type) => request('/portfolio/my/images/remove', { method: 'POST', body: { type } }),
  
  // Events
  getMyEvents: () => request('/portfolio/my/events', { method: 'GET' }),
  createEvent: (data) => request('/portfolio/my/events', { method: 'POST', body: data }),
  updateEvent: (id, data) => request(`/portfolio/my/events/${id}`, { method: 'PUT', body: data }),
  deleteEvent: (id) => request(`/portfolio/my/events/${id}`, { method: 'DELETE' }),
  
  // Stats
  getSpotifyStats: (trackId) => request(`/stats/spotify/${trackId}`, { method: 'GET' }),
  getAppleStats: (trackId) => request(`/stats/apple/${trackId}`, { method: 'GET' }),
  
  // Contact
  submitContactForm: (formData) => request('/contact', { method: 'POST', body: formData })
};
export default api;
