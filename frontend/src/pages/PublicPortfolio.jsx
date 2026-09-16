import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, BASE_MEDIA_URL } from '../api';

const PLATFORM_META = {
  spotify: { icon: 'fa-brands fa-spotify', bg: '#1DB954', label: 'Spotify' },
  apple: { icon: 'fa-brands fa-apple', bg: '#FC3C44', label: 'Apple Music' },
  youtube: { icon: 'fa-brands fa-youtube', bg: '#FF0000', label: 'YouTube' },
  soundcloud: { icon: 'fa-brands fa-soundcloud', bg: '#FF5500', label: 'SoundCloud' },
  other: { icon: 'fa-solid fa-link', bg: '#555', label: 'Listen' },
};

export default function PublicPortfolio({ previewData }) {
  const { slug } = useParams();
  const [data, setData] = useState(previewData || null);
  const [loading, setLoading] = useState(!previewData);
  const [error, setError] = useState('');
  const [listenPopup, setListenPopup] = useState(null);

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      setLoading(false);
      setError('');
      return;
    }
    if (slug) {
      fetchPortfolio(slug);
    } else {
      setLoading(false);
      setError('No portfolio specified.');
    }
  }, [slug, previewData]);

  const fetchPortfolio = async (artistSlug) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getPublicPortfolio(artistSlug);
      setData(res);
    } catch (err) {
      setError(err.message || 'Portfolio not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#FFD400' }}>
      <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
    </div>
  );
  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#ff6b6b', flexDirection: 'column', gap: '16px', padding: '20px', textAlign: 'center' }}>
      <i className="fa-solid fa-circle-exclamation fa-2x"></i>
      <p style={{ fontSize: '18px', fontWeight: '600' }}>{error}</p>
      <a href="/dashboard" style={{ color: '#FFD400', fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,212,0,0.3)', padding: '8px 16px', borderRadius: '8px' }}>Go to Dashboard &rarr;</a>
    </div>
  );
  if (!data || !data.portfolio) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#888', flexDirection: 'column', gap: '16px' }}>
      <p>Portfolio not configured yet.</p>
      <a href="/dashboard" style={{ color: '#FFD400', fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,212,0,0.3)', padding: '8px 16px', borderRadius: '8px' }}>Go to Dashboard &rarr;</a>
    </div>
  );

  const portfolio = data.portfolio || {};

  // Safe parsing of theme_options
  const rawTheme = typeof portfolio.theme_options === 'string'
    ? (() => { try { return JSON.parse(portfolio.theme_options); } catch { return {}; } })()
    : (portfolio.theme_options || {});
  const theme = {
    type: rawTheme.type || 'dark',
    accent: rawTheme.accent || '#FFD400',
    cornerStyle: rawTheme.cornerStyle || 'rounded',
    featured_releases: Array.isArray(rawTheme.featured_releases) ? rawTheme.featured_releases : []
  };

  // Safe parsing of social_links
  const rawLinks = typeof portfolio.social_links === 'string'
    ? (() => { try { return JSON.parse(portfolio.social_links); } catch { return []; } })()
    : (portfolio.social_links || []);
  const links = Array.isArray(rawLinks) ? rawLinks : [];

  // Safe parsing of roles
  const rawRoles = typeof portfolio.roles === 'string'
    ? (() => { try { return JSON.parse(portfolio.roles); } catch { return []; } })()
    : (portfolio.roles || []);
  const roles = Array.isArray(rawRoles) ? rawRoles : [];

  const catalog = Array.isArray(data.catalog) ? data.catalog : [];
  const events = Array.isArray(data.events) ? data.events : [];

  // Featured Releases matching
  const featuredIds = theme.featured_releases || [];
  const featuredReleases = featuredIds.map(fId => catalog.find(c => c.id === fId)).filter(Boolean);
  const remainingCatalog = catalog.filter(c => !featuredIds.includes(c.id));

  const bgColors = { dark: '#0a0a0a', light: '#f5f5f5', midnight: '#0c1021' };
  const textColors = { dark: '#ffffff', light: '#111111', midnight: '#e0e6ed' };
  const cardBg = { dark: 'rgba(255,255,255,0.05)', light: 'rgba(0,0,0,0.05)', midnight: 'rgba(255,255,255,0.03)' };
  const borderColor = { dark: 'rgba(255,255,255,0.08)', light: 'rgba(0,0,0,0.1)', midnight: 'rgba(255,255,255,0.06)' };

  const bg = bgColors[theme.type] || bgColors.dark;
  const fg = textColors[theme.type] || textColors.dark;
  const card = cardBg[theme.type] || cardBg.dark;
  const border = borderColor[theme.type] || borderColor.dark;
  const br = theme.cornerStyle === 'sharp' ? '0px' : theme.cornerStyle === 'pill' ? '24px' : '10px';
  const accent = theme.accent || '#FFD400';

  const containerStyle = {
    minHeight: '100vh', backgroundColor: bg, color: fg,
    fontFamily: "'Syne', 'Inter', sans-serif", paddingBottom: '80px',
  };

  return (
    <div style={containerStyle}>
      {/* ── Cover Banner (Increased height by 25%) ── */}
      <div style={{
        height: '275px', width: '100%', position: 'relative',
        backgroundImage: portfolio.cover_picture ? `url(${BASE_MEDIA_URL}${portfolio.cover_picture})` : `linear-gradient(135deg, #111 0%, #1a1a1a 50%, #111 100%)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: `linear-gradient(to top, ${bg}, transparent)` }} />
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px', position: 'relative', marginTop: '-56px' }}>

        {/* ── Profile Header ── */}
        <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%', margin: '0 auto',
            border: `4px solid ${bg}`,
            backgroundImage: portfolio.profile_picture ? `url(${BASE_MEDIA_URL}${portfolio.profile_picture})` : 'none',
            backgroundColor: '#2a2a2a', backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', color: '#fff', fontWeight: 'bold',
            boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 2px ${accent}22`
          }}>
            {!portfolio.profile_picture && (portfolio.display_name ? portfolio.display_name[0] : 'A')}
          </div>

          <h1 style={{ marginTop: '14px', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>{portfolio.display_name}</h1>

          {roles && roles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
              {roles.map(r => (
                <span key={r} style={{ fontSize: '10px', padding: '3px 10px', background: card, borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid ${border}` }}>
                  {r}
                </span>
              ))}
            </div>
          )}

          {portfolio.location && (
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
              <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i>{portfolio.location}
            </div>
          )}

          {portfolio.bio && (
            <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.75, lineHeight: '1.7', whiteSpace: 'pre-line', textAlign: 'center' }}>
              {portfolio.bio}
            </p>
          )}

          {/* ── Social Links (Monochrome Icons with Consistent Spacing & Sizing) ── */}
          {links.filter(l => l.enabled && l.url).length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              {links.filter(l => l.enabled && l.url).map(l => (
                <a key={l.platform} href={l.url} target="_blank" rel="noreferrer noopener"
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: card, color: fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '17px', transition: 'all 0.2s ease', textDecoration: 'none',
                    border: `1px solid ${border}`,
                    filter: 'grayscale(1) brightness(1.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = accent;
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = card;
                    e.currentTarget.style.color = fg;
                    e.currentTarget.style.filter = 'grayscale(1) brightness(1.2)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  }}>
                  <i className={`fa-brands fa-${l.platform.toLowerCase() === 'x' ? 'x-twitter' : l.platform.toLowerCase()}`}></i>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Featured Releases (Up to 3 releases pinned at the top) ── */}
        {featuredReleases.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ height: '1px', flex: 1, background: border }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5 }}>Featured Releases</span>
              <div style={{ height: '1px', flex: 1, background: border }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {featuredReleases.map(release => (
                <div
                  key={release.id}
                  style={{
                    background: card, borderRadius: br, overflow: 'hidden', cursor: 'pointer',
                    border: `1px solid ${border}`, transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex', alignItems: 'center', padding: '12px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.3)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onClick={() => setListenPopup(release)}>
                  <img src={`${BASE_MEDIA_URL}${release.album_art}`} alt={release.song_title}
                    style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ padding: '0 16px', flex: 1 }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{release.song_title}</h2>
                    <p style={{ opacity: 0.6, fontSize: '12px' }}>{release.artist_name}</p>
                  </div>
                  <div style={{ padding: '6px 14px', background: accent, color: '#000', borderRadius: '20px', fontWeight: '700', fontSize: '11px' }}>
                    <i className="fa-solid fa-play" style={{ marginRight: '6px' }}></i>Listen
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Music Catalogue (Remaining releases) ── */}
        {remainingCatalog.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ height: '1px', flex: 1, background: border }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5 }}>Music Catalogue</span>
              <div style={{ height: '1px', flex: 1, background: border }} />
            </div>

            {/* Compact Spotify-style grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {remainingCatalog.map(c => (
                <div key={c.id}
                  style={{ background: card, borderRadius: br, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${border}`, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,255,255,0.1)`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = card; e.currentTarget.style.transform = 'translateY(0)'; }}
                  onClick={() => setListenPopup(c)}>
                  <img src={`${BASE_MEDIA_URL}${c.album_art}`} alt={c.song_title}
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.song_title}</div>
                    <div style={{ fontSize: '11px', opacity: 0.55, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.artist_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Events Section (Clean timeline style events with posters) ── */}
        {events.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ height: '1px', flex: 1, background: border }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5 }}>Upcoming Events</span>
              <div style={{ height: '1px', flex: 1, background: border }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {events.map(ev => {
                const evDate = new Date(ev.event_date);
                const dateStr = evDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={ev.id} style={{
                    display: 'flex', gap: '0', borderRadius: br,
                    background: card, border: `1px solid ${border}`, overflow: 'hidden',
                  }}>
                    {ev.poster_image && (
                      <img src={`${BASE_MEDIA_URL}${ev.poster_image}`} alt={ev.title} style={{ width: '90px', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', padding: '2px 8px', background: `${accent}22`, color: accent, borderRadius: '10px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                          {ev.event_type ? ev.event_type.replace('_', ' ') : 'Event'}
                        </span>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{ev.title}</div>

                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '6px' }}>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                        {dateStr} {ev.event_time ? `@ ${ev.event_time}` : ''}
                      </div>

                      {(ev.venue || ev.city) && (
                        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                          <i className="fa-solid fa-location-dot" style={{ marginRight: '6px' }}></i>
                          {[ev.venue, ev.city].filter(Boolean).join(', ')}
                        </div>
                      )}

                      {ev.description && (
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px', lineHeight: '1.4' }}>{ev.description}</div>
                      )}

                      {ev.ticket_link && (
                        <a href={ev.ticket_link} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', fontWeight: '700', color: '#000', padding: '5px 12px', background: accent, borderRadius: '14px', alignSelf: 'flex-start', textDecoration: 'none' }}
                          onClick={e => e.stopPropagation()}>
                          Get Tickets
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '11px', marginTop: '40px', letterSpacing: '1px' }}>
          Powered by SINCE'20 Entertainments
        </div>
      </div>

      {/* ── Listen Now Popup ── */}
      {listenPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={e => { if (e.target === e.currentTarget) setListenPopup(null); }}>
          <div style={{
            width: '100%', maxWidth: '440px', background: bg,
            borderRadius: '24px 24px 16px 16px', padding: '0 0 24px',
            textAlign: 'center', border: `1px solid ${border}`, position: 'relative',
            marginBottom: '16px', overflow: 'hidden',
            animation: 'slideUp 0.3s ease',
          }}>
            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
              <img src={`${BASE_MEDIA_URL}${listenPopup.album_art}`} alt={listenPopup.song_title}
                style={{ width: '100%', height: '200px', objectFit: 'cover', filter: 'blur(30px) brightness(0.4)', position: 'absolute', inset: 0, transform: 'scale(1.1)' }} />
              <img src={`${BASE_MEDIA_URL}${listenPopup.album_art}`} alt={listenPopup.song_title}
                style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }} />
            </div>

            <button onClick={() => setListenPopup(null)}
              style={{ position: 'absolute', top: '12px', right: '14px', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ padding: '16px 24px 0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', color: fg }}>{listenPopup.song_title}</h2>
              <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '20px', color: fg }}>{listenPopup.artist_name}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(listenPopup.streaming_links || {}).filter(([, v]) => v).map(([platform, url]) => {
                  const meta = PLATFORM_META[platform] || PLATFORM_META.other;
                  return (
                    <a key={platform} href={url} target="_blank" rel="noreferrer noopener"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '13px', background: meta.bg, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <i className={meta.icon} style={{ fontSize: '18px' }}></i>
                      Listen on {meta.label}
                    </a>
                  );
                })}

                {(!listenPopup.streaming_links || Object.values(listenPopup.streaming_links).filter(Boolean).length === 0) && (
                  <div style={{ opacity: 0.45, fontSize: '13px', padding: '20px 0', color: fg }}>
                    <i className="fa-regular fa-clock" style={{ display: 'block', fontSize: '24px', marginBottom: '10px' }}></i>
                    Streaming links coming soon.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
