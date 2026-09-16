import { useState, useEffect, useRef } from 'react';
import { api, BASE_MEDIA_URL } from '../api';
import PublicPortfolio from '../pages/PublicPortfolio';

const AVAILABLE_ROLES = [
  'Singer', 'Rapper', 'Music Producer', 'Songwriter', 'Composer', 
  'DJ', 'Instrumentalist', 'Mixing Engineer', 'Mastering Engineer', 
  'Beat Producer', 'Audio Engineer', 'Performer', 'Band',
  'Videographer', 'Video Director', 'Cinematographer', 'Director of Photography (DOP)',
  'Camera Operator', 'Film Director', 'Creative Director', 'Video Editor',
  'Colorist', 'Motion Graphics Designer', 'Drone Operator', 'Producer',
  'Assistant Director', 'Screenwriter', 'Lighting Technician', 'Sound Designer',
  'Photographer', 'Content Creator', 'Visual Artist'
];

const PLATFORMS = [
  'Spotify', 'Apple', 'YouTube', 'Instagram', 'Facebook', 'TikTok', 
  'SoundCloud', 'Audiomack', 'Boomplay', 'Deezer', 'Amazon', 'X'
];

const EVENT_TYPES = [
  { value: 'concert', label: 'Concert' },
  { value: 'live_show', label: 'Live Show' },
  { value: 'press_conference', label: 'Press Conference' },
  { value: 'media', label: 'Media Event' },
  { value: 'tour', label: 'Tour Date' },
];

export default function PortfolioEditor({ user = {} }) {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState({
    display_name: user?.artist_name || user?.name || '',
    slug: user?.artist_name ? user.artist_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
    bio: '',
    location: '',
    email: user.email,
    website: '',
    roles: [],
    theme_options: { type: 'dark', accent: '#FFD400', cornerStyle: 'rounded', featured_releases: [] },
    social_links: PLATFORMS.map(p => ({ platform: p, url: '', enabled: false })),
    profile_picture: null,
    cover_picture: null,
  });
  const [catalog, setCatalog] = useState([]);
  const [events, setEvents] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');

  // Catalog form
  const [catTitle, setCatTitle] = useState('');
  const [catArtist, setCatArtist] = useState('');
  const [catDate, setCatDate] = useState('');
  const [catFile, setCatFile] = useState(null);
  const [catSpotify, setCatSpotify] = useState('');
  const [catApple, setCatApple] = useState('');
  const [catYoutube, setCatYoutube] = useState('');
  const [catOther, setCatOther] = useState('');

  // Events form
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState('concert');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evVenue, setEvVenue] = useState('');
  const [evCity, setEvCity] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evTicket, setEvTicket] = useState('');
  const [evPosterFile, setEvPosterFile] = useState(null);
  const [evPosterPreview, setEvPosterPreview] = useState(null);
  const [evPosterRemoved, setEvPosterRemoved] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  
  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const res = await api.getMyPortfolio();
      
      if (res.portfolio) {
        let socials = res.portfolio.social_links || [];
        PLATFORMS.forEach(p => {
          if (!socials.find(s => s.platform === p)) {
            socials.push({ platform: p, url: '', enabled: false });
          }
        });
        
        setPortfolio({
          ...res.portfolio,
          social_links: socials,
          theme_options: res.portfolio.theme_options || { type: 'dark', accent: '#FFD400', cornerStyle: 'rounded', featured_releases: [] }
        });
      }
      setCatalog(res.catalog || []);
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSaveMsg = (msg) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/artist/${portfolio.slug}`;
    navigator.clipboard.writeText(link);
    showSaveMsg('Profile link copied to clipboard!');
  };

  const handleSaveBasic = async (e) => {
    e.preventDefault();
    try {
      await api.savePortfolioBasic({
        display_name: portfolio.display_name,
        slug: portfolio.slug,
        roles: portfolio.roles,
        bio: portfolio.bio,
        location: portfolio.location,
        email: portfolio.email,
        website: portfolio.website
      });
      showSaveMsg('Profile saved successfully!');
    } catch (err) {
      showSaveMsg(err.message || 'Failed to save profile');
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append(type, file);
    try {
      const res = await api.savePortfolioImages(formData);
      setPortfolio(prev => ({
        ...prev,
        profile_picture: res.profile_picture || prev.profile_picture,
        cover_picture: res.cover_picture || prev.cover_picture
      }));
      showSaveMsg(`${type === 'profile_picture' ? 'Profile picture' : 'Cover photo'} updated`);
    } catch (err) {
      showSaveMsg(err.message || 'Error uploading image');
    }
  };

  const handleRemoveImage = async (type) => {
    const friendlyName = type === 'profile_picture' ? 'profile picture' : 'cover photo';
    if (!window.confirm(`Are you sure you want to remove your ${friendlyName}?`)) return;
    try {
      await api.removePortfolioImage(type);
      setPortfolio(prev => ({
        ...prev,
        [type]: null
      }));
      showSaveMsg(`${friendlyName === 'profile picture' ? 'Profile picture' : 'Cover photo'} removed successfully`);
    } catch (err) {
      showSaveMsg(err.message || 'Error removing image');
    }
  };

  const toggleRole = (role) => {
    setPortfolio(prev => {
      const has = prev.roles.includes(role);
      const newRoles = has ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles: newRoles };
    });
  };

  const handleSaveSocials = async () => {
    try {
      await api.savePortfolioSocials(portfolio.social_links);
      showSaveMsg('Social links saved');
    } catch (err) {
      showSaveMsg('Failed to save socials');
    }
  };

  const updateSocial = (index, field, value) => {
    const newLinks = [...portfolio.social_links];
    newLinks[index][field] = value;
    setPortfolio({ ...portfolio, social_links: newLinks });
  };

  const handleSaveTheme = async (newTheme) => {
    const theme = { ...portfolio.theme_options, ...newTheme };
    setPortfolio({ ...portfolio, theme_options: theme });
    try {
      await api.savePortfolioTheme(theme);
    } catch (err) {}
  };

  const handleAddCatalog = async (e) => {
    e.preventDefault();
    if (!catFile) return showSaveMsg('Album art is required');
    
    const streamingLinks = JSON.stringify({
      spotify: catSpotify,
      apple: catApple,
      youtube: catYoutube,
      other: catOther,
    });

    const formData = new FormData();
    formData.append('song_title', catTitle);
    formData.append('artist_name', catArtist);
    formData.append('release_date', catDate);
    formData.append('album_art', catFile);
    formData.append('streaming_links', streamingLinks);
    
    try {
      await api.addPortfolioCatalogItem(formData);
      setCatTitle(''); setCatArtist(''); setCatDate(''); setCatFile(null);
      setCatSpotify(''); setCatApple(''); setCatYoutube(''); setCatOther('');
      fetchMyData();
      showSaveMsg('Catalog item added');
    } catch (err) {
      showSaveMsg(err.message || 'Failed to add item');
    }
  };

  const handleDeleteCatalog = async (id) => {
    if (!window.confirm('Delete this release?')) return;
    try {
      await api.deletePortfolioCatalogItem(id);
      fetchMyData();
    } catch (err) {}
  };

  // Featured Releases Pin/Unpin/Reorder
  const handlePinRelease = async (id) => {
    const pinned = portfolio.theme_options?.featured_releases || [];
    if (pinned.includes(id)) return;
    if (pinned.length >= 3) {
      alert("You can pin up to 3 releases. Please unpin one first.");
      return;
    }
    const newPinned = [...pinned, id];
    await handleSaveTheme({ featured_releases: newPinned });
    await api.setFeaturedReleases(newPinned);
    setPortfolio(prev => ({
      ...prev,
      theme_options: { ...prev.theme_options, featured_releases: newPinned }
    }));
    showSaveMsg('Release pinned');
  };

  const handleUnpinRelease = async (id) => {
    const pinned = portfolio.theme_options?.featured_releases || [];
    const newPinned = pinned.filter(pId => pId !== id);
    await handleSaveTheme({ featured_releases: newPinned });
    await api.setFeaturedReleases(newPinned);
    setPortfolio(prev => ({
      ...prev,
      theme_options: { ...prev.theme_options, featured_releases: newPinned }
    }));
    showSaveMsg('Release unpinned');
  };

  const handleMovePinned = async (index, direction) => {
    const pinned = [...(portfolio.theme_options?.featured_releases || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pinned.length) return;
    
    const temp = pinned[index];
    pinned[index] = pinned[newIndex];
    pinned[newIndex] = temp;
    
    await handleSaveTheme({ featured_releases: pinned });
    await api.setFeaturedReleases(pinned);
    setPortfolio(prev => ({
      ...prev,
      theme_options: { ...prev.theme_options, featured_releases: pinned }
    }));
  };

  // Events handlers
  const resetEventForm = () => {
    setEvTitle(''); setEvType('concert'); setEvDate('');
    setEvTime(''); setEvVenue(''); setEvCity('');
    setEvDesc(''); setEvTicket(''); setEvPosterFile(null);
    setEvPosterPreview(null); setEvPosterRemoved(false);
    setEditingEventId(null);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', evTitle);
    formData.append('event_type', evType);
    formData.append('event_date', evDate);
    formData.append('event_time', evTime);
    formData.append('venue', evVenue);
    formData.append('city', evCity);
    formData.append('description', evDesc);
    formData.append('ticket_link', evTicket);
    
    if (evPosterFile) {
      formData.append('poster_image', evPosterFile);
    } else if (evPosterRemoved) {
      formData.append('remove_poster', 'true');
    }
    
    try {
      if (editingEventId) {
        await api.updateEvent(editingEventId, formData);
        showSaveMsg('Event updated');
      } else {
        await api.createEvent(formData);
        showSaveMsg('Event created');
      }
      resetEventForm();
      fetchMyData();
    } catch (err) {
      showSaveMsg(err.message || 'Failed to save event');
    }
  };

  const handleEditEvent = (ev) => {
    setEvTitle(ev.title);
    setEvType(ev.event_type);
    setEvDate(ev.event_date ? ev.event_date.split('T')[0] : '');
    setEvTime(ev.event_time || '');
    setEvVenue(ev.venue || '');
    setEvCity(ev.city || '');
    setEvDesc(ev.description || '');
    setEvTicket(ev.ticket_link || '');
    setEvPosterFile(null);
    setEvPosterPreview(ev.poster_image ? `${BASE_MEDIA_URL}${ev.poster_image}` : null);
    setEvPosterRemoved(false);
    setEditingEventId(ev.id);
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.deleteEvent(id);
      fetchMyData();
    } catch (err) {}
  };

  if (loading) return <div style={{ color: 'var(--gray)', padding: '40px', textAlign: 'center' }}>Loading My Portfolio...</div>;

  const previewData = { portfolio, catalog, events };

  const TABS = ['profile', 'images', 'appearance', 'socials', 'catalog', 'events'];

  const featuredIds = portfolio.theme_options?.featured_releases || [];
  const featuredReleases = featuredIds.map(fId => catalog.find(c => c.id === fId)).filter(Boolean);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
      
      {/* LEFT COL: Editor Form */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Sub Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                flex: '1 1 auto', padding: '12px 8px', border: 'none', background: 'none',
                color: activeSubTab === tab ? 'var(--yellow)' : 'var(--gray)',
                borderBottom: activeSubTab === tab ? '2px solid var(--yellow)' : '2px solid transparent',
                cursor: 'pointer', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          
          {saveStatus && (
            <div style={{ background: 'rgba(255, 212, 0, 0.1)', color: 'var(--yellow)', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '12px', textAlign: 'center' }}>
              {saveStatus}
            </div>
          )}

          {/* Share Profile Link Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,212,0,0.06)', border: '1px solid rgba(255,212,0,0.2)', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ overflow: 'hidden', marginRight: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Public Profile Link</div>
              <div style={{ fontSize: '12px', color: 'var(--white)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {`${window.location.origin}/artist/${portfolio.slug}`}
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '11px', borderRadius: '4px' }} onClick={copyProfileLink}>
              <i className="fa-solid fa-copy"></i> Copy Link
            </button>
          </div>

          {/* ── PROFILE TAB ── */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSaveBasic}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="field-label">Display Name *</label>
                  <input type="text" className="field" required value={portfolio.display_name} onChange={e => setPortfolio({...portfolio, display_name: e.target.value})} />
                </div>
                <div>
                  <label className="field-label">URL Slug * (since20.com/artist/...)</label>
                  <input type="text" className="field" required value={portfolio.slug} onChange={e => setPortfolio({...portfolio, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="field-label">Artist Roles (Select multiple)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  {AVAILABLE_ROLES.map(role => (
                    <div key={role} onClick={() => toggleRole(role)}
                      style={{ padding: '6px 12px', fontSize: '10px', borderRadius: '20px', cursor: 'pointer',
                        background: portfolio.roles.includes(role) ? 'var(--yellow)' : 'rgba(255,255,255,0.05)',
                        color: portfolio.roles.includes(role) ? '#000' : 'var(--gray)' }}>
                      {role}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="field-label">Bio / About Me</label>
                <textarea className="field" rows="4" value={portfolio.bio} onChange={e => setPortfolio({...portfolio, bio: e.target.value})}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="field-label">Location</label>
                  <input type="text" className="field" value={portfolio.location} onChange={e => setPortfolio({...portfolio, location: e.target.value})} />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input type="email" className="field" value={portfolio.email} onChange={e => setPortfolio({...portfolio, email: e.target.value})} />
                </div>
                <div>
                  <label className="field-label">Website</label>
                  <input type="text" className="field" value={portfolio.website} onChange={e => setPortfolio({...portfolio, website: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Save Profile</button>
            </form>
          )}

          {/* ── IMAGES TAB (Proper Image Management) ── */}
          {activeSubTab === 'images' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Profile picture management */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Profile Photo</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '80px', height: '80px', borderRadius: '50%', background: '#222', 
                      backgroundImage: portfolio.profile_picture ? `url(${BASE_MEDIA_URL}${portfolio.profile_picture})` : 'none', 
                      backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                    }}>
                      {!portfolio.profile_picture && <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '24px' }}><i className="fa-solid fa-user"></i></div>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <label className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                        <i className="fa-solid fa-upload"></i> {portfolio.profile_picture ? 'Replace' : 'Upload'}
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(e, 'profile_picture')} />
                      </label>
                      {portfolio.profile_picture && (
                        <button className="btn" style={{ padding: '8px 16px', fontSize: '12px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#ff6b6b' }} onClick={() => handleRemoveImage('profile_picture')}>
                          <i className="fa-solid fa-trash-can"></i> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover photo management */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Cover Photo (Background Design)</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '120px', height: '70px', borderRadius: '6px', background: '#222', 
                      backgroundImage: portfolio.cover_picture ? `url(${BASE_MEDIA_URL}${portfolio.cover_picture})` : 'none', 
                      backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                    }}>
                      {!portfolio.cover_picture && <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Gradient</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <label className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                        <i className="fa-solid fa-upload"></i> {portfolio.cover_picture ? 'Replace' : 'Upload'}
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_picture')} />
                      </label>
                      {portfolio.cover_picture && (
                        <button className="btn" style={{ padding: '8px 16px', fontSize: '12px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#ff6b6b' }} onClick={() => handleRemoveImage('cover_picture')}>
                          <i className="fa-solid fa-trash-can"></i> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE TAB ── */}
          {activeSubTab === 'appearance' && (
            <div>
              <label className="field-label">Theme Mode</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['dark', 'light', 'midnight'].map(t => (
                  <button key={t} onClick={() => handleSaveTheme({ type: t })}
                    className={portfolio.theme_options?.type === t ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>

              <label className="field-label">Accent Color</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['#FFD400', '#1DB954', '#FC3C44', '#0070f3', '#ff0080', '#00f2fe'].map(c => (
                  <div key={c} onClick={() => handleSaveTheme({ accent: c })}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: c, cursor: 'pointer',
                      border: portfolio.theme_options?.accent === c ? '3px solid #fff' : 'none' }}>
                  </div>
                ))}
              </div>

              <label className="field-label">Card Style</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['rounded', 'sharp', 'pill'].map(t => (
                  <button key={t} onClick={() => handleSaveTheme({ cornerStyle: t })}
                    className={portfolio.theme_options?.cornerStyle === t ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SOCIALS TAB ── */}
          {activeSubTab === 'socials' && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '16px' }}>Only enabled platforms with URLs will be shown on your profile.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {portfolio.social_links.map((link, i) => (
                  <div key={link.platform} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                    <input type="checkbox" checked={link.enabled} onChange={e => updateSocial(i, 'enabled', e.target.checked)} />
                    <div style={{ width: '100px', fontSize: '13px' }}><i className={`fa-brands fa-${link.platform.toLowerCase()}`} style={{width: '20px'}}></i> {link.platform}</div>
                    <input type="url" className="field" style={{ marginBottom: 0, flex: 1, padding: '8px' }}
                      placeholder={`${link.platform} URL`} value={link.url}
                      onChange={e => updateSocial(i, 'url', e.target.value)} />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveSocials} className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>Save Social Links</button>
            </div>
          )}

          {/* ── CATALOG TAB ── */}
          {activeSubTab === 'catalog' && (
            <div>
              {/* Featured Releases pinning dashboard */}
              <div style={{ background: 'rgba(255, 212, 0, 0.03)', border: '1px solid rgba(255, 212, 0, 0.15)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Featured Releases (Max 3)</h4>
                {featuredReleases.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--gray)', padding: '10px 0' }}>No pinned releases yet. Use the "Pin" button below on any catalog item.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {featuredReleases.map((c, idx) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                        <img src={`${BASE_MEDIA_URL}${c.album_art}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.song_title}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '3px' }} disabled={idx === 0} onClick={() => handleMovePinned(idx, -1)}>
                            <i className="fa-solid fa-arrow-up"></i>
                          </button>
                          <button type="button" className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '3px' }} disabled={idx === featuredReleases.length - 1} onClick={() => handleMovePinned(idx, 1)}>
                            <i className="fa-solid fa-arrow-down"></i>
                          </button>
                          <button type="button" className="btn" style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '3px', background: 'rgba(231,76,60,0.1)', color: '#ff6b6b', border: '1px solid rgba(231,76,60,0.3)' }} onClick={() => handleUnpinRelease(c.id)}>
                            Unpin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddCatalog} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Catalog Release</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" className="field" placeholder="Song Title *" required value={catTitle} onChange={e => setCatTitle(e.target.value)} style={{ marginBottom: '0' }} />
                  <input type="text" className="field" placeholder="Artist Name *" required value={catArtist} onChange={e => setCatArtist(e.target.value)} style={{ marginBottom: '0' }} />
                  <input type="date" className="field" required value={catDate} onChange={e => setCatDate(e.target.value)} style={{ marginBottom: '0' }} />
                  <input type="file" className="field" accept="image/*" onChange={e => setCatFile(e.target.files[0])} style={{ padding: '7px', marginBottom: '0' }} />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label className="field-label" style={{ fontSize: '11px' }}>Streaming Links</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="url" className="field" placeholder="Spotify URL" value={catSpotify} onChange={e => setCatSpotify(e.target.value)} style={{ marginBottom: '0', fontSize: '12px' }} />
                    <input type="url" className="field" placeholder="Apple Music URL" value={catApple} onChange={e => setCatApple(e.target.value)} style={{ marginBottom: '0', fontSize: '12px' }} />
                    <input type="url" className="field" placeholder="YouTube URL" value={catYoutube} onChange={e => setCatYoutube(e.target.value)} style={{ marginBottom: '0', fontSize: '12px' }} />
                    <input type="url" className="field" placeholder="Other Link" value={catOther} onChange={e => setCatOther(e.target.value)} style={{ marginBottom: '0', fontSize: '12px' }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-outline" style={{ width: '100%', fontSize: '12px', marginTop: '12px' }}>Upload Release</button>
              </form>

              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Catalog</h4>
              {catalog.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--gray)' }}>No catalog releases added yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {catalog.map(c => {
                    const isPinned = featuredIds.includes(c.id);
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                        <img src={`${BASE_MEDIA_URL}${c.album_art}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {c.song_title}
                            {isPinned && <span style={{ color: 'var(--yellow)', fontSize: '10px', marginLeft: '6px', verticalAlign: 'middle' }}><i className="fa-solid fa-thumbtack"></i> Featured</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gray)' }}>{c.artist_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isPinned && featuredIds.length < 3 && (
                            <button onClick={() => handlePinRelease(c.id)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px', margin: 0 }}>Pin</button>
                          )}
                          <button onClick={() => handleDeleteCatalog(c.id)} className="btn" style={{ background: 'none', border: '1px solid #ff4444', fontSize: '11px', padding: '4px 10px', color: '#ff4444', margin: 0 }}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── EVENTS TAB ── */}
          {activeSubTab === 'events' && (
            <div>
              <form onSubmit={handleSaveEvent} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{editingEventId ? 'Edit Event' : 'Add Event'}</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <input type="text" className="field" placeholder="Event Title *" required value={evTitle} onChange={e => setEvTitle(e.target.value)} style={{ marginBottom: '0' }} />
                  </div>
                  <select className="field" value={evType} onChange={e => setEvType(e.target.value)} style={{ marginBottom: '0' }}>
                    {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
                  </select>
                  <input type="date" className="field" required value={evDate} onChange={e => setEvDate(e.target.value)} style={{ marginBottom: '0' }} />
                  
                  <div>
                    <input type="text" className="field" placeholder="Time (e.g. 7:00 PM)" value={evTime} onChange={e => setEvTime(e.target.value)} style={{ marginBottom: '0' }} />
                  </div>
                  <div>
                    <input type="text" className="field" placeholder="Venue (e.g. Viharamahadevi Park)" value={evVenue} onChange={e => setEvVenue(e.target.value)} style={{ marginBottom: '0' }} />
                  </div>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <input type="text" className="field" placeholder="City (e.g. Colombo)" value={evCity} onChange={e => setEvCity(e.target.value)} style={{ marginBottom: '0' }} />
                  </div>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <textarea className="field" placeholder="Description (optional)" rows="2" value={evDesc} onChange={e => setEvDesc(e.target.value)} style={{ marginBottom: '0', resize: 'vertical' }}></textarea>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <input type="url" className="field" placeholder="Ticket / Event Link (optional)" value={evTicket} onChange={e => setEvTicket(e.target.value)} style={{ marginBottom: '0' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                    <label className="field-label" style={{ fontSize: '11px' }}>Event Poster Image</label>
                    {evPosterPreview && (
                      <div style={{ position: 'relative', width: '100px', height: '140px', background: '#222', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                        <img src={evPosterPreview} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ff6b6b', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => { setEvPosterPreview(null); setEvPosterRemoved(true); setEvPosterFile(null); }}>
                          <i className="fa-solid fa-xmark" style={{ fontSize: '10px' }}></i>
                        </button>
                      </div>
                    )}
                    <input type="file" className="field" accept="image/*" onChange={e => { setEvPosterFile(e.target.files[0]); setEvPosterPreview(URL.createObjectURL(e.target.files[0])); setEvPosterRemoved(false); }} style={{ padding: '7px', marginBottom: '0' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '12px' }}>{editingEventId ? 'Update Event' : 'Add Event'}</button>
                  {editingEventId && <button type="button" className="btn btn-outline" style={{ fontSize: '12px' }} onClick={resetEventForm}>Cancel</button>}
                </div>
              </form>

              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Events ({events.length})</h4>
              {events.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--gray)' }}>No events added yet. Add concerts, shows, tour dates and more.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {events.map(ev => {
                    const typeInfo = EVENT_TYPES.find(t => t.value === ev.event_type) || { label: ev.event_type };
                    return (
                      <div key={ev.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          {ev.poster_image && (
                            <img src={`${BASE_MEDIA_URL}${ev.poster_image}`} alt="" style={{ width: '45px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{ev.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>{typeInfo.label} · {new Date(ev.event_date).toLocaleDateString()}</div>
                            {(ev.venue || ev.city) && (
                              <div style={{ fontSize: '11px', color: 'var(--gray2)', marginTop: '2px' }}>
                                <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i>
                                {[ev.venue, ev.city].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditEvent(ev)} className="btn" style={{ background: 'none', border: '1px solid var(--border)', fontSize: '10px', padding: '3px 7px', color: 'var(--white)', margin: 0 }}>Edit</button>
                            <button onClick={() => handleDeleteEvent(ev.id)} className="btn" style={{ background: 'none', border: '1px solid #ff4444', fontSize: '10px', padding: '3px 7px', color: '#ff4444', margin: 0 }}>Del</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COL: Live Preview */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Live Preview</h3>
          {(() => {
            const liveSlug = portfolio.slug || (user?.artist_name || user?.name || 'artist').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <a href={`/artist/${liveSlug}`} target="_blank" rel="noreferrer" className="accent" style={{ fontSize: '12px', textDecoration: 'none' }}>
                Open Live Page <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            );
          })()}
        </div>
        
        <div style={{ 
          width: '100%', maxWidth: '380px', height: '700px', margin: '0 auto',
          border: '8px solid #222', borderRadius: '32px', overflow: 'hidden',
          position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', background: '#000'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '24px', background: '#222', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 10 }}></div>
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
            <PublicPortfolio previewData={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}
