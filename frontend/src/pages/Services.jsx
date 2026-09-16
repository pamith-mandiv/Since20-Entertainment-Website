export default function Services() {
  const coreServices = [
    {
      title: 'Global Distribution',
      icon: 'fa-globe',
      desc: 'Deliver your catalog to over 150 digital platforms globally including Spotify, Apple Music, TikTok, Amazon Music, YouTube, and Shazam. We manage the audio files, metadata, and storefront links for you.',
      isSquare: true // SQUARE card rule enforced
    },
    {
      title: 'Royalty Payments',
      icon: 'fa-sack-dollar',
      desc: 'Transparent revenue mapping. Keep 90% of your royalty shares across streams and sales. We aggregate reports monthly with quick, hassle-free bank payouts straight to your local accounts.',
      isSquare: false
    },
    {
      title: 'Rights Management',
      icon: 'fa-shield-halved',
      desc: 'Protect your recordings and music sheets. We coordinate YouTube Content ID registration, claim control, and copyright administration to prevent unauthorized tracks uploads.',
      isSquare: false
    },
    {
      title: 'Analytics & Insights',
      icon: 'fa-chart-line',
      desc: 'Understand your audience. Access real-time listeners demographics, stream counters, geo locations, and playlists additions to measure the performance of your releases.',
      isSquare: false
    },
    {
      title: 'Marketing & Promotion',
      icon: 'fa-bullhorn',
      desc: 'Playlist pitching to editorial curators, smartlink generation, presave campaigns setup, and social media media asset support to build momentum for your catalog releases.',
      isSquare: false
    },
    {
      title: 'Dedicated Support',
      icon: 'fa-headset',
      desc: 'Real help from real people. Our technical review team guides you through metadata guidelines, album cover checks, and platform delivery processes, resolving tickets in under 24 hours.',
      isSquare: false
    }
  ];

  const extraServices = [
    { title: 'Free Creative Design', icon: 'fa-palette', desc: 'Every release includes professional assistance for designing album covers and promo posters so your visual assets match the high quality of your sounds.' },
    { title: 'Channel Management', icon: 'fa-tower-broadcast', desc: 'We help set up and claim your Official Artist Channels on YouTube and manage streaming platform profile verification across Spotify and Apple Music.' },
    { title: 'Artist PR & Branding', icon: 'fa-newspaper', desc: 'Build your public profile. We assist in writing biography packets, press releases, and coordinate placement opportunities in local music media publications.' },
    { title: 'Contract Handling', icon: 'fa-file-signature', desc: 'Secure licensing agreement formats drafted and managed on your behalf. Keep ownership of your master recordings while delegating administration issues.' }
  ];

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      {/* PAGE HEADER */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="label-tag" style={{ display: 'inline-block', fontSize: '12px', letterSpacing: '3px', color: 'var(--yellow)', fontWeight: '600', marginBottom: '14px' }}>SERVICES</span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', marginBottom: '20px' }}>Complete Music Logistics</h1>
        <p style={{ color: 'var(--gray)', fontSize: '18px', maxWidth: '680px', margin: '0 auto' }}>
          From audio files delivery to revenue accounting and visual design support, we cover all administration requirements for independent artists.
        </p>
      </section>

      {/* CORE SERVICES GRID */}
      <section className="container" style={{ marginBottom: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Everything you need to release globally</h2>
        </div>
        <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {coreServices.map((s, idx) => (
            <div 
              key={idx} 
              className={`glass-card ${s.isSquare ? 'square-card' : ''}`}
              style={{
                borderRadius: s.isSquare ? '0px' : '16px', // SQUARE card rule explicitly enforced
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div className="service-icon" style={{ 
                  width: '54px', height: '54px', borderRadius: s.isSquare ? '0px' : '14px', 
                  background: 'rgba(255,212,0,.1)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', marginBottom: '22px' 
                }}>
                  <i className={`fa-solid ${s.icon}`} style={{ fontSize: '22px', color: 'var(--yellow)' }}></i>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
                  {s.title} {s.isSquare && <span style={{ fontSize: '11px', background: 'rgba(255,212,0,0.15)', color: 'var(--yellow)', padding: '2px 8px', marginLeft: '6px', fontWeight: '700', textTransform: 'uppercase' }}>Featured</span>}
                </h3>
                <p style={{ color: 'var(--gray)', fontSize: '14px', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ADDITIONAL BENEFITS */}
      <section style={{ background: '#020202', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="label-tag">ADDED VALUES</span>
            <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Included at no extra cost</h2>
            <p style={{ color: 'var(--gray)', marginTop: '10px' }}>We invest in our creators. All roster members receive catalog design and PR assistance.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
            {extraServices.map((e, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '20px', background: 'var(--card)', border: '1px solid var(--border)', padding: '30px', borderRadius: '12px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,212,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <i className={`fa-solid ${e.icon}`} style={{ color: 'var(--yellow)', fontSize: '18px' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px' }}>{e.title}</h3>
                  <p style={{ color: 'var(--gray)', fontSize: '13.5px', lineHeight: '1.5' }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
