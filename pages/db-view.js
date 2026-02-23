import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';
import axios from 'axios';
import BackToDashboard from '../components/BackToDashboard';

const API_URL = 'http://127.0.0.1:8000/api';

const SECTIONS = [
  { key: 'users', label: 'Users', icon: '👥', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'bg-blue-100' },
  { key: 'bmi', label: 'BMI Records', icon: '⚖️', bg: 'bg-teal-50', text: 'text-teal-700', ring: 'bg-teal-100' },
  { key: 'dietPlans', label: 'Diet Plans', icon: '🥗', bg: 'bg-green-50', text: 'text-green-700', ring: 'bg-green-100' },
  { key: 'medicalRecords', label: 'Medical Records', icon: '🩺', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'bg-rose-100' },
  { key: 'feedback', label: 'Feedback', icon: '💬', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'bg-purple-100' },
];

function getBmiPill(cat) {
  const map = { 'underweight': 'bg-sky-100 text-sky-800', 'normal weight': 'bg-emerald-100 text-emerald-800', 'overweight': 'bg-amber-100 text-amber-800', 'obese': 'bg-rose-100 text-rose-800' };
  return map[(cat || '').toLowerCase()] || 'bg-gray-100 text-gray-700';
}

function Stars({ val }) {
  const n = Number(val) || 0;
  return <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= n ? 'text-amber-400' : 'text-gray-200'}>★</span>)}</span>;
}

const TH = ({ c }) => <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">{c}</th>;
const TD = ({ c, cls = '' }) => <td className={`px-5 py-3.5 text-sm text-gray-700 ${cls}`}>{c}</td>;

function SectionCard({ sec, rows, collapsed, onToggle, children }) {
  return (
    <div id={`s-${sec.key}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${sec.ring} flex items-center justify-center text-lg`}>{sec.icon}</div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{sec.label}</p>
            <p className="text-xs text-gray-400">{rows} records</p>
          </div>
        </div>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {!collapsed && (rows === 0 ? <p className="text-sm text-gray-400 text-center py-10">No records available</p> : children)}
    </div>
  );
}

export default function DatabaseViewer() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [data, setData] = useState({ users: [], bmi: [], dietPlans: [], medicalRecords: [], feedback: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) { router.push('/login'); return; }
    if (isLoggedIn && !isLoading) load();
  }, [isLoggedIn, isLoading]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [uR, bR, dR, mR, fR] = await Promise.all([
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/bmi`),
        axios.get(`${API_URL}/admin/diet-plans`),
        axios.get(`${API_URL}/admin/medical-records`),
        axios.get(`${API_URL}/admin/feedback`),
      ]);
      setData({ users: uR.data.users || [], bmi: bR.data.bmi_records || [], dietPlans: dR.data.diet_plans || [], medicalRecords: mR.data.records || [], feedback: fR.data.feedback || [] });
    } catch { setError('Failed to load. Check the backend is running.'); }
    finally { setLoading(false); }
  };

  const toggle = k => setCollapsed(c => ({ ...c, [k]: !c[k] }));

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-600" /></div>;
  if (!isLoggedIn) return <div className="flex items-center justify-center h-screen text-gray-500">Redirecting…</div>;

  return (
    <>
      <Head><title>DB Viewer | DiaBP</title></Head>

      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <BackToDashboard />
          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">🗄️</div>
            <div>
              <h1 className="text-2xl font-bold">Database Viewer</h1>
              <p className="text-indigo-200 text-sm mt-0.5">All tables in real-time tabular view</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">

        {/* Stat cards */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => document.getElementById(`s-${s.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 ${s.bg} hover:shadow-md transition-shadow text-left`}>
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className={`text-lg font-bold leading-none ${s.text}`}>{(data[s.key] || []).length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-600" />
            <p className="text-sm text-gray-400">Loading all tables…</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 011.5 0v.5a.75.75 0 01-1.5 0v-.5zm0-6a.75.75 0 011.5 0V10a.75.75 0 01-1.5 0V6.75z" clipRule="evenodd" /></svg>
            <span className="text-sm font-medium">{error}</span>
            <button onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        ) : (
          <div className="space-y-5">

            <SectionCard sec={SECTIONS[0]} rows={data.users.length} collapsed={collapsed.users} onToggle={() => toggle('users')}>
              <div className="overflow-x-auto"><table className="min-w-full">
                <thead><tr>{['ID', 'Name', 'Email', 'Registered'].map(h => <TH key={h} c={h} />)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.users.map((u, i) => (
                    <tr key={u.id} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                      <TD c={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{u.id}</span>} />
                      <TD c={<div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">{u.name?.charAt(0)?.toUpperCase()}</div><span className="font-medium">{u.name}</span></div>} />
                      <TD c={u.email} cls="text-gray-500" />
                      <TD c={new Date(u.created_at).toLocaleDateString()} cls="text-gray-400" />
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </SectionCard>

            <SectionCard sec={SECTIONS[1]} rows={data.bmi.length} collapsed={collapsed.bmi} onToggle={() => toggle('bmi')}>
              <div className="overflow-x-auto"><table className="min-w-full">
                <thead><tr>{['ID', 'User ID', 'Height', 'Weight', 'BMI', 'Category', 'Date'].map(h => <TH key={h} c={h} />)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.bmi.map((r, i) => (
                    <tr key={r.id} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                      <TD c={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.id}</span>} />
                      <TD c={r.user_id} /><TD c={r.height} /><TD c={r.weight} />
                      <TD c={<span className="font-bold">{r.bmi?.toFixed(1) || 'N/A'}</span>} />
                      <TD c={<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBmiPill(r.category)}`}>{r.category}</span>} />
                      <TD c={new Date(r.timestamp).toLocaleDateString()} cls="text-gray-400" />
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </SectionCard>

            <SectionCard sec={SECTIONS[2]} rows={data.dietPlans.length} collapsed={collapsed.dietPlans} onToggle={() => toggle('dietPlans')}>
              <div className="overflow-x-auto"><table className="min-w-full">
                <thead><tr>{['ID', 'User ID', 'BMI', 'Created', 'Details'].map(h => <TH key={h} c={h} />)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.dietPlans.map((p, i) => (
                    <tr key={p.id} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                      <TD c={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{p.id}</span>} />
                      <TD c={p.user_id} />
                      <TD c={<span className="font-bold">{p.bmi?.toFixed(1) || 'N/A'}</span>} />
                      <TD c={new Date(p.created_at).toLocaleDateString()} cls="text-gray-400" />
                      <TD c={<button onClick={() => setSelectedPlan(p)} className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">View Plan →</button>} />
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </SectionCard>

            <SectionCard sec={SECTIONS[3]} rows={data.medicalRecords.length} collapsed={collapsed.medicalRecords} onToggle={() => toggle('medicalRecords')}>
              <div className="overflow-x-auto"><table className="min-w-full">
                <thead><tr>{['ID', 'User ID', 'Date', 'Blood Pressure', 'Blood Sugar', 'Notes'].map(h => <TH key={h} c={h} />)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.medicalRecords.map((r, i) => (
                    <tr key={r.id} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                      <TD c={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.id}</span>} />
                      <TD c={r.user_id} /><TD c={r.date} cls="text-gray-400" />
                      <TD c={<span className="font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs">{r.bloodPressure} mmHg</span>} />
                      <TD c={<span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-xs">{r.bloodSugar} mg/dL</span>} />
                      <TD c={r.notes || '—'} cls="max-w-xs truncate text-gray-400 italic text-xs" />
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </SectionCard>

            <SectionCard sec={SECTIONS[4]} rows={data.feedback.length} collapsed={collapsed.feedback} onToggle={() => toggle('feedback')}>
              <div className="overflow-x-auto"><table className="min-w-full">
                <thead><tr>{['ID', 'User ID', 'Aspect', 'Rating', 'Comments', 'Suggestion', 'Date'].map(h => <TH key={h} c={h} />)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.feedback.map((f, i) => (
                    <tr key={f.id} className={i % 2 ? 'bg-gray-50/60' : 'bg-white'}>
                      <TD c={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{f.id}</span>} />
                      <TD c={f.user_id} />
                      <TD c={<span className="capitalize inline-flex px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">{f.aspect}</span>} />
                      <TD c={<Stars val={f.rating} />} />
                      <TD c={f.comments} cls="max-w-xs truncate" />
                      <TD c={f.suggestion || '—'} cls="max-w-xs truncate text-gray-400 italic text-xs" />
                      <TD c={new Date(f.created_at).toLocaleDateString()} cls="text-gray-400" />
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </SectionCard>
          </div>
        )}
      </div>

      {/* Diet Plan Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2"><span className="text-xl">🥗</span><h3 className="font-bold text-lg">Diet Plan Details</h3></div>
              <button onClick={() => setSelectedPlan(null)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1">
              {selectedPlan.plan ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[['User ID', selectedPlan.user_id], ['BMI', selectedPlan.bmi?.toFixed(2) || 'N/A'], ['Created', new Date(selectedPlan.created_at).toLocaleDateString()], ['Calories', selectedPlan.plan.calories || 'Not specified']].map(([l, v]) => (
                      <div key={l} className="bg-gray-50 rounded-xl p-3 border border-gray-100"><p className="text-xs text-gray-400">{l}</p><p className="font-semibold text-gray-800 text-sm">{v}</p></div>
                    ))}
                  </div>
                  {selectedPlan.plan.meals && Object.keys(selectedPlan.plan.meals).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">🍽 Meals</h4>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        {Object.entries(selectedPlan.plan.meals).map(([t, items], idx) => (
                          <div key={t} className={`flex gap-3 px-4 py-3 text-sm ${idx % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                            <span className="font-semibold text-gray-700 capitalize min-w-[90px]">{t}</span>
                            <span className="text-gray-500">{Array.isArray(items) ? items.join(', ') : 'No items'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPlan.plan.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">✅ Recommendations</h4>
                      <ul className="space-y-1.5">{selectedPlan.plan.recommendations.map((r, i) => <li key={i} className="flex gap-2 text-sm text-gray-600"><span className="text-emerald-500 shrink-0">✓</span>{r}</li>)}</ul>
                    </div>
                  )}
                </div>
              ) : <p className="text-gray-400 text-sm">No plan data available.</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button onClick={() => setSelectedPlan(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}