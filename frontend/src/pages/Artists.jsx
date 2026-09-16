import { useState } from 'react';

export default function Artists() {
  const [selectedArtist, setSelectedArtist] = useState(null);

  const artistRoster = [
    {
      name: 'Kavishka Silva',
      genre: 'Acoustic / Indie Pop',
      img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      bio: 'Kavishka is a singer-songwriter based in Colombo, blending warm acoustic guitars with storytelling lyrics. Influenced by Ed Sheeran and Damien Rice, his catalog has gained millions of streams locally.',
      releases: ['Nodiththath Wage (2024)', 'Tharuka (2025)', 'Me Heene (2026)']
    },
    {
      name: 'Dilshan Perera',
      genre: 'Electronic / Synthwave',
      img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      bio: 'Dilshan is a music producer producing synthwave and progressive house. His productions merge retro analog basslines with modern vocal chops.',
      releases: ['Retrograde (2023)', 'Neon Dreams (2024)', 'After Hours (2026)']
    },
    {
      name: 'Shenal Fernando',
      genre: 'Modern R&B / Soul',
      img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
      bio: 'Shenal combines smooth Neo-Soul harmonies with heavy hip-hop drum loops. Known for his vocal range, he leads the contemporary R&B wave.',
      releases: ['Late Night Conversations (2024)', 'Midnight Blue (2025)']
    },
    {
      name: 'Thisara Bandara',
      genre: 'Alternative Rock',
      img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      bio: 'Thisara is a multi-instrumentalist whose music addresses themes of self-reflection and youth culture, featuring aggressive guitar solos and energetic drums.',
      releases: ['Out of Time (2023)', 'Distortion (2025)']
    },
    {
      name: 'Minidu Jayawardena',
      genre: 'Pop / Reggae Fusion',
      img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80',
      bio: 'Minidu blends classical pop arrangements with reggae beats and brass horn sections, producing catchy hits designed for summer airplay.',
      releases: ['Island Breeze (2024)', 'Suryoday (2026)']
    },
    {
      name: 'Asha Jayasinghe',
      genre: 'Classical / Folk Fusion',
      img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
      bio: 'Asha is a classically trained vocalist who layers traditional instruments under digital pads, creating meditative and cinematic soundscapes.',
      releases: ['Aaranya (2024)', 'Sacred Rivers (2025)']
    }
  ];

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      {/* PAGE HEADER */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="label-tag" style={{ display: 'inline-block', fontSize: '12px', letterSpacing: '3px', color: 'var(--yellow)', fontWeight: '600', marginBottom: '14px' }}>ROSTER</span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', marginBottom: '20px' }}>Our Artist Roster</h1>
        <p style={{ color: 'var(--gray)', fontSize: '18px', maxWidth: '680px', margin: '0 auto' }}>
          Meet the independent artists and bands releasing catalog worldwide under the SINCE'20 banner.
        </p>
      </section>

      {/* ARTISTS GRID */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '40px' }}>
          {artistRoster.map((art, idx) => (
            <div key={idx} className="release-card" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div className="release-art-container" style={{ aspectRatio: '1/1' }}>
                <img src={art.img} alt={art.name} className="release-art" style={{ filter: 'grayscale(40%)' }} />
              </div>
              <div className="release-info" style={{ padding: '24px' }}>
                <div>
                  <h3 className="release-title" style={{ fontSize: '20px', fontWeight: '700' }}>{art.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--yellow)', background: 'rgba(255,212,0,0.1)', padding: '4px 10px', borderRadius: '50px', display: 'inline-block', marginTop: '6px' }}>
                    {art.genre}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedArtist(art)} 
                  className="btn btn-outline" 
                  style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: '24px', padding: '12px' }}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROFILE MODAL */}
      {selectedArtist && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setSelectedArtist(null)}>
          
          <div 
            style={{
              background: '#0d0d0d', border: '1px solid var(--border)', maxWidth: '680px', width: '100%',
              borderRadius: '0px', overflow: 'hidden', position: 'relative', display: 'grid', 
              gridTemplateColumns: '1fr 1.2fr'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div style={{ background: `url(${selectedArtist.img}) center/cover no-repeat`, aspectRatio: '1/1' }}></div>
            
            {/* Modal Content */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <button 
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                  onClick={() => setSelectedArtist(null)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{selectedArtist.name}</h2>
                <div style={{ color: 'var(--yellow)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>{selectedArtist.genre}</div>
                <p style={{ color: 'var(--gray)', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '20px' }}>{selectedArtist.bio}</p>
                
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Discography</h4>
                <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
                  {selectedArtist.releases.map((rel, rIdx) => (
                    <li key={rIdx} style={{ fontSize: '13px', color: 'var(--white)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-compact-disc" style={{ color: 'var(--yellow)', fontSize: '12px' }}></i> {rel}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <a href="#spotify" className="btn btn-outline" style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}>
                  <i className="fa-brands fa-spotify" style={{ marginRight: '6px', color: '#1DB954' }}></i> Spotify
                </a>
                <a href="#apple" className="btn btn-outline" style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}>
                  <i className="fa-brands fa-apple" style={{ marginRight: '6px', color: '#FC3C44' }}></i> Apple
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
