import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
const FeedbackModal = dynamic(() => import('./FeedbackModal'), { ssr: false });
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { href: '/bmi', label: 'BMI Calculator', icon: '⚖️' },
  { href: '/diet-plan', label: 'Diet Plan', icon: '🥗' },
  { href: '/records', label: 'Health Records', icon: '🩺' },
  { href: '/admin', label: 'Admin', icon: '🛡️' },
  { href: '/db-view', label: 'DB Viewer', icon: '🗄️' },
];

export default function Header() {
  const { isLoggedIn, userName, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [router.pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (path) => router.pathname === path;

  return (
    <>
      <header
        className={`
          sticky top-0 z-50 w-full transition-all duration-300
          ${scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-white/60'
            : 'bg-white border-b border-gray-100'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-3 group select-none">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
                {/* Medical cross */}
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400/40 group-hover:ring-blue-400/70 transition-all" />
              </div>
              <div className="leading-none">
                <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  DiaBP
                </span>
                <span className="block text-[10px] font-medium text-gray-400 tracking-widest uppercase mt-0.5">
                  Diet Consultant
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-1">
              {isLoggedIn ? (
                <>
                  {NAV_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`
                        relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive(href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/60'}
                      `}
                    >
                      {label}
                      {isActive(href) && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-blue-500" />
                      )}
                    </Link>
                  ))}

                  {/* Feedback button */}
                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="ml-1 px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition-all"
                  >
                    Feedback
                  </button>

                  {/* Divider */}
                  <div className="mx-3 h-6 w-px bg-gray-200" />

                  {/* User pill / dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(v => !v)}
                      className={`
                        flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-all
                        ${userMenuOpen
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/60'}
                      `}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-[96px] truncate">{userName}</span>
                      <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-0.5"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50/60 transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    Get Started →
                  </Link>
                </div>
              )}
            </nav>

            {/* ── Mobile Hamburger ── */}
            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                {mobileOpen
                  ? <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  : <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
              {isLoggedIn ? (
                <>
                  {/* User info row */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                      <p className="text-xs text-gray-400">Logged in</p>
                    </div>
                    <button onClick={handleLogout} className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      Logout
                    </button>
                  </div>

                  {/* Nav links */}
                  <div className="space-y-0.5">
                    {NAV_LINKS.map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span>{icon}</span>
                        {label}
                        {isActive(href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </Link>
                    ))}
                  </div>

                  {/* Feedback CTA */}
                  <button
                    onClick={() => { setIsFeedbackOpen(true); setMobileOpen(false); }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    💬 Share Feedback
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 py-2">
                  <Link href="/login" className="w-full text-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all">
                    Get Started →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}