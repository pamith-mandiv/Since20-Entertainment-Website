import { useState, useEffect, useRef } from 'react';
import { api, logout, BASE_MEDIA_URL } from '../api';
import PortfolioEditor from '../components/PortfolioEditor';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('releases');
  const [user, setUser] = useState(null);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  // Help Chat States
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState('');
  const [supportError, setSupportError] = useState('');
  const [supportLogs, setSupportLogs] = useState([]);

  // Uploader Form States
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [lyricsWriter, setLyricsWriter] = useState('');
  const [melodyComposer, setMelodyComposer] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [tiktokStart, setTiktokStart] = useState('00:00');
  const [tiktokRelease, setTiktokRelease] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [tiktokLink, setTiktokLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [prodYear, setProdYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [uploadStage, setUploadStage] = useState(1);

  const [albumArtFile, setAlbumArtFile] = useState(null);
  const [albumArtPreview, setAlbumArtPreview] = useState(null);
  const [songFile, setSongFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null); // Optional receipt file

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [editModeId, setEditModeId] = useState(null);
  // Refs for custom triggers
  const artInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const receiptInputRef = useRef(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      window.location.href = '/auth/login';
    }
    fetchReleases();
  }, []);

  const fetchMySupportMessages = async () => {
    try {
      const data = await api.getMySupportMessages();
      setSupportLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'support') {
      fetchMySupportMessages();
    }
  }, [activeTab]);

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const data = await api.getMyReleases();
      setReleases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to sync releases catalog.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Help Chat Handlers
  const handleSendSupport = async (e) => {
    e.preventDefault();
    setSupportError('');
    setSupportSuccess('');

    if (!supportMessage || supportMessage.trim() === '') {
      return;
    }

    setSupportSending(true);
    try {
      await api.submitSupportMessage(supportMessage);
      setSupportSuccess('Problem request submitted successfully to admin.');

      // Fetch latest messages instead of mock
      fetchMySupportMessages();
      setSupportMessage('');
    } catch (err) {
      setSupportError(err.message || 'Failed to submit message.');
    } finally {
      setSupportSending(false);
    }
  };

  // Uploader Handlers
  const handleArtChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setUploadError('Artwork must be a JPG or PNG image.');
        return;
      }
      setAlbumArtFile(file);
      setAlbumArtPreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.wav')) {
        setUploadError('Audio track must be in WAV format.');
        return;
      }
      setSongFile(file);
      setUploadError('');
    }
  };

  const handleEditSubmission = (release) => {
    setEditModeId(release.id);
    setSongName(release.song_name || '');
    setArtistName(release.artist_name || '');
    setLyricsWriter(release.lyrics_writer || '');
    setMelodyComposer(release.melody_composer || '');
    if (release.release_date) {
      try {
        setReleaseDate(new Date(release.release_date).toISOString().split('T')[0]);
      } catch (e) {
        setReleaseDate('');
      }
    } else {
      setReleaseDate('');
    }
    setTiktokStart(release.tiktok_cut_time || '00:00');
    if (release.tiktok_release_date) {
      try {
        setTiktokRelease(new Date(release.tiktok_release_date).toISOString().split('T')[0]);
      } catch (e) {
        setTiktokRelease('');
      }
    } else {
      setTiktokRelease('');
    }
    setYoutubeLink(release.youtube_channel || '');
    setTiktokLink(release.tiktok_link || '');
    setFacebookLink(release.facebook_link || '');
    setInstagramLink(release.instagram_link || '');
    setProdYear(release.production_year || new Date().getFullYear());
    setNotes(release.additional_notes || '');

    setAlbumArtFile(null);
    setAlbumArtPreview(`${BASE_MEDIA_URL}${release.album_art}`);
    setSongFile(null);
    setReceiptFile(null);

    setUploadStage(1);
    setConfirmChecked(false);
    setSelectedDetails(null);
    setActiveTab('upload');
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
        setUploadError('Receipt must be in JPG, PNG, or PDF format.');
        return;
      }
      setReceiptFile(file);
      setUploadError('');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!editModeId && (!albumArtFile || !songFile)) {
      setUploadError('Please choose both artwork and WAV song file before uploading.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('song_name', songName);
    formData.append('artist_name', artistName);
    formData.append('lyrics_writer', lyricsWriter);
    formData.append('melody_composer', melodyComposer);
    formData.append('release_date', releaseDate);
    formData.append('tiktok_cut_time', tiktokStart);
    formData.append('tiktok_release_date', tiktokRelease);
    formData.append('youtube_channel', youtubeLink);
    formData.append('tiktok_link', tiktokLink);
    formData.append('facebook_link', facebookLink);
    formData.append('instagram_link', instagramLink);
    formData.append('production_year', prodYear);
    formData.append('additional_notes', notes);
    if (albumArtFile) formData.append('album_art', albumArtFile);
    if (songFile) formData.append('song_file', songFile);

    // Add optional payment receipt
    if (receiptFile) {
      formData.append('payment_receipt', receiptFile);
    }

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      if (editModeId) {
        await api.updateRelease(editModeId, formData);
      } else {
        await api.uploadRelease(formData);
      }
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadSuccess(editModeId ? 'Release updated successfully! Pending Administrator review.' : 'Song uploaded successfully! Pending Administrator review.');
        setUploading(false);
        setUploadProgress(0);

        setSongName('');
        setArtistName('');
        setLyricsWriter('');
        setMelodyComposer('');
        setReleaseDate('');
        setTiktokStart('00:00');
        setTiktokRelease('');
        setYoutubeLink('');
        setTiktokLink('');
        setFacebookLink('');
        setInstagramLink('');
        setNotes('');
        setConfirmChecked(false);
        setUploadStage(1);
        setAlbumArtFile(null);
        setAlbumArtPreview(null);
        setSongFile(null);
        setReceiptFile(null);
        setEditModeId(null);

        fetchReleases();
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setUploadError(err.message || 'File upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const [dragOverArt, setDragOverArt] = useState(false);
  const [dragOverAudio, setDragOverAudio] = useState(false);
  const [dragOverReceipt, setDragOverReceipt] = useState(false);

  if (!user) {
    return <div style={{ color: 'var(--yellow)', padding: '40px', textAlign: 'center' }}>Authenticating user session...</div>;
  }

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR PANEL */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
          <div className={`sidebar-item ${activeTab === 'releases' ? 'active' : ''}`} onClick={() => { setActiveTab('releases'); setSidebarOpen(false); }}>
            <i className="fa-solid fa-compact-disc"></i> My Releases
          </div>
          <div className={`sidebar-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => { setActiveTab('upload'); setSidebarOpen(false); }}>
            <i className="fa-solid fa-cloud-arrow-up"></i> Upload Song
          </div>
          <div className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}>
            <i className="fa-solid fa-chart-simple"></i> Analytics
          </div>
          <div className={`sidebar-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => { setActiveTab('support'); setSidebarOpen(false); }}>
            <i className="fa-solid fa-comments"></i> Help & Support
          </div>
          <a href="#revenue" className="sidebar-item" onClick={() => alert('Revenue Dashboard is an external portal. Link placeholder triggered.')}>
            <i className="fa-solid fa-wallet"></i> Revenue Dashboard
          </a>
          <div className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}>
            <i className="fa-solid fa-user-gear"></i> My Portfolio
          </div>
        </div>

        <div className="sidebar-item" onClick={logout} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <i className="fa-solid fa-right-from-bracket"></i> Log Out
        </div>
      </div>

      {/* MOBILE TRIGGER */}
      <div
        style={{ position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: 'var(--yellow)', color: 'var(--black)', display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100, boxShadow: '0 4px 15px rgba(255,212,0,0.4)' }}
        className="burger-menu"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className={sidebarOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"} style={{ fontSize: '20px' }}></i>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="dashboard-content">

        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
              {activeTab === 'releases' && 'My Releases Catalog'}
              {activeTab === 'upload' && (editModeId ? 'Update Release Submission' : 'Submit New Release')}
              {activeTab === 'analytics' && 'Streaming Metrics'}
              {activeTab === 'support' && 'Help & Support'}
              {activeTab === 'profile' && 'My Portfolio'}
            </h1>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginTop: '4px' }}>
              Welcome back, <span className="accent" style={{ fontWeight: '600' }}>{user.artist_name || user.name}</span>
            </p>
          </div>
          <div className="dashboard-user">
            <div className="avatar">{(user.artist_name || user.name)[0].toUpperCase()}</div>
          </div>
        </div>

        {/* 1. MY RELEASES VIEW */}
        {activeTab === 'releases' && (
          <div>
            {loading ? (
              <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-spinner fa-spin"></i> Syncing releases...</div>
            ) : error ? (
              <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '40px' }}>{error}</div>
            ) : releases.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-music" style={{ fontSize: '42px', color: 'var(--gray2)', marginBottom: '16px' }}></i>
                <h3>No releases found in your catalog.</h3>
                <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '6px', marginBottom: '24px' }}>Upload your first song to begin distribution.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>Distribute Song</button>
              </div>
            ) : (
              <div className="releases-grid">
                {releases.map((rel) => (
                  <div key={rel.id} className="release-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedDetails(rel)}>
                    <div className="release-art-wrapper">
                      <img src={`${BASE_MEDIA_URL}${rel.album_art}`} alt={rel.song_name} className="release-art" />
                      <div className={`status-badge status-${rel.status || 'pending'}`}>{(rel.status || 'pending').toUpperCase()}</div>
                    </div>
                    <div className="release-info">
                      <div className="release-header">
                        <h3 className="release-title">{rel.song_name}</h3>
                        <p className="release-artist">{rel.artist_name}</p>
                      </div>

                      {rel.status === 'released' ? (
                        <div>


                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            {rel.spotify_link && (
                              <a href={rel.spotify_link} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '11px', color: '#1DB954', borderColor: 'rgba(29, 185, 84, 0.3)', width: '100%', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <i className="fa-brands fa-spotify"></i> Listen on Spotify
                              </a>
                            )}

                            {rel.apple_music_link && (
                              <a href={rel.apple_music_link} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '11px', color: '#FC3C44', borderColor: 'rgba(252, 60, 68, 0.3)', width: '100%', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <i className="fa-brands fa-apple"></i> Listen on Apple Music
                              </a>
                            )}
                          </div>
                        </div>
                      ) : rel.status === 'correction' ? (
                        <div style={{ fontSize: '12.5px', color: 'var(--yellow)', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}><i className="fa-solid fa-triangle-exclamation"></i> Correction Requested:</div>
                          <div style={{ color: 'var(--white)' }}>{rel.correction_note}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12.5px', color: 'var(--gray2)', borderTop: '1px solid var(--border)', paddingTop: '14px', textAlign: 'center' }}>
                          {rel.status === 'pending' ? 'Awaiting metadata verification' : rel.status === 'approved' ? 'Approved, waiting for distribution' : 'Rejected by administrator'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. UPLOAD SONG VIEW */}
        {activeTab === 'upload' && (
          <div className="glass-card" style={{ maxWidth: '800px' }}>
            <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Metadata Form</h3>

            {uploadError && (
              <div style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.2)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div style={{ background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {uploadStage === 1 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                    {/* Artwork file select */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--gray)', marginBottom: '8px' }}>Artwork {!editModeId && '* '} (JPG/PNG, 5MB)</label>
                      <div
                        className={`uploader-area ${dragOverArt ? 'dragging' : ''}`}
                        onClick={() => artInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOverArt(true); }}
                        onDragLeave={() => setDragOverArt(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverArt(false);
                          const file = e.dataTransfer.files[0];
                          if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
                            setAlbumArtFile(file);
                            setAlbumArtPreview(URL.createObjectURL(file));
                          }
                        }}
                        style={{ minHeight: '140px', padding: '15px' }}
                      >
                        <input
                          type="file"
                          ref={artInputRef}
                          onChange={handleArtChange}
                          accept=".jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                        />
                        {albumArtPreview ? (
                          <img src={albumArtPreview} alt="Art Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        ) : (
                          <>
                            <i className="fa-solid fa-image uploader-icon" style={{ fontSize: '24px' }}></i>
                            <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Choose Artwork</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Track WAV file select */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--gray)', marginBottom: '8px' }}>Track {!editModeId && '* '} (WAV format, 50MB)</label>
                      <div
                        className={`uploader-area ${dragOverAudio ? 'dragging' : ''}`}
                        onClick={() => audioInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOverAudio(true); }}
                        onDragLeave={() => setDragOverAudio(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverAudio(false);
                          const file = e.dataTransfer.files[0];
                          if (file && file.name.toLowerCase().endsWith('.wav')) {
                            setSongFile(file);
                          }
                        }}
                        style={{ minHeight: '140px', padding: '15px' }}
                      >
                        <input
                          type="file"
                          ref={audioInputRef}
                          onChange={handleAudioChange}
                          accept=".wav"
                          style={{ display: 'none' }}
                        />
                        {songFile ? (
                          <div>
                            <i className="fa-solid fa-circle-check" style={{ color: 'var(--yellow)', fontSize: '24px' }}></i>
                            <div style={{ fontSize: '10px', color: 'var(--white)', marginTop: '4px', wordBreak: 'break-all' }}>{songFile.name.slice(0, 15)}...</div>
                          </div>
                        ) : (
                          <>
                            <i className="fa-solid fa-file-audio uploader-icon" style={{ fontSize: '24px' }}></i>
                            <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Choose WAV Track</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Song Title *</label>
                      <input type="text" className="field" placeholder="e.g. Obage Heene" value={songName} onChange={(e) => setSongName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Main Artist *</label>
                      <input type="text" className="field" placeholder="Artist(s) name" value={artistName} onChange={(e) => setArtistName(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Lyrics Writer *</label>
                      <input type="text" className="field" placeholder="Author name" value={lyricsWriter} onChange={(e) => setLyricsWriter(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Melody Composer *</label>
                      <input type="text" className="field" placeholder="Composer name" value={melodyComposer} onChange={(e) => setMelodyComposer(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Release Date *</label>
                      <input type="date" className="field" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>TikTok Audio Cut Start *</label>
                      <input type="text" className="field" placeholder="e.g. 00:45" value={tiktokStart} onChange={(e) => setTiktokStart(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>TikTok Release Date *</label>
                      <input type="date" className="field" value={tiktokRelease} onChange={(e) => setTiktokRelease(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Production Year *</label>
                      <input type="number" className="field" value={prodYear} onChange={(e) => setProdYear(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Additional Notes (Optional)</label>
                      <input type="text" className="field" placeholder="e.g. Marketing preferences" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '14px 0', marginTop: '16px' }} onClick={() => setUploadStage(2)}>
                    Next Step: Additional Details
                  </button>
                </>
              )}

              {uploadStage === 2 && (
                <>
                  <button type="button" className="btn btn-outline" style={{ marginBottom: '16px' }} onClick={() => setUploadStage(1)}>
                    &larr; Back to Stage 1
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>YouTube Artist Channel Link *</label>
                      <input type="url" className="field" placeholder="e.g. https://youtube.com/..." value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>TikTok Channel Link</label>
                      <input type="url" className="field" placeholder="e.g. https://tiktok.com/..." value={tiktokLink} onChange={(e) => setTiktokLink(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Facebook Link</label>
                      <input type="url" className="field" placeholder="e.g. https://facebook.com/..." value={facebookLink} onChange={(e) => setFacebookLink(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>Instagram Link</label>
                      <input type="url" className="field" placeholder="e.g. https://instagram.com/..." value={instagramLink} onChange={(e) => setInstagramLink(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--gray)', marginBottom: '8px' }}>Payment Receipt (Optional, PDF/JPG)</label>
                    <div
                      className={`uploader-area ${dragOverReceipt ? 'dragging' : ''}`}
                      onClick={() => receiptInputRef.current.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOverReceipt(true); }}
                      onDragLeave={() => setDragOverReceipt(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverReceipt(false);
                        const file = e.dataTransfer.files[0];
                        const ext = file.name.split('.').pop().toLowerCase();
                        if (file && ['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
                          setReceiptFile(file);
                        }
                      }}
                      style={{ minHeight: '140px', padding: '15px' }}
                    >
                      <input
                        type="file"
                        ref={receiptInputRef}
                        onChange={handleReceiptChange}
                        accept=".jpg,.jpeg,.png,.pdf"
                        style={{ display: 'none' }}
                      />
                      {receiptFile ? (
                        <div>
                          <i className="fa-solid fa-receipt" style={{ color: 'var(--yellow)', fontSize: '24px' }}></i>
                          <div style={{ fontSize: '10px', color: 'var(--white)', marginTop: '4px', wordBreak: 'break-all' }}>{receiptFile.name.slice(0, 15)}...</div>
                        </div>
                      ) : (
                        <>
                          <i className="fa-solid fa-wallet uploader-icon" style={{ fontSize: '24px' }}></i>
                          <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Choose Receipt File</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="confirmCheckbox"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="confirmCheckbox" style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      I hereby confirm that I hold all necessary rights and permissions to distribute this content.
                    </label>
                  </div>

                  {/* Progress Bar */}
                  {uploading && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray)' }}>
                        <span>Encrypting and uploading catalog package...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px 0', marginTop: '20px' }} disabled={uploading || !confirmChecked}>
                    {uploading ? 'Processing files...' : (editModeId ? 'Update Release' : 'Submit to Administrator review')}
                  </button>
                </>
              )}
            </form>
          </div>
        )}

        {/* 3. ANALYTICS VIEW */}
        {activeTab === 'analytics' && (
          <div>
            {releases.filter(r => r.status === 'approved').length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: '42px', color: 'var(--gray2)', marginBottom: '16px' }}></i>
                <h3>No streaming analytics available yet.</h3>
                <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '6px' }}>Once your song releases are approved and streaming links are active, stats will compile here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Streaming Trend (Last 7 Days)</h3>
                  <div style={{ position: 'relative', height: '220px', width: '100%', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                    <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <path
                        d="M0,45 Q15,40 30,35 T60,22 T90,10 L100,5"
                        fill="none"
                        stroke="var(--yellow)"
                        strokeWidth="1.5"
                      />
                      <circle cx="0" cy="45" r="1.5" fill="var(--yellow)" />
                      <circle cx="30" cy="35" r="1.5" fill="var(--yellow)" />
                      <circle cx="60" cy="22" r="1.5" fill="var(--yellow)" />
                      <circle cx="100" cy="5" r="1.5" fill="var(--yellow)" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifycontent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--gray)' }}>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Platform Distribution</h3>
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <svg width="120" height="120" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border)" strokeWidth="6" />
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1DB954" strokeWidth="6" strokeDasharray="65 35" strokeDashoffset="25" />
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#FC3C44" strokeWidth="6" strokeDasharray="35 65" strokeDashoffset="90" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span><i className="fa-brands fa-spotify" style={{ color: '#1DB954', marginRight: '6px' }}></i> Spotify</span>
                      <span style={{ fontWeight: '600' }}>65%</span>
                    </div>
                    <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px' }}>
                      <span><i className="fa-brands fa-apple" style={{ color: '#FC3C44', marginRight: '6px' }}></i> Apple Music</span>
                      <span style={{ fontWeight: '600' }}>35%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. HELP CHAT VIEW (Help & Support Panel) */}
        {activeTab === 'support' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '540px' }}>
              <h3 style={{ marginBottom: '14px', fontWeight: '600' }}>Chat Messenger</h3>

              {supportSuccess && (
                <div style={{ background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '10px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                  {supportSuccess}
                </div>
              )}
              {supportError && (
                <div style={{ background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.2)', color: '#ff6b6b', padding: '10px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
                  {supportError}
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleSendSupport} style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <input
                  type="text"
                  className="field"
                  placeholder="Describe your issue or request changes (e.g. Fix release metadata, payout problem)..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  style={{ marginBottom: '0' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }} disabled={supportSending}>
                  {supportSending ? 'Sending...' : 'Send'}
                </button>
              </form>
              <div style={{ fontSize: '11px', color: 'var(--gray2)', marginTop: '8px' }}>
                Your queries are directly submitted to admin Pamith Mandiv.
              </div>
            </div>

            <div className="glass-card" style={{ height: '540px', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Request History</h3>
              {supportLogs.length === 0 ? (
                <div style={{ color: 'var(--gray2)', textAlign: 'center', paddingTop: '80px' }}>
                  <i className="fa-solid fa-message" style={{ fontSize: '28px', display: 'block', marginBottom: '12px' }}></i>
                  No requests submitted in this session.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {supportLogs.map((log) => (
                    <div key={log.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray)' }}>
                        <span className="accent" style={{ fontWeight: '600' }}>To: Admin</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--white)' }}>{log.message}</p>

                      {log.admin_reply && (
                        <div style={{ background: 'rgba(255, 212, 0, 0.05)', borderLeft: '2px solid var(--yellow)', padding: '10px 14px', marginTop: '12px', borderRadius: '0 4px 4px 0' }}>
                          <div style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: '600', marginBottom: '4px' }}>Admin Reply</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--white)' }}>{log.admin_reply}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. MY PORTFOLIO VIEW */}
        {activeTab === 'profile' && (
          <PortfolioEditor user={user || {}} />
        )}

      </div>
      {/* METADATA DRILLDOWN MODAL */}
      {selectedDetails && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setSelectedDetails(null); }}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>Release Details</h3>
              <div className={`status-badge status-${selectedDetails.status || 'pending'}`}>{(selectedDetails.status || 'pending').toUpperCase()}</div>
            </div>

            <div className="drilldown-grid">
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

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--yellow)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Socials & Marketing</div>

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
                </div>
              </div>

              {selectedDetails.correction_note && (
                <div style={{ marginTop: '16px', background: 'rgba(255, 212, 0, 0.05)', borderLeft: '2px solid var(--yellow)', padding: '12px 16px', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--yellow)', display: 'block', marginBottom: '6px' }}>Correction Note from Admin:</strong>
                  {selectedDetails.correction_note}
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>Audio Preview</strong>
                <audio controls src={`${BASE_MEDIA_URL}${selectedDetails.song_file}`} style={{ width: '100%', height: '36px' }}></audio>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                {selectedDetails.status === 'correction' && (
                  <button onClick={() => handleEditSubmission(selectedDetails)} className="btn btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: '12px', background: 'var(--yellow)', color: 'var(--black)' }}>
                    <i className="fa-solid fa-pen-to-square"></i> Edit Submission
                  </button>
                )}
                <button onClick={() => setSelectedDetails(null)} className="btn btn-outline" style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}>
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
