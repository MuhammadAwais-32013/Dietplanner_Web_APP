import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getMedicalRecords } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function MedicalRecords() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchRecords();
  }, [isLoggedIn, router]);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getMedicalRecords();
      if (data.success) setRecords(data.records);
      else setError(data.error || 'Failed to fetch medical records');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFilteredRecords = () => {
    if (activeFilter === 'all') return records;
    const now = new Date();
    const cutoff = {
      month: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      'three-months': new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      'six-months': new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
    }[activeFilter];
    return records.filter(r => new Date(r.date) >= cutoff);
  };

  const getStats = () => {
    const fr = getFilteredRecords();
    if (!fr.length) return null;
    const bpVals = fr.map(r => { const [s, d] = r.bloodPressure.split('/').map(Number); return { s, d }; });
    const avgSys = Math.round(bpVals.reduce((sum, b) => sum + b.s, 0) / bpVals.length);
    const avgDia = Math.round(bpVals.reduce((sum, b) => sum + b.d, 0) / bpVals.length);
    const avgBS = Math.round(fr.map(r => parseFloat(r.bloodSugar)).reduce((s, v) => s + v, 0) / fr.length);
    return { avgBP: `${avgSys}/${avgDia}`, avgBloodSugar: avgBS };
  };

  if (!isLoggedIn) return null;

  const filteredRecords = getFilteredRecords();
  const stats = getStats();

  const FILTERS = [
    { key: 'all', label: 'All Time' },
    { key: 'month', label: 'Last Month' },
    { key: 'three-months', label: '3 Months' },
    { key: 'six-months', label: '6 Months' },
  ];

  return (
    <>
      <Head>
        <title>Health Records | DiaBP Diet Consultant</title>
        <meta name="description" content="Track your blood pressure and blood sugar records over time" />
      </Head>

      <div className="records-page">
        {/* ── Page Header ── */}
        <div className="page-header">
          <Link href="/" className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Dashboard
          </Link>

          <div className="header-row">
            <div className="title-block">
              <div className="page-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="page-title">Health Records</h1>
                <p className="page-subtitle">
                  {records.length > 0 ? `${records.length} records in your health history` : 'Track blood pressure & blood sugar'}
                </p>
              </div>
            </div>

            <Link href="/records/add" className="add-btn">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Record
            </Link>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your health records...</p>
          </div>
        ) : records.length > 0 ? (
          <>
            {/* ── Stat Cards ── */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card stat-blue">
                  <div className="stat-icon-wrap" style={{ background: '#eff6ff' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" style={{ color: '#2563eb' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Avg Blood Pressure</p>
                    <div className="stat-value" style={{ color: '#2563eb' }}>{stats.avgBP}</div>
                    <p className="stat-sub">mmHg · {filteredRecords.length} records</p>
                  </div>
                </div>

                <div className="stat-card stat-green">
                  <div className="stat-icon-wrap" style={{ background: '#f0fdf4' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" style={{ color: '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Avg Blood Sugar</p>
                    <div className="stat-value" style={{ color: '#16a34a' }}>{stats.avgBloodSugar} <span className="stat-unit">mg/dL</span></div>
                    <p className="stat-sub">Fasting glucose · {filteredRecords.length} records</p>
                  </div>
                </div>

                <div className="stat-card stat-purple">
                  <div className="stat-icon-wrap" style={{ background: '#faf5ff' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" style={{ color: '#7c3aed' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Total Records</p>
                    <div className="stat-value" style={{ color: '#7c3aed' }}>{records.length}</div>
                    <p className="stat-sub">Health monitoring entries</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Records Table ── */}
            <div className="records-card">
              <div className="records-card-header">
                <h2>Record History</h2>
                {/* Filters */}
                <div className="filter-group">
                  {FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`filter-btn ${activeFilter === f.key ? 'filter-active' : ''}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRecords.length > 0 ? (
                <ul className="records-list">
                  {filteredRecords.map((record, idx) => (
                    <li key={record.id} className="record-row" style={{ '--delay': `${idx * 50}ms` }}>
                      <div className="record-date-badge">
                        <span className="record-day">{new Date(record.date).getDate()}</span>
                        <span className="record-month">{new Date(record.date).toLocaleString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className="record-details">
                        <p className="record-date-full">{formatDate(record.date)}</p>
                        <div className="record-metrics">
                          <span className="metric-pill metric-bp">🩺 {record.bloodPressure} mmHg</span>
                          <span className="metric-pill metric-bs">🩸 {record.bloodSugar} mg/dL</span>
                        </div>
                        {record.notes && <p className="record-notes">{record.notes}</p>}
                      </div>
                      <div className="record-index">#{records.length - idx}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-filter">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No records found for the selected period.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="empty-state">
            <div className="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>No health records yet</h3>
            <p>Start tracking your blood pressure and blood sugar to get personalized diet recommendations.</p>
            <Link href="/records/add" className="empty-cta">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Record
            </Link>

            <div className="guide-cards">
              {[
                { emoji: '🩺', label: 'Blood Pressure', desc: 'Track systolic/diastolic readings' },
                { emoji: '🩸', label: 'Blood Sugar', desc: 'Monitor fasting glucose levels' },
                { emoji: '📊', label: 'Trend Analysis', desc: 'See how your metrics change over time' },
              ].map(g => (
                <div key={g.label} className="guide-card">
                  <span className="guide-emoji">{g.emoji}</span>
                  <div>
                    <p className="guide-label">{g.label}</p>
                    <p className="guide-desc">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .records-page { max-width:960px; margin:0 auto; padding:1.5rem 1rem 3rem; animation:fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .back-link { display:inline-flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:500; color:#6b7280; text-decoration:none; margin-bottom:1.25rem; transition:color 0.15s; }
        .back-link:hover { color:#2563eb; }

        .page-header { margin-bottom:2rem; }
        .header-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .title-block { display:flex; align-items:center; gap:1rem; }
        .page-icon { width:56px; height:56px; background:linear-gradient(135deg,#0d9488,#2563eb); border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(13,148,136,0.3); flex-shrink:0; }
        .page-title { font-size:1.75rem; font-weight:800; color:#111827; letter-spacing:-0.025em; }
        .page-subtitle { font-size:0.85rem; color:#6b7280; margin-top:0.15rem; }

        .add-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.625rem 1.25rem; background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; font-size:0.875rem; font-weight:600; border-radius:10px; text-decoration:none; box-shadow:0 4px 12px rgba(79,70,229,0.3); transition:all 0.2s; white-space:nowrap; }
        .add-btn:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(79,70,229,0.4); }

        .error-banner { display:flex; align-items:center; gap:0.5rem; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:0.875rem 1.25rem; border-radius:10px; font-size:0.875rem; margin-bottom:1.5rem; }

        .loading-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5rem 0; gap:1rem; color:#9ca3af; }
        .spinner { width:44px; height:44px; border:4px solid #e5e7eb; border-top-color:#2563eb; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* Stats */
        .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; margin-bottom:1.5rem; }
        .stat-card { background:white; border-radius:16px; border:1.5px solid #e5e7eb; padding:1.5rem; display:flex; align-items:center; gap:1rem; box-shadow:0 2px 10px rgba(0,0,0,0.04); transition:all 0.2s; }
        .stat-card:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.07); }
        .stat-icon-wrap { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .stat-label { font-size:0.78rem; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.3rem; }
        .stat-value { font-size:1.75rem; font-weight:800; line-height:1; }
        .stat-unit { font-size:0.875rem; font-weight:500; }
        .stat-sub { font-size:0.75rem; color:#9ca3af; margin-top:0.25rem; }

        /* Records card */
        .records-card { background:white; border-radius:20px; border:1.5px solid #e5e7eb; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05); }
        .records-card-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f3f4f6; flex-wrap:wrap; gap:0.75rem; }
        .records-card-header h2 { font-size:1rem; font-weight:700; color:#111827; }
        .filter-group { display:flex; gap:0.35rem; flex-wrap:wrap; }
        .filter-btn { font-size:0.75rem; font-weight:500; padding:0.3rem 0.75rem; border-radius:99px; border:1.5px solid #e5e7eb; background:white; color:#6b7280; cursor:pointer; transition:all 0.15s; }
        .filter-btn:hover { border-color:#c7d2fe; color:#2563eb; }
        .filter-active { background:#eff6ff !important; border-color:#93c5fd !important; color:#1d4ed8 !important; font-weight:600; }

        .records-list { list-style:none; padding:0; margin:0; }
        .record-row { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #f9fafb; animation:fadeUp 0.3s ease-out var(--delay,0ms) both; transition:background 0.15s; }
        .record-row:last-child { border-bottom:none; }
        .record-row:hover { background:#fafafa; }
        .record-date-badge { display:flex; flex-direction:column; align-items:center; justify-content:center; width:44px; height:44px; background:linear-gradient(135deg,#eff6ff,#e0e7ff); border-radius:12px; border:1.5px solid #c7d2fe; flex-shrink:0; }
        .record-day { font-size:1rem; font-weight:800; color:#1d4ed8; line-height:1; }
        .record-month { font-size:0.6rem; font-weight:600; color:#3b82f6; text-transform:uppercase; }
        .record-details { flex:1; min-width:0; }
        .record-date-full { font-size:0.8rem; font-weight:600; color:#374151; margin-bottom:0.4rem; }
        .record-metrics { display:flex; gap:0.5rem; flex-wrap:wrap; }
        .metric-pill { font-size:0.8rem; font-weight:600; padding:0.3rem 0.75rem; border-radius:99px; }
        .metric-bp { background:#eff6ff; color:#1d4ed8; }
        .metric-bs { background:#f0fdf4; color:#15803d; }
        .record-notes { font-size:0.78rem; color:#6b7280; margin-top:0.4rem; font-style:italic; }
        .record-index { font-size:0.75rem; font-weight:600; color:#d1d5db; flex-shrink:0; }

        .empty-filter { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; color:#9ca3af; font-size:0.875rem; }

        /* Empty state */
        .empty-state { background:linear-gradient(135deg,#f0f9ff,#e0e7ff); border-radius:20px; border:1.5px solid #c7d2fe; padding:3rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .empty-icon { width:96px; height:96px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(59,130,246,0.2); }
        .empty-state h3 { font-size:1.25rem; font-weight:700; color:#1e3a8a; }
        .empty-state p { font-size:0.875rem; color:#475569; max-width:340px; line-height:1.6; }
        .empty-cta { display:inline-flex; align-items:center; gap:0.5rem; padding:0.75rem 1.5rem; background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; font-weight:600; font-size:0.875rem; border-radius:10px; text-decoration:none; box-shadow:0 4px 12px rgba(79,70,229,0.3); transition:all 0.2s; margin-top:0.25rem; }
        .empty-cta:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(79,70,229,0.4); }
        .guide-cards { display:flex; flex-direction:column; gap:0.625rem; margin-top:0.5rem; width:100%; max-width:400px; }
        .guide-card { display:flex; align-items:center; gap:0.875rem; background:white; border-radius:12px; padding:0.875rem 1.125rem; border:1px solid #e5e7eb; text-align:left; }
        .guide-emoji { font-size:1.5rem; flex-shrink:0; }
        .guide-label { font-size:0.875rem; font-weight:600; color:#111827; }
        .guide-desc { font-size:0.78rem; color:#9ca3af; }

        @media (max-width:640px) {
          .stats-grid { grid-template-columns:1fr; }
          .header-row { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </>
  );
}