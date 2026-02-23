import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Top row */}
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <div className="footer-logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <div>
                <span className="footer-logo-name">DiaBP</span>
                <span className="footer-logo-sub">Diet Consultant</span>
              </div>
            </Link>
            <p className="footer-tagline">
              AI-powered personalized diet plans and health tracking for diabetes and blood pressure patients.
            </p>
            <div className="footer-socials">
              {/* Facebook */}
              <a href="#" className="social-btn" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              {/* Twitter / X */}
              <a href="#" className="social-btn" aria-label="Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="social-btn" aria-label="LinkedIn">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="footer-col">
            <h4 className="footer-col-title">Features</h4>
            <ul className="footer-links">
              {[
                { href: '/bmi', label: 'BMI Calculator' },
                { href: '/diet-plan', label: 'Diet Plans' },
                { href: '/records', label: 'Health Records' },
                { href: '#', label: 'Nutrition Analysis' },
                { href: '#', label: 'AI Chatbot' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="footer-link">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <ul className="footer-links">
              {['Nutrition Blog', 'Health Tips', 'Recipe Database', 'FAQ', 'API Docs'].map(l => (
                <li key={l}><a href="#" className="footer-link">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <h4 className="footer-col-title">Stay Updated</h4>
            <p className="newsletter-desc">Get nutrition tips and health advice delivered to your inbox.</p>
            <div className="newsletter-badges">
              <span className="badge">🔒 Privacy-first</span>
              <span className="badge">📧 No spam</span>
            </div>
            <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">
                Subscribe
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copy">© {year} DiaBP Diet Consultant. All rights reserved.</p>
          <div className="footer-legal">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#" className="footer-legal-link">{l}</a>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1a1b4b 100%);
          color: white;
          padding-top: 3.5rem;
          padding-bottom: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.8fr;
          gap: 3rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        /* Brand */
        .footer-logo { display:flex; align-items:center; gap:0.625rem; text-decoration:none; margin-bottom:1rem; }
        .footer-logo-icon {
          width:36px; height:36px;
          background:linear-gradient(135deg,#2563eb,#7c3aed);
          border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 10px rgba(99,102,241,0.4);
          flex-shrink:0;
        }
        .footer-logo-name { display:block; font-size:1.2rem; font-weight:800; background:linear-gradient(135deg,#93c5fd,#c4b5fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .footer-logo-sub { display:block; font-size:0.65rem; color:rgba(255,255,255,0.45); text-transform:uppercase; letter-spacing:0.06em; }
        .footer-tagline { font-size:0.875rem; color:rgba(255,255,255,0.55); line-height:1.65; margin-bottom:1.25rem; }
        .footer-socials { display:flex; gap:0.5rem; }
        .social-btn {
          width:34px; height:34px; border-radius:8px;
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1);
          display:flex; align-items:center; justify-content:center;
          color:rgba(255,255,255,0.6); cursor:pointer;
          transition:all 0.15s; text-decoration:none;
        }
        .social-btn:hover { background:rgba(255,255,255,0.15); color:white; transform:translateY(-1px); }

        /* Columns */
        .footer-col-title { font-size:0.78rem; font-weight:700; color:rgba(255,255,255,0.9); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem; }
        .footer-links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem; }
        .footer-link { font-size:0.875rem; color:rgba(255,255,255,0.5); text-decoration:none; transition:color 0.15s; }
        .footer-link:hover { color:rgba(255,255,255,0.9); }

        /* Newsletter */
        .newsletter-desc { font-size:0.85rem; color:rgba(255,255,255,0.55); margin-bottom:0.75rem; line-height:1.5; }
        .newsletter-badges { display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap; }
        .badge { font-size:0.72rem; color:rgba(255,255,255,0.6); background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); border-radius:99px; padding:0.2rem 0.6rem; }
        .newsletter-form { display:flex; flex-direction:column; gap:0.5rem; }
        .newsletter-input {
          width:100%; padding:0.6rem 0.875rem;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
          border-radius:8px; color:white; font-size:0.875rem; outline:none;
          transition:border-color 0.15s;
        }
        .newsletter-input::placeholder { color:rgba(255,255,255,0.35); }
        .newsletter-input:focus { border-color:rgba(99,102,241,0.6); }
        .newsletter-btn {
          display:flex; align-items:center; justify-content:center; gap:0.4rem;
          padding:0.625rem 1rem;
          background:linear-gradient(135deg,#2563eb,#4f46e5);
          color:white; font-size:0.85rem; font-weight:600;
          border:none; border-radius:8px; cursor:pointer;
          transition:all 0.2s; box-shadow:0 3px 10px rgba(79,70,229,0.4);
        }
        .newsletter-btn:hover { box-shadow:0 5px 16px rgba(79,70,229,0.5); transform:translateY(-1px); }

        /* Bottom */
        .footer-bottom {
          display:flex; align-items:center; justify-content:space-between;
          padding:1.25rem 0;
        }
        .footer-copy { font-size:0.78rem; color:rgba(255,255,255,0.35); }
        .footer-legal { display:flex; gap:1.25rem; }
        .footer-legal-link { font-size:0.75rem; color:rgba(255,255,255,0.35); text-decoration:none; transition:color 0.15s; }
        .footer-legal-link:hover { color:rgba(255,255,255,0.7); }

        @media (max-width:900px) {
          .footer-top { grid-template-columns:1fr 1fr; gap:2rem; }
          .footer-brand { grid-column:1/-1; }
        }
        @media (max-width:600px) {
          .footer-top { grid-template-columns:1fr; }
          .footer-bottom { flex-direction:column; gap:0.75rem; text-align:center; }
        }
      `}</style>
    </footer>
  );
}