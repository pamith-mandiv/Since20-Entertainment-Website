import { useState, useEffect } from 'react';
import { api, logout, BASE_MEDIA_URL } from '../api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('releases');
  const [releases, setReleases] = useState([]);
  const [artists, setArtists] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  
  // Modals / Details State
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  
  // Distribution Link State
  const [distributeReleaseId, setDistributeReleaseId] = useState(null);
  const [spotifyLink, setSpotifyLink] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');

  // Correction State
  const [correctionReleaseId, setCorrectionReleaseId] = useState(null);
  const [correctionNote, setCorrectionNote] = useState('');

  // Support Reply State
  const [replyMessageId, setReplyMessageId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'admin') {
        window.location.href = '/auth/login';
      } else {
        setUser(parsed);
      }
    } else {
      window.location.href = '/auth/login';
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const releasesData = await api.getAllReleases();
      setReleases(releasesData);
      
      const artistsData = await api.getAllArtists();
      setArtists(artistsData);

      const supportData = await api.getAllSupportMessages();
      setSupportMessages(supportData);
    } catch (err) {
      setError(err.message || 'Failed to sync admin logs.');
    } finally {
      setLoading(false);
    }
  };



  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this release?')) return;
    try {
      await api.approveRelease(id);
      alert('Release approved.');
      fetchData(); // Sync
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleDistribute = async (e) => {
    e.preventDefault();
    try {
      await api.distributeRelease(distributeReleaseId, spotifyLink, appleMusicLink);
      alert('Release distributed successfully!');
      setDistributeReleaseId(null);
      setSpotifyLink('');
      setAppleMusicLink('');
      fetchData(); // Sync
    } catch (err) {
      alert(`Distribution failed: ${err.message}`);
    }
  };

  const handleCorrection = async (e) => {
    e.preventDefault();
    try {
      await api.requestCorrection(correctionReleaseId, correctionNote);
      alert('Correction requested.');
      setCorrectionReleaseId(null);
      setCorrectionNote('');
      fetchData();
    } catch (err) {
      alert(`Failed to send correction: ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this release?')) return;
    try {
      await api.rejectRelease(id);
      alert('Release rejected.');
      fetchData(); // Sync
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleReplySubmit = async (e, id) => {
    e.preventDefault();
    try {
      await api.replySupportMessage(id, replyText);
      alert('Reply sent successfully.');
      setReplyMessageId(null);
      fetchData(); // Sync
    } catch (err) {
      alert(`Reply failed: ${err.message}`);
    }
  };

  const handleTogglePortfolio = async (userId, currentStatus) => {
    try {
      await api.adminTogglePortfolio(userId, !currentStatus);
      alert(`Portfolio ${!currentStatus ? 'published' : 'hidden'} successfully.`);
      fetchData();
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  // Filters
  const filteredReleases = (Array.isArray(releases) ? releases : []).filter(
    (r) =>
      (r?.song_name && r.song_name.toLowerCase().includes(search.toLowerCase())) ||
      (r?.artist_name && r.artist_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredArtists = (Array.isArray(artists) ? artists : []).filter(
    (a) =>
      (a?.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a?.artist_name && a.artist_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR PANEL */}
      <div className="sidebar" style={{ background: '#070707' }}>
        <div className="sidebar-brand">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            {/* Swapped inline SVG for custom PNG logo */}
            <img 
              src="/logo.png" 
              alt="SINCE'20" 
              style={{ height: '34px', objectFit: 'contain', marginRight: '6px' }} 
            />
            <span className="logo-text" style={{ fontSize: '15px' }}>SINCE<span>'20</span></span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className={`sidebar-item ${activeTab === 'releases' ? 'active' : ''}`} onClick={() => { setActiveTab('releases'); setSearch(''); }}>
            <i className="fa-solid fa-folder-open"></i> Manage Releases
          </div>
          <div className={`sidebar-item ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => { setActiveTab('artists'); setSearch(''); }}>
            <i className="fa-solid fa-users"></i> Manage Artists
          </div>
          <div className={`sidebar-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => { setActiveTab('support'); setSearch(''); }}>
            <i className="fa-solid fa-envelope-open-text"></i> Support Requests
          </div>
        </div>

        <div className="sidebar-item" onClick={logout} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <i className="fa-solid fa-right-from-bracket"></i> Log Out
        </div>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="dashboard-content">
        
        {/* HEADER BLOCK */}
        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
              {activeTab === 'releases' && 'Release Submissions'}
              {activeTab === 'artists' && 'Artists Roster Management'}
              {activeTab === 'support' && 'Support Tickets'}
            </h1>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginTop: '4px' }}>Logged in as Administrative Director: Pamith Mandiv</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {activeTab !== 'support' && (
              <div style={{ maxWidth: '280px', position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--gray)', fontSize: '12px' }}></i>
                <input 
                  type="text" 
                  placeholder={activeTab === 'releases' ? "Search songs or artists..." : "Search artists names..."}
                  className="field"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '38px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px', fontSize: '13px', marginBottom: '0' }}
                />
              </div>
            )}
            <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={fetchData}>
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.2)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* 1. MANAGE RELEASES VIEW */}
        {activeTab === 'releases' && (
          <div>
            {loading ? (
              <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-spinner fa-spin"></i> Fetching submissions...</div>
            ) : filteredReleases.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '42px', color: 'var(--gray2)', marginBottom: '16px' }}></i>
                <h3>No release submissions found.</h3>
                <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '6px' }}>Songs uploaded by artists will display here.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Artwork</th>
                      <th>Song Info</th>
                      <th>Credits</th>
                      <th>Release Date</th>
                      <th>Receipt</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReleases.map((rel) => (
                      <tr key={rel.id}>
                        <td>
                          <img 
                            src={`${BASE_MEDIA_URL}${rel.album_art}`} 
                            alt={rel.song_name} 
                            style={{ width: '48px', height: '48px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{rel.song_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>By {rel.artist_name}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px' }}>Lyrics: {rel.lyrics_writer}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--gray)' }}>Composer: {rel.melody_composer}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px' }}>{new Date(rel.release_date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray2)' }}>Year: {rel.production_year}</div>
                        </td>
                        <td>
                          {rel.payment_receipt ? (
                            <a 
                              href={`${BASE_MEDIA_URL}${rel.payment_receipt}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '10.5px', borderColor: 'var(--yellow)', color: 'var(--yellow)' }}
                            >
                              <i className="fa-solid fa-receipt"></i> View Receipt
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--gray2)' }}>No Receipt</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge status-${rel.status}`} style={{ position: 'static', padding: '4px 8px' }}>
                            {rel.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => setSelectedDetails(rel)} 
                              className="btn btn-outline" 
                              style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '4px' }}
                            >
                              View Details
                            </button>
                            {rel.status === 'pending' || rel.status === 'correction' ? (
                              <>
                                <button 
                                  onClick={() => handleApprove(rel.id)} 
                                  className="btn btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '4px' }}
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => { setCorrectionReleaseId(rel.id); setCorrectionNote(rel.correction_note || ''); }} 
                                  className="btn btn-outline" 
                                  style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '4px', color: 'var(--yellow)', borderColor: 'rgba(255,212,0,0.3)' }}
                                >
                                  Correction
                                </button>
                                <button 
                                  onClick={() => handleReject(rel.id)} 
                                  className="btn btn-outline" 
                                  style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '4px', color: '#ff6b6b', borderColor: 'rgba(231,76,60,0.3)' }}
                                >
                                  Reject
                                </button>
                              </>
                            ) : rel.status === 'approved' ? (
                              <button 
                                onClick={() => { setDistributeReleaseId(rel.id); setSpotifyLink(''); setAppleMusicLink(''); }} 
                                className="btn btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '4px' }}
                              >
                                Distribute
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. MANAGE ARTISTS VIEW */}
        {activeTab === 'artists' && (
          <div>
            {loading ? (
              <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-spinner fa-spin"></i> Syncing roster...</div>
            ) : filteredArtists.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-user-slash" style={{ fontSize: '42px', color: 'var(--gray2)', marginBottom: '16px' }}></i>
                <h3>No artists matching criteria.</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filteredArtists.map((art) => {
                  const artReleases = releases.filter(r => r.user_id === art.id);
                  return (
                    <div key={art.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--yellow)', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                            {(art.name || art.artist_name || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0' }}>{art.artist_name || art.name}</h3>
                            <span style={{ fontSize: '11px', color: 'var(--gray)' }}>{art.country}</span>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '12.5px', color: 'var(--gray)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div><i className="fa-solid fa-envelope" style={{ marginRight: '6px', width: '14px' }}></i> {art.email}</div>
                          <div><i className="fa-solid fa-phone" style={{ marginRight: '6px', width: '14px' }}></i> {art.phone}</div>
                          <div><i className="fa-solid fa-music" style={{ marginRight: '6px', width: '14px' }}></i> {artReleases.length} catalog releases</div>
                        </div>

                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>Portfolio Page:</span>
                          <button 
                            onClick={() => handleTogglePortfolio(art.id, art.portfolio_active)}
                            className="btn btn-outline"
                            style={{ 
                              padding: '4px 10px', 
                              fontSize: '11px', 
                              color: art.portfolio_active ? '#2ecc71' : 'var(--gray)',
                              borderColor: art.portfolio_active ? 'rgba(46,204,113,0.3)' : 'var(--border)'
                            }}
                          >
                            {art.portfolio_active ? 'Published ✓' : 'Hidden'}
                          </button>
                        </div>
                        {art.portfolio_active && art.portfolio_slug && (
                          <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right' }}>
                            <a href={`/artist/${art.portfolio_slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>
                              View Portfolio &rarr;
                            </a>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => setSelectedArtist({ ...art, catalog: artReleases })}
                        className="btn btn-outline" 
                        style={{ width: '100%', justifyContent: 'center', padding: '8px 0', fontSize: '12px', marginTop: '20px' }}
                      >
                        Manage Catalog
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. SUPPORT MESSAGES (Help Chat review console) */}
        {activeTab === 'support' && (
          <div>
            {loading ? (
              <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-spinner fa-spin"></i> Fetching messages...</div>
            ) : supportMessages.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-comments" style={{ fontSize: '42px', color: 'var(--gray2)', marginBottom: '16px' }}></i>
                <h3>No support tickets pending.</h3>
                <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '6px' }}>When artists post queries in their help chat, they will show here.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Artist Submitter</th>
                      <th>Message query</th>
                      <th>Created Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportMessages.map((msg) => (
                      <tr key={msg.id}>
                        <td style={{ fontWeight: '600', color: 'var(--yellow)', width: '220px' }}>
                          {msg.artist_name} <span style={{ fontSize: '11px', color: 'var(--gray)', display: 'block' }}>User ID: {msg.user_id}</span>
                        </td>
                        <td style={{ color: 'var(--white)', fontSize: '14px', lineHeight: '1.5' }}>
                          <div style={{ marginBottom: '8px' }}>{msg.message}</div>
                          {msg.admin_reply ? (
                            <div style={{ background: 'rgba(255, 212, 0, 0.05)', borderLeft: '2px solid var(--yellow)', padding: '8px 12px', fontSize: '12px' }}>
                              <strong>Your Reply:</strong> {msg.admin_reply}
                            </div>
                          ) : (
                            replyMessageId === msg.id ? (
                              <form onSubmit={(e) => handleReplySubmit(e, msg.id)} style={{ marginTop: '10px' }}>
                                <textarea 
                                  className="field" 
                                  placeholder="Type your reply here..." 
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows="2"
                                  style={{ marginBottom: '8px', padding: '8px' }}
                                  required
                                ></textarea>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }}>Send Reply</button>
                                  <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setReplyMessageId(null)}>Cancel</button>
                                </div>
                              </form>
                            ) : (
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '4px 10px', fontSize: '11px', marginTop: '6px' }}
                                onClick={() => { setReplyMessageId(msg.id); setReplyText(''); }}
                              >
                                Reply to Artist
                              </button>
                            )
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--gray2)', width: '180px' }}>
                          {new Date(msg.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



        {/* METADATA DRILLDOWN MODAL */}
        {selectedDetails && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }} onClick={() => setSelectedDetails(null)}>
            
            <div 
              className="glass-card" 
              style={{
                background: '#0d0d0d', border: '1px solid var(--border)', maxWidth: '580px', width: '100%',
                borderRadius: '8px', position: 'relative', padding: '32px'
              }} 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setSelectedDetails(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Submission Metadata Details</h3>
              <p style={{ color: 'var(--gray)', fontSize: '12.5px', marginBottom: '20px' }}>Release Database ID: {selectedDetails.id}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '20px' }}>
                <img 
                  src={`${BASE_MEDIA_URL}${selectedDetails.album_art}`} 
                  alt="art" 
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', border: '1px solid var(--border)' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                  <div><strong>Song Name:</strong> {selectedDetails.song_name}</div>
                  <div><strong>Artist(s):</strong> {selectedDetails.artist_name}</div>
                  <div><strong>Lyrics:</strong> {selectedDetails.lyrics_writer}</div>
                  <div><strong>Composer:</strong> {selectedDetails.melody_composer}</div>
                  <div><strong>Release Scheduled:</strong> {new Date(selectedDetails.release_date).toLocaleDateString()}</div>
                  <div><strong>Production Year:</strong> {selectedDetails.production_year}</div>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border)', margin: '16px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', color: 'var(--gray)' }}>
                <div><strong>TikTok Start Time:</strong> {selectedDetails.tiktok_cut_time}</div>
                <div><strong>TikTok Release:</strong> {new Date(selectedDetails.tiktok_release_date).toLocaleDateString()}</div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>YouTube Channel:</strong> <a href={selectedDetails.youtube_channel} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>{selectedDetails.youtube_channel}</a>
                </div>

                {selectedDetails.tiktok_link && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>TikTok Channel:</strong> <a href={selectedDetails.tiktok_link} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>{selectedDetails.tiktok_link}</a>
                  </div>
                )}
                {selectedDetails.facebook_link && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Facebook:</strong> <a href={selectedDetails.facebook_link} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>{selectedDetails.facebook_link}</a>
                  </div>
                )}
                {selectedDetails.instagram_link && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Instagram:</strong> <a href={selectedDetails.instagram_link} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>{selectedDetails.instagram_link}</a>
                  </div>
                )}

                {selectedDetails.payment_receipt && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Payment Proof:</strong> <a href={`${BASE_MEDIA_URL}${selectedDetails.payment_receipt}`} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)', textDecoration: 'underline' }}>View receipt file</a>
                  </div>
                )}

                {selectedDetails.additional_notes && (
                  <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <strong>Notes:</strong> {selectedDetails.additional_notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                <a href={`${BASE_MEDIA_URL}${selectedDetails.song_file}`} download className="btn btn-outline" style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}>
                  <i className="fa-solid fa-file-audio"></i> Download WAV
                </a>
                <a href={`${BASE_MEDIA_URL}${selectedDetails.album_art}`} download className="btn btn-outline" style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}>
                  <i className="fa-solid fa-image"></i> Download Image
                </a>
                <button onClick={() => setSelectedDetails(null)} className="btn btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}>
                  Close Details
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ARTIST CATALOG DRILLDOWN MODAL */}
        {selectedArtist && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }} onClick={() => setSelectedArtist(null)}>
            
            <div 
              className="glass-card" 
              style={{
                background: '#0d0d0d', border: '1px solid var(--border)', maxWidth: '720px', width: '100%',
                borderRadius: '8px', position: 'relative', padding: '32px', maxHeight: '90vh', overflowY: 'auto'
              }} 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setSelectedArtist(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Artist Catalog Manager</h3>
              <p style={{ color: 'var(--yellow)', fontSize: '13.5px', marginBottom: '20px', fontWeight: '600' }}>{selectedArtist.artist_name || selectedArtist.name}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedArtist.catalog.length === 0 ? (
                  <div style={{ color: 'var(--gray2)', textAlign: 'center', padding: '30px 0' }}>No songs uploaded yet by this artist.</div>
                ) : (
                  selectedArtist.catalog.map(song => (
                    <div key={song.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={`${BASE_MEDIA_URL}${song.album_art}`} alt="art" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{song.song_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray2)' }}>ID: {song.id} | Year: {song.production_year}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`status-badge status-${song.status}`} style={{ position: 'static', padding: '3px 8px', fontSize: '10px' }}>{song.status}</span>
                        {song.status === 'pending' || song.status === 'correction' ? (
                          <button 
                            onClick={() => { setSelectedArtist(null); handleApprove(song.id); }}
                            className="btn btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '10.5px', borderRadius: '4px' }}
                          >
                            Approve
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button onClick={() => setSelectedArtist(null)} className="btn btn-outline">Close Manager</button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* DISTRIBUTE MODAL */}
      {distributeReleaseId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }} onClick={() => setDistributeReleaseId(null)}>
          <div 
            className="glass-card" 
            style={{ background: '#0d0d0d', border: '1px solid var(--border)', maxWidth: '440px', width: '100%', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Distribute Release</h3>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>Add active tracking links for this release below. The artist will be notified that the release is distributed.</p>
            
            <form onSubmit={handleDistribute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '6px' }}>Spotify Release Link</label>
                <input 
                  type="url" 
                  className="field" 
                  placeholder="https://open.spotify.com/album/..." 
                  value={spotifyLink}
                  onChange={(e) => setSpotifyLink(e.target.value)}
                  style={{ marginBottom: '0' }}
                  required
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '6px' }}>Apple Music Release Link</label>
                <input 
                  type="url" 
                  className="field" 
                  placeholder="https://music.apple.com/us/album/..." 
                  value={appleMusicLink}
                  onChange={(e) => setAppleMusicLink(e.target.value)}
                  style={{ marginBottom: '0' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDistributeReleaseId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Mark as Distributed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORRECTION REQUEST MODAL */}
      {correctionReleaseId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }} onClick={() => setCorrectionReleaseId(null)}>
          <div 
            className="glass-card" 
            style={{ background: '#0d0d0d', border: '1px solid var(--border)', maxWidth: '440px', width: '100%', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Request Corrections</h3>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>Let the artist know what changes need to be made before the release can be approved.</p>
            
            <form onSubmit={handleCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '6px' }}>Correction Notes</label>
                <textarea 
                  className="field" 
                  placeholder="e.g. Please upload higher resolution artwork..." 
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  rows="4"
                  style={{ marginBottom: '0', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCorrectionReleaseId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
