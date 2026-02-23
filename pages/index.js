import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/Layout';

const FEATURES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
      </svg>
    ),
    color: 'blue',
    title: 'Advanced Analytics',
    desc: 'Our AI continuously analyzes your health metrics and dietary patterns to identify trends.',
    bullets: ['Data-driven insights', 'Progress tracking', 'Personalized reports'],
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
    color: 'purple',
    title: 'Personalized Diet Plans',
    desc: 'Get a diet plan tailored to your unique health metrics, diabetes, or blood pressure needs.',
    bullets: ['1–30 day custom plans', 'Nutritional balance', 'Adaptable recommendations'],
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
      </svg>
    ),
    color: 'teal',
    title: 'AI Diet Assistant',
    desc: 'Chat with our clinical AI for real-time nutrition tips and evidence-based guidance.',
    bullets: ['24/7 Nutrition advice', 'Medical document analysis', 'Health goal tracking'],
  },
];

const FAQS = [
  { q: 'How does the AI create my diet plan?', a: 'Our AI analyzes your BMI, health metrics, dietary preferences, and goals to generate a personalized nutrition plan optimized for your specific needs.' },
  { q: 'Can I customize my diet plan?', a: 'Yes! You can specify dietary preferences, food allergies, and specific foods you want to include or exclude. The AI adapts your plan while maintaining nutritional balance.' },
  { q: 'How often should I update my health metrics?', a: 'For best results, update your health metrics weekly. This allows our AI to track your progress and adjust your diet plan accordingly.' },
  { q: 'Is my health data secure and private?', a: 'Absolutely. All your health data is encrypted, stored securely, and never shared with third parties. You maintain full control over your information.' },
];

const COLOR_MAP = {
  blue: { bg: '#eff6ff', icon: '#2563eb', ring: '#bfdbfe' },
  purple: { bg: '#faf5ff', icon: '#7c3aed', ring: '#ddd6fe' },
  teal: { bg: '#f0fdfa', icon: '#0d9488', ring: '#99f6e4' },
};

export default function Home() {
  const { isLoggedIn, userName } = useAuth();

  return (
    <Layout>
      <Head>
        <title>DiaBP Diet Consultant | Your Personal Health Assistant</title>
        <meta name="description" content="AI-powered diet consultation and health tracking for personalized nutrition recommendations" />
      </Head>

      <div>
        {/* ── Hero ── */}
        <section className="hero-section">
          <div className="hero-bg">
            <div className="hero-bg-grid" />
            <div className="hero-blob hero-blob-1" />
            <div className="hero-blob hero-blob-2" />
          </div>

          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                AI-Powered Clinical Nutrition
              </div>
              <h1 className="hero-title">
                Smart Diet Solutions<br />
                <span className="hero-gradient-text">For Better Health</span>
              </h1>
              <p className="hero-desc">
                Personalized nutrition plans, BMI tracking, and expert AI guidance — designed specifically
                for diabetes and blood pressure patients.
              </p>
              <div className="hero-cta">
                {!isLoggedIn ? (
                  <>
                    <Link href="/signup" className="hero-btn-primary">Get Started Free →</Link>
                    <Link href="/login" className="hero-btn-ghost">Sign In</Link>
                  </>
                ) : (
                  "Features"
                )}
              </div>
              <div className="hero-stats">
                {[
                  { value: '1–30', label: 'Day Diet Plans' },
                  { value: 'AI', label: 'Evidence-Based' },
                  { value: '100%', label: 'Secure & Private' },
                ].map(s => (
                  <div key={s.label} className="hero-stat">
                    <span className="hero-stat-value">{s.value}</span>
                    <span className="hero-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock dashboard card */}
            <div className="hero-card-wrap">
              <div className="hero-rotate-bg" />
              <div className="hero-card">
                <div className="hero-card-bar">
                  <div className="hero-dots">
                    <span style={{ background: '#f87171' }} /><span style={{ background: '#fbbf24' }} /><span style={{ background: '#4ade80' }} />
                  </div>
                  <span className="hero-card-label">DiaBP AI Analysis</span>
                  <div style={{ width: 64 }} />
                </div>
                <img
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800"
                  alt="Healthy nutrition"
                  className="hero-card-img"
                />
                <div className="hero-card-body">
                  <div className="hero-card-avatar">
                    <div className="hero-avatar-circle">AI</div>
                    <div>
                      <div className="hero-avatar-name">DiaBP Assistant</div>
                      <div className="hero-avatar-time">Just now</div>
                    </div>
                  </div>
                  <div className="hero-card-message">
                    Based on your profile, I recommend a balanced diet with 30% protein, 45% complex carbs, and 25% healthy fats to support your blood pressure management.
                  </div>
                  <div className="hero-card-footer">
                    <span className="hero-card-link">View full analysis →</span>
                    <span className="hero-card-badge"><span className="hero-green-dot" />AI-generated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logged-in dashboard links ── */}
        {isLoggedIn && (
          <section className="dash-section">
            <div className="section-inner">
              <div className="section-label">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Welcome back, {userName}!
              </div>
              <h2 className="section-title">Your Health Dashboard</h2>
              <p className="section-subtitle">Access all your health tools and track your progress.</p>

              <div className="dash-grid">
                {[
                  { href: '/bmi', emoji: '📊', label: 'BMI Calculator', desc: 'Calculate BMI & understand your weight category', color: '#2563eb', bg: '#eff6ff' },
                  { href: '/diet-plan', emoji: '🥗', label: 'Diet Plan', desc: 'Get AI-powered meal plans tailored to your needs', color: '#7c3aed', bg: '#faf5ff' },
                  { href: '/records', emoji: '🏥', label: 'Health Records', desc: 'Track your health metrics and monitor progress', color: '#0d9488', bg: '#f0fdfa' },
                ].map(card => (
                  <Link key={card.href} href={card.href} className="dash-card" style={{ '--card-color': card.color, '--card-bg': card.bg }}>
                    <div className="dash-card-icon" style={{ background: card.bg, color: card.color }}>{card.emoji}</div>
                    <h3 className="dash-card-title">{card.label}</h3>
                    <p className="dash-card-desc">{card.desc}</p>
                    <span className="dash-card-arrow">→</span>
                  </Link>
                ))}
              </div>

              <div className="cta-banner">
                <div className="cta-text">
                  <h3>Ready to improve your health?</h3>
                  <p>Start by calculating your BMI to get a personalized diet plan.</p>
                </div>
                <Link href="/bmi" className="cta-btn">Calculate BMI Now →</Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Features (guest view) ── */}
        {!isLoggedIn && (
          <>
            <section className="features-section">
              <div className="section-inner">
                <div className="text-center" style={{ marginBottom: '3rem' }}>
                  <div className="section-label" style={{ justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Powered by Clinical AI
                  </div>
                  <h2 className="section-title" style={{ textAlign: 'center' }}>Everything You Need for Better Health</h2>
                  <p className="section-subtitle" style={{ textAlign: 'center' }}>Advanced AI analyzes your health metrics for personalized nutrition guidance</p>
                </div>

                <div className="features-grid">
                  {FEATURES.map(f => {
                    const c = COLOR_MAP[f.color];
                    return (
                      <div key={f.title} className="feature-card">
                        <div className="feature-card-icon" style={{ background: c.bg, color: c.icon, boxShadow: `0 0 0 6px ${c.ring}50` }}>
                          {f.icon}
                        </div>
                        <h3 className="feature-card-title">{f.title}</h3>
                        <p className="feature-card-desc">{f.desc}</p>
                        <ul className="feature-bullets">
                          {f.bullets.map(b => (
                            <li key={b} className="feature-bullet" style={{ color: c.icon }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ flexShrink: 0 }}>
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                              </svg>
                              <span style={{ color: '#4b5563' }}>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="features-cta">
                  <Link href="/signup" className="hero-btn-primary">Start Your Free Journey →</Link>
                  <Link href="/login" className="hero-btn-ghost">Already a member? Sign in</Link>
                </div>
              </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="testimonials-section">
              <div className="section-inner">
                <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Patient Success Stories
                </div>
                <h2 className="section-title" style={{ textAlign: 'center' }}>What Our Patients Say</h2>

                <div className="testimonials-grid">
                  {[
                    { quote: '"This app helped me understand my dietary needs for managing blood pressure. I\'ve never felt better and my doctor is impressed with my progress!"', name: 'Sarah J.', role: 'Hypertension Patient', initial: 'S', color: '#2563eb' },
                    { quote: '"The AI diet plans are incredibly detailed. As a diabetic, I need precise carb management — DiaBP does this perfectly and explains exactly why."', name: 'Michael T.', role: 'Type 2 Diabetes Patient', initial: 'M', color: '#7c3aed' },
                    { quote: '"I uploaded my blood test reports and the chatbot analyzed them and gave me specific food recommendations. Absolutely amazing tool!"', name: 'Fatima A.', role: 'DiaBP User', initial: 'F', color: '#0d9488' },
                  ].map(t => (
                    <div key={t.name} className="testimonial-card">
                      <div className="testimonial-stars">{'★★★★★'}</div>
                      <p className="testimonial-quote">{t.quote}</p>
                      <div className="testimonial-author">
                        <div className="testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}>{t.initial}</div>
                        <div>
                          <div className="testimonial-name">{t.name}</div>
                          <div className="testimonial-role">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className="faq-section">
              <div className="section-inner">
                <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Common Questions
                </div>
                <h2 className="section-title" style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
                <div className="faq-grid">
                  {FAQS.map(faq => (
                    <div key={faq.q} className="faq-card">
                      <h3 className="faq-q">{faq.q}</h3>
                      <p className="faq-a">{faq.a}</p>
                    </div>
                  ))}
                </div>
                <div className="faq-cta">
                  <p>Ready to take control of your health?</p>
                  <Link href="/signup" className="hero-btn-primary">Get Started Free Today →</Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        /* ── Shared ── */
        .section-inner { max-width:1200px; margin:0 auto; padding:0 1.5rem; }
        .section-label {
          display:inline-flex; align-items:center; gap:0.4rem;
          font-size:0.8rem; font-weight:600; color:#2563eb;
          background:#eff6ff; border:1px solid #bfdbfe;
          border-radius:99px; padding:0.3rem 0.875rem;
          margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.04em;
        }
        .section-title { font-size:2rem; font-weight:800; color:#111827; letter-spacing:-0.025em; margin-bottom:0.75rem; }
        .section-subtitle { font-size:1.05rem; color:#6b7280; max-width:620px; line-height:1.6; }

        /* ── Hero ── */
        .hero-section { position:relative; padding:5rem 1.5rem; overflow:hidden; }
        .hero-bg { position:absolute; inset:0; background:linear-gradient(135deg,#1e3a8a 0%,#4338ca 50%,#6d28d9 100%); }
        .hero-bg-grid { position:absolute; inset:0; background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.04)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e"); }
        .hero-blob { position:absolute; border-radius:50%; filter:blur(80px); }
        .hero-blob-1 { width:500px; height:500px; top:-100px; left:-50px; background:rgba(96,165,250,0.2); }
        .hero-blob-2 { width:400px; height:400px; bottom:-80px; right:-60px; background:rgba(167,139,250,0.2); }
        .hero-content { position:relative; z-index:10; max-width:1200px; margin:0 auto; display:flex; align-items:center; gap:4rem; }
        .hero-text { flex:1; }

        .hero-badge {
          display:inline-flex; align-items:center; gap:0.5rem;
          background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
          border-radius:99px; padding:0.4rem 1rem;
          font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.9);
          margin-bottom:1.5rem; backdrop-filter:blur(8px);
        }
        .hero-badge-dot { width:7px; height:7px; border-radius:50%; background:#4ade80; box-shadow:0 0 8px #4ade80; animation:blinkDot 2s ease-in-out infinite; }
        @keyframes blinkDot { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .hero-title { font-size:3.25rem; font-weight:900; color:white; line-height:1.1; letter-spacing:-0.03em; margin-bottom:1.25rem; }
        .hero-gradient-text { background:linear-gradient(135deg,#93c5fd,#c4b5fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .hero-desc { font-size:1.1rem; color:rgba(255,255,255,0.8); line-height:1.7; max-width:480px; margin-bottom:2rem; }

        .hero-cta { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:2.5rem; }
        .hero-btn-primary {
          display:inline-flex; align-items:center; gap:0.5rem;
          padding:0.875rem 1.75rem; background:white; color:#1e3a8a;
          font-size:0.9rem; font-weight:700; border-radius:10px; text-decoration:none;
          box-shadow:0 4px 16px rgba(0,0,0,0.15); transition:all 0.2s;
        }
        .hero-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.2); }
        .hero-btn-ghost {
          display:inline-flex; align-items:center;
          padding:0.875rem 1.75rem; background:rgba(255,255,255,0.1); color:white;
          font-size:0.9rem; font-weight:600; border-radius:10px; text-decoration:none;
          border:1px solid rgba(255,255,255,0.2); transition:all 0.2s;
        }
        .hero-btn-ghost:hover { background:rgba(255,255,255,0.18); }

        .hero-stats { display:flex; gap:2rem; }
        .hero-stat { text-align:center; }
        .hero-stat-value { display:block; font-size:1.5rem; font-weight:900; color:white; }
        .hero-stat-label { font-size:0.75rem; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:0.06em; }

        /* Hero card */
        .hero-card-wrap { flex:1; position:relative; max-width:460px; }
        .hero-rotate-bg { position:absolute; inset:0; background:rgba(255,255,255,0.1); border-radius:24px; transform:rotate(3deg) scale(1.03); }
        .hero-card { position:relative; background:rgba(255,255,255,0.97); border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.3); }
        .hero-card-bar { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#1e3a8a,#4338ca); padding:0.875rem 1.25rem; }
        .hero-dots { display:flex; gap:0.35rem; }
        .hero-dots span { width:11px; height:11px; border-radius:50%; }
        .hero-card-label { font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.9); }
        .hero-card-img { width:100%; height:200px; object-fit:cover; }
        .hero-card-body { padding:1.25rem; }
        .hero-card-avatar { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.875rem; }
        .hero-avatar-circle { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#10b981,#2563eb); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; color:white; flex-shrink:0; }
        .hero-avatar-name { font-weight:600; font-size:0.9rem; color:#111827; }
        .hero-avatar-time { font-size:0.75rem; color:#9ca3af; }
        .hero-card-message { background:#f9fafb; border-radius:10px; padding:0.875rem; font-size:0.85rem; color:#374151; line-height:1.6; margin-bottom:0.875rem; }
        .hero-card-footer { display:flex; justify-content:space-between; align-items:center; }
        .hero-card-link { font-size:0.8rem; font-weight:600; color:#2563eb; }
        .hero-card-badge { display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; color:#6b7280; }
        .hero-green-dot { width:7px; height:7px; border-radius:50%; background:#10b981; }

        /* ── Logged-in dashboard ── */
        .dash-section { padding:4rem 0; }
        .dash-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; margin-bottom:2rem; margin-top:2rem; }
        .dash-card {
          background:white; border-radius:16px; border:1.5px solid #e5e7eb;
          padding:1.75rem; text-decoration:none; display:flex; flex-direction:column; gap:0.5rem;
          box-shadow:0 4px 16px rgba(0,0,0,0.05);
          transition:all 0.25s;
          position:relative; overflow:hidden;
        }
        .dash-card::after {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:var(--card-color); opacity:0; transition:opacity 0.2s;
        }
        .dash-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.1); border-color:var(--card-color)30; }
        .dash-card:hover::after { opacity:1; }
        .dash-card-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; margin-bottom:0.25rem; }
        .dash-card-title { font-size:1.1rem; font-weight:700; color:#111827; }
        .dash-card-desc { font-size:0.85rem; color:#6b7280; line-height:1.5; flex:1; }
        .dash-card-arrow { font-size:1.1rem; color:var(--card-color); font-weight:700; }
        .cta-banner { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#eff6ff,#e0e7ff); border:1px solid #c7d2fe; border-radius:16px; padding:1.5rem 2rem; }
        .cta-text h3 { font-weight:700; color:#1e3a8a; margin-bottom:0.25rem; }
        .cta-text p { font-size:0.875rem; color:#4b5563; }
        .cta-btn { background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; padding:0.75rem 1.5rem; border-radius:10px; text-decoration:none; font-weight:600; font-size:0.875rem; box-shadow:0 4px 12px rgba(79,70,229,0.3); transition:all 0.2s; white-space:nowrap; }
        .cta-btn:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(79,70,229,0.4); }

        /* ── Features ── */
        .features-section { padding:5rem 0; background:#fafafa; }
        .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; }
        .feature-card { background:white; border-radius:16px; border:1.5px solid #e5e7eb; padding:2rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); transition:all 0.25s; }
        .feature-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.1); border-color:#c7d2fe; }
        .feature-card-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; }
        .feature-card-title { font-size:1.1rem; font-weight:700; color:#111827; margin-bottom:0.5rem; }
        .feature-card-desc { font-size:0.875rem; color:#6b7280; line-height:1.6; margin-bottom:1rem; }
        .feature-bullets { list-style:none; display:flex; flex-direction:column; gap:0.4rem; padding:0; margin:0; }
        .feature-bullet { display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; }
        .features-cta { display:flex; gap:1rem; justify-content:center; margin-top:3rem; flex-wrap:wrap; }
        .features-cta .hero-btn-primary { background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; box-shadow:0 4px 14px rgba(79,70,229,0.35); }
        .features-cta .hero-btn-ghost { color:#374151; background:white; border:1.5px solid #e5e7eb; }

        /* ── Testimonials ── */
        .testimonials-section { padding:5rem 0; background:linear-gradient(135deg,#f0f9ff,#f5f3ff); }
        .testimonials-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; margin-top:2.5rem; }
        .testimonial-card { background:white; border-radius:16px; padding:1.75rem; box-shadow:0 4px 16px rgba(0,0,0,0.05); border:1.5px solid #e5e7eb; transition:all 0.25s; }
        .testimonial-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.08); }
        .testimonial-stars { color:#f59e0b; font-size:1rem; margin-bottom:0.875rem; letter-spacing:2px; }
        .testimonial-quote { font-size:0.875rem; color:#4b5563; line-height:1.7; margin-bottom:1.25rem; font-style:italic; }
        .testimonial-author { display:flex; align-items:center; gap:0.75rem; }
        .testimonial-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.875rem; font-weight:700; color:white; flex-shrink:0; }
        .testimonial-name { font-weight:600; color:#111827; font-size:0.875rem; }
        .testimonial-role { font-size:0.75rem; color:#9ca3af; }

        /* ── FAQ ── */
        .faq-section { padding:5rem 0; }
        .faq-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-top:2.5rem; }
        .faq-card { background:white; border-radius:14px; padding:1.5rem; border:1.5px solid #e5e7eb; box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.2s; }
        .faq-card:hover { border-color:#c7d2fe; box-shadow:0 4px 16px rgba(99,102,241,0.1); }
        .faq-q { font-size:0.975rem; font-weight:700; color:#111827; margin-bottom:0.625rem; }
        .faq-a { font-size:0.875rem; color:#6b7280; line-height:1.65; }
        .faq-cta { text-align:center; margin-top:3rem; }
        .faq-cta p { color:#6b7280; margin-bottom:1rem; }
        .faq-cta .hero-btn-primary { background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; box-shadow:0 4px 14px rgba(79,70,229,0.35); }

        @media (max-width:900px) {
          .hero-content { flex-direction:column; }
          .hero-title { font-size:2.25rem; }
          .features-grid, .testimonials-grid { grid-template-columns:1fr; }
          .faq-grid { grid-template-columns:1fr; }
          .dash-grid { grid-template-columns:1fr; }
          .cta-banner { flex-direction:column; gap:1rem; text-align:center; }
          .hero-card-wrap { max-width:100%; }
        }
      `}</style>
    </Layout>
  );
}