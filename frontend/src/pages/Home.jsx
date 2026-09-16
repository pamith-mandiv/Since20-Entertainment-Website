import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const particleCount = 25;
    const symbols = ['𝄞', '𝄢', '♩', '𝅘𝅥𝅯', '♫', '♬'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        fontSize: Math.floor(Math.random() * 14) + 14,
        speedX: Math.random() * 0.3 - 0.15,
        speedY: Math.random() * 0.3 - 0.15,
        alpha: Math.random() * 0.3 + 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: Math.random() * 0.01 - 0.005
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouse = { x: null, y: null, radius: 140 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };
    if (canvas.parentElement) {
      canvas.parentElement.addEventListener('mousemove', handleMouseMove);
      canvas.parentElement.addEventListener('mouseleave', handleMouseLeave);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 212, 0, 0.01)';
      const time = Date.now() * 0.0008;
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 10) {
        const y = height - 90 + Math.sin(x * 0.0025 + time) * 25 + Math.cos(x * 0.001 + time * 1.3) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x -= dx * force * 0.02;
            p.y -= dy * force * 0.02;
          }
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.fontSize}px serif`;
        ctx.fillStyle = `rgba(255, 212, 0, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(255, 212, 0, 0.3)';
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      });
      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (canvas && canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
        canvas.parentElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const marqueePlatforms = [
    { name: 'Spotify', icon: 'fa-brands fa-spotify' },
    { name: 'Apple Music', icon: 'fa-brands fa-apple' },
    { name: 'YouTube Music', icon: 'fa-brands fa-youtube' },
    { name: 'TikTok', icon: 'fa-brands fa-tiktok' },
    { name: 'Amazon Music', icon: 'fa-brands fa-amazon' },
    { name: 'SoundCloud', icon: 'fa-brands fa-soundcloud' },
    { name: 'Deezer', icon: 'fa-solid fa-music' },
    { name: 'Tidal', icon: 'fa-solid fa-music' },
    { name: 'Shazam', icon: 'fa-solid fa-music' },
    { name: 'Pandora', icon: 'fa-brands fa-snapchat' },
    { name: 'Audiomack', icon: 'fa-solid fa-music' },
    { name: 'Bandcamp', icon: 'fa-brands fa-bandcamp' }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* HERO SECTION */}
      <section
        className="hero"
        style={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'clamp(120px, 15vw, 140px) 20px 80px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
        <div className="blob blob1" style={{ position: 'absolute', width: 'min(480px, 70vw)', height: 'min(480px, 70vw)', background: 'radial-gradient(circle, rgba(255,212,0,0.18), transparent 70%)', top: '-100px', left: '-100px', borderRadius: '50%', filter: 'blur(80px)', animation: 'floatBlob 12s infinite ease-in-out', zIndex: 0 }}></div>
        <div className="blob blob2" style={{ position: 'absolute', width: 'min(420px, 60vw)', height: 'min(420px, 60vw)', background: 'radial-gradient(circle, rgba(255,212,0,0.08), transparent 70%)', bottom: '-150px', right: '-80px', borderRadius: '50%', filter: 'blur(80px)', animation: 'floatBlob 16s infinite ease-in-out reverse', zIndex: 0 }}></div>

        <div className="hero-content" style={{ position: 'relative', zIndex: 2, maxWidth: '880px', width: '100%' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '50px', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '13px', color: 'var(--gray)', marginBottom: '28px' }}>
            Global Music Distribution, Since 2020
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 6.5vw, 72px)', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-1.5px' }}>
            Your Music Deserves<br />
            <span style={{ background: 'linear-gradient(90deg, var(--yellow), #fff6cc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>The World Stage.</span>
          </h1>
          <p className="lead" style={{ margin: '26px auto 0', maxWidth: '560px', color: 'var(--gray)', fontSize: 'clamp(15px, 2vw, 17px)', padding: '0 10px' }}>
            We help artists and labels release music globally, manage rights, and get paid fast — all from one platform built for independent creators.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap', padding: '0 20px' }}>
            <Link to="/contact" className="btn btn-primary" style={{ minWidth: '160px' }}>Start Distributing</Link>
            <Link to="/services" className="btn btn-outline" style={{ minWidth: '160px' }}>Explore Services</Link>
          </div>
        </div>
      </section>

      {/* PLATFORMS MARQUEE */}
      <section className="marquee-section" style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="marquee-label" style={{ textAlign: 'center', fontSize: '11px', letterSpacing: '3px', color: 'var(--gray2)', marginBottom: '24px' }}>
          DISTRIBUTING TO EVERY MAJOR PLATFORM
        </div>
        <div className="marquee-wrap" style={{ overflow: 'hidden', position: 'relative' }}>
          <div className="marquee-track" style={{ display: 'flex', gap: '64px', width: 'max-content', animation: 'scrollX 90s linear infinite' }}>
            {marqueePlatforms.map((plat, idx) => (
              <span key={idx} className="platform" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                <i className={`${plat.icon}`} style={{ fontSize: '24px', color: 'var(--white)' }}></i>
                {plat.name}
              </span>
            ))}
            {marqueePlatforms.map((plat, idx) => (
              <span key={`dup-${idx}`} className="platform" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                <i className={`${plat.icon}`} style={{ fontSize: '24px', color: 'var(--white)' }}></i>
                {plat.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section className="about" style={{ padding: 'clamp(60px,8vw,120px) 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(30px,5vw,80px)', alignItems: 'center' }}>
          <div>
            <span className="label-tag">WHO WE ARE</span>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: '700', marginBottom: '22px', lineHeight: '1.3' }}>Help artists grow their music careers to the next level.</h2>
            <p style={{ color: 'var(--gray)', fontSize: '16px', marginBottom: '18px', lineHeight: '1.7' }}>
              <strong>SINCE'20 Entertainments</strong> is a Sri Lanka–based music distribution and artist development platform dedicated to helping artists grow their music careers to the next level.
            </p>
            <p style={{ color: 'var(--gray)', fontSize: '16px', marginBottom: '28px', lineHeight: '1.7' }}>
              We support independent and emerging musicians by distributing their music worldwide, promoting their work, and building their brand presence in the industry.
            </p>
            <Link to="/about" className="btn btn-primary"><i className="fa-solid fa-arrow-right"></i> Read Our Story</Link>
          </div>
          <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '28px', background: 'linear-gradient(160deg, #121212, #030303)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <div className="ring" style={{ position: 'absolute', width: '70%', height: '70%', border: '2px dashed rgba(255,212,0,.2)', borderRadius: '50%', animation: 'spin 35s linear infinite' }}></div>
            <div className="ring2" style={{ position: 'absolute', width: '50%', height: '50%', border: '1px solid rgba(255,255,255,.1)', borderRadius: '50%', animation: 'spin 25s linear infinite reverse' }}></div>
            <img src="/logo.png" alt="SINCE'20 Logo" style={{ height: 'min(160px, 40%)', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(255,212,0,.3))' }} />
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="services" style={{ padding: 'clamp(50px,6vw,80px) 0', background: '#020202', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-head" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 60px' }}>
            <span className="label-tag">WHAT WE OFFER</span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: '700', marginTop: '12px' }}>Everything your release needs</h2>
            <p style={{ color: 'var(--gray)', marginTop: '14px' }}>From global uploads to royalty payouts, we handle the logistics so you can write the hits.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {[
              { icon: 'fa-chart-line', title: 'Analytics & Insights', desc: 'Understand your audience. Access real-time listener demographics, stream counters, geo locations, and playlist additions to measure the performance of your releases.' },
              { icon: 'fa-bullhorn', title: 'Marketing & Promotion', desc: 'Playlist pitching to editorial curators, smartlink generation, presave campaigns, and social media asset support to build momentum for your catalog releases.' },
              { icon: 'fa-headset', title: 'Dedicated Support', desc: 'Real help from real people. Our technical review team guides you through metadata guidelines, album cover checks, and platform delivery processes — tickets resolved in under 24 hours.' }
            ].map((s, i) => (
              <div key={i} className="glass-card">
                <div className="service-icon" style={{ width: '50px', height: '50px', background: 'rgba(255,212,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '20px' }}>
                  <i className={`fa-solid ${s.icon}`} style={{ color: 'var(--yellow)', fontSize: '20px' }}></i>
                </div>
                <h3>{s.title}</h3>
                <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '8px', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/services" className="btn btn-outline">Explore Other Services</Link>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: 'clamp(50px,6vw,80px) 0', background: 'linear-gradient(135deg, rgba(255,212,0,0.08), transparent 80%)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: '800' }}>Ready to distribute your sound?</h2>
          <p style={{ color: 'var(--gray)', margin: '16px auto 32px', maxWidth: '560px', padding: '0 10px' }}>
            Join a growing roster of independent artists getting heard on global platforms. Registration is quick and approval is fast.
          </p>
          <Link to="/contact" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
