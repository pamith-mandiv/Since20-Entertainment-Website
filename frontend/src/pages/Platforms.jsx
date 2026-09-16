import { useState } from 'react';

export default function Platforms() {
  const [search, setSearch] = useState('');

  const sections = [
    {
      title: 'Streaming Services',
      desc: 'We connect your catalog to general and specialized audio streaming channels globally.',
      chips: [
        'Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Deezer', 'Tidal',
        'SoundCloud', 'Pandora', 'Audiomack', 'Bandcamp', 'Beatport', 'Beatsource', 
        'Traxsource', 'Mixcloud', 'Qobuz', 'LiveOne', 'Trebel', 'Boomplay', 'Anghami', 
        'JioSaavn', 'JOOX', 'KKBox', 'Bugs', 'MELON', 'FLO', 'Juno Download', 'Rythm', 
        'Coda Music', 'Soundtrack Your Brand', 'Lissen', '7Digital', 'Utopia Music', 
        'Octave', 'Music Worx', 'Hungama', 'Xiaomi Music', 'Bonsai', 'Clone.nl'
      ]
    },
    {
      title: 'Social Media & Short Video',
      desc: 'Put your music in stories, reels, and posts where fans can capture clips and share.',
      chips: ['TikTok', 'Instagram', 'Meta / Facebook', 'Snapchat', 'Triller', 'Douyin', 'Twitch', 'Twitch DJ']
    },
    {
      title: 'Video Distribution & Recognition',
      desc: 'Official music video hosting and digital fingerprint tracking platforms.',
      chips: ['VEVO', 'XITE', 'Shazam', 'ACRCloud', 'Gracenote', 'BMAT', 'Audible Magic', 'SoundExchange', 'Musical AI', 'Jaxsta', 'DISCO']
    },
    {
      title: 'Asia–Pacific',
      desc: 'Dedicated regional networks reaching listeners across China, Japan, Korea, and Southeast Asia.',
      chips: [
        'QQ Music', 'KuGou', 'Kuwo', 'WeSing', 'NetEase Cloud Music', 'AliMusic', 'Huawei Music', 
        'Migu Music', 'iMUSIC', 'Qishui Music', 'MOOV', 'AWA', 'Kan Music', 'Kuaishou', 
        'U-Mobile', 'Celcom', 'Digi', 'NovelFM', 'Nuuday / YouSee'
      ]
    },
    {
      title: 'Africa & Emerging Markets',
      desc: 'Mobile-first platforms and telecomm carriers driving streams in emerging markets.',
      chips: ['Boomplay', 'Muska', 'Airtel Nigeria', 'Safaricom', 'MTN Nigeria', 'AMI Entertainment', 'd\'Music', 'Claro Música']
    },
    {
      title: 'Radio, Fitness & Specialty',
      desc: 'Gyms networks, connected jukeboxes, and digital radio syndicators.',
      chips: ['iHeartRadio', 'Peloton', 'TouchTunes', 'Mood Media', 'Pretzel', 'USEA', 'Volumo', 'SoStereo', 'ClicknClear', 'Mix Upload', 'Medianet', 'Securus']
    }
  ];

  // Filter sections by search text
  const filteredSections = sections.map(sec => {
    const matchingChips = sec.chips.filter(c => c.toLowerCase().includes(search.toLowerCase()));
    return { ...sec, chips: matchingChips };
  }).filter(sec => sec.chips.length > 0);

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      {/* PAGE HEADER */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="label-tag" style={{ display: 'inline-block', fontSize: '12px', letterSpacing: '3px', color: 'var(--yellow)', fontWeight: '600', marginBottom: '14px' }}>PLATFORMS</span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', marginBottom: '20px' }}>Our Distribution Network</h1>
        <p style={{ color: 'var(--gray)', fontSize: '18px', maxWidth: '680px', margin: '0 auto 40px' }}>
          We place your tracks on every major storefront and local streaming ecosystem, covering 150+ countries.
        </p>

        {/* SEARCH BOX */}
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '18px', top: '16px', color: 'var(--gray)' }}></i>
          <input 
            type="text" 
            placeholder="Search platform name (e.g. Spotify, Shazam, Boomplay)..." 
            className="field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '48px', marginBottom: '0' }}
          />
        </div>
      </section>

      {/* RENDER CHIP CATEGORIES */}
      <section className="container">
        {filteredSections.length > 0 ? (
          filteredSections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: '60px', borderBottom: idx !== filteredSections.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '40px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{sec.title}</h3>
              <p style={{ color: 'var(--gray)', fontSize: '14.5px', marginBottom: '22px', maxWidth: '680px' }}>{sec.desc}</p>
              <div className="chip-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {sec.chips.map((chip, cIdx) => (
                  <span key={cIdx} className="chip" style={{
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50px',
                    padding: '8px 18px', fontSize: '13.5px', color: 'var(--white)', transition: '.3s',
                    cursor: 'default'
                  }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="fa-solid fa-face-frown" style={{ fontSize: '38px', color: 'var(--gray2)', marginBottom: '16px' }}></i>
            <h3 style={{ color: 'var(--gray)' }}>No matching platforms found.</h3>
            <p style={{ color: 'var(--gray2)', fontSize: '14px', marginTop: '6px' }}>Try searching a different platform name.</p>
          </div>
        )}
      </section>
    </div>
  );
}
