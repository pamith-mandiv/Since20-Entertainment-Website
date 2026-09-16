import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      {/* HEADER HERO */}
      <section className="container" style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span className="label-tag" style={{ display: 'inline-block', fontSize: '12px', letterSpacing: '3px', color: 'var(--yellow)', fontWeight: '600', marginBottom: '14px' }}>ABOUT US</span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', marginBottom: '20px' }}>Empowering Music Careers</h1>
        <p style={{ color: 'var(--gray)', fontSize: '18px', maxWidth: '720px', margin: '0 auto', lineHeight: '1.7' }}>
          SINCE’20 Entertainments is a Sri Lanka–based music distribution and artist development platform dedicated to helping artists grow their music careers to the next level.
        </p>
      </section>

      {/* STORY & VISUAL GRID */}
      <section className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'center', marginBottom: '100px' }}>
        <div>
          <h2 style={{ fontSize: '30px', fontWeight: '700', marginBottom: '20px' }}>The SINCE'20 Story</h2>
          <p style={{ color: 'var(--gray)', marginBottom: '16px', fontSize: '15.5px', lineHeight: '1.7' }}>
            We support independent and emerging musicians by distributing their music worldwide, promoting their work, and building their brand presence in the industry. Our goal is to turn raw talent into successful music careers through guidance, exposure, and consistent support.
          </p>
          <p style={{ color: 'var(--gray)', marginBottom: '16px', fontSize: '15.5px', lineHeight: '1.7' }}>
            Since our genesis in 2020, we have helped independent musicians navigate complex catalog deliveries, optimize release metadata, and manage royalty channels. Today, we handle catalog logistics for hundreds of Sri Lankan and global artists, providing direct conduits to Spotify, Apple Music, YouTube, and TikTok.
          </p>
          <p style={{ color: 'var(--gray)', fontSize: '15.5px', lineHeight: '1.7' }}>
            We provide local and global independent musicians the exact same opportunities as signed artists. By letting our artists retain full catalog rights and keeping 90% of streaming royalties, we build a fairer, more sustainable digital music landscape.
          </p>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="SINCE'20 Logo"
            style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 20px', filter: 'drop-shadow(0 0 15px rgba(255,212,0,.2))' }}
          />
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '14px' }}>Sri Lankan Roots, Global Reach</h3>
          <p style={{ color: 'var(--gray)', fontSize: '14.5px', lineHeight: '1.6' }}>
            "We build localized artist support. No matter your genre or origin, we offer direct consultation, free creative artwork layouts, and platform integrations so your catalog is release-ready."
          </p>
          <div style={{ marginTop: '24px', fontWeight: '700', color: 'var(--yellow)' }}>— SINCE'20 team</div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section style={{ background: '#020202', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 0', marginBottom: '100px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div className="glass-card">
            <i className="fa-solid fa-bullseye" style={{ fontSize: '30px', color: 'var(--yellow)', marginBottom: '16px' }}></i>
            <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '10px' }}>Our Mission</h3>
            <p style={{ color: 'var(--gray)', fontSize: '14.5px', lineHeight: '1.6' }}>
              To distribute, manage, and accelerate music careers for independent creators by offering clean metadata packaging, transparent royalty accounting, and direct catalog delivery tools.
            </p>
          </div>
          <div className="glass-card">
            <i className="fa-solid fa-eye" style={{ fontSize: '30px', color: 'var(--yellow)', marginBottom: '16px' }}></i>
            <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '10px' }}>Our Vision</h3>
            <p style={{ color: 'var(--gray)', fontSize: '14.5px', lineHeight: '1.6' }}>
              To serve as the primary catalyst for emerging musical talent in Sri Lanka, developing independent acts from local bedroom releases to globally recognized streaming profiles.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
