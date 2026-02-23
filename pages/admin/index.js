import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BackToDashboard from '../../components/BackToDashboard';

const API_URL = 'http://127.0.0.1:8000/api';

const TABS = [
  { id: 'users', label: 'Users', icon: '👥', color: 'blue' },
  { id: 'bmi', label: 'BMI Records', icon: '⚖️', color: 'teal' },
  { id: 'diet-plans', label: 'Diet Plans', icon: '🥗', color: 'green' },
  { id: 'medical-records', label: 'Medical Records', icon: '🩺', color: 'red' },
  { id: 'feedback', label: 'Feedback', icon: '💬', color: 'purple' },
];

const TAB_COLORS = {
  blue: { active: 'bg-blue-600 text-white shadow-blue-200', inactive: 'text-blue-700 bg-blue-50 hover:bg-blue-100' },
  teal: { active: 'bg-teal-600 text-white shadow-teal-200', inactive: 'text-teal-700 bg-teal-50 hover:bg-teal-100' },
  green: { active: 'bg-green-600 text-white shadow-green-200', inactive: 'text-green-700 bg-green-50 hover:bg-green-100' },
  red: { active: 'bg-red-500 text-white shadow-red-200', inactive: 'text-red-700 bg-red-50 hover:bg-red-100' },
  purple: { active: 'bg-purple-600 text-white shadow-purple-200', inactive: 'text-purple-700 bg-purple-50 hover:bg-purple-100' },
};

function getBmiPill(cat) {
  const m = {
    'Underweight': 'bg-sky-100 text-sky-800 border-sky-200',
    'Normal Weight': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Overweight': 'bg-amber-100 text-amber-800 border-amber-200',
    'Obese': 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return m[cat] || 'bg-gray-100 text-gray-700 border-gray-200';
}

function StarRating({ val }) {
  const n = Number(val) || 0;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= n ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

const TH = ({ children }) => (
  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
    {children}
  </th>
);
const TD = ({ children, className = '' }) => (
  <td className={`px-5 py-3.5 text-sm text-gray-700 ${className}`}>{children}</td>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login');
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (isLoggedIn && !isLoading) fetchData(activeTab);
  }, [activeTab, isLoggedIn, isLoading]);

  const fetchData = async (tab) => {
    setLoading(true); setError('');
    try {
      let response, formattedData;
      const uid = selectedUser || 'all';
      switch (tab) {
        case 'users': response = await axios.get(`${API_URL}/admin/users`); formattedData = response.data.users || []; break;
        case 'bmi': response = await axios.get(`${API_URL}/admin/bmi?user_id=${uid}`); formattedData = response.data.bmi_records || []; break;
        case 'diet-plans': response = await axios.get(`${API_URL}/admin/diet-plans?user_id=${uid}`); formattedData = response.data.diet_plans || []; break;
        case 'medical-records': response = await axios.get(`${API_URL}/admin/medical-records?user_id=${uid}`); formattedData = response.data.records || []; break;
        case 'feedback': response = await axios.get(`${API_URL}/admin/feedback?user_id=${uid}`); formattedData = response.data.feedback || []; break;
        default: formattedData = [];
      }
      setData(formattedData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => { setActiveTab(tab); setSelectedUser(null); };
  const handleViewPlan = (plan) => { setSelectedPlan(plan); setShowPlanModal(true); };

  const renderTable = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-100 border-t-blue-600" />
        <p className="text-sm text-gray-400">Loading data…</p>
      </div>
    );
    if (error) return (
      <div className="mx-6 my-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 011.5 0v.5a.75.75 0 01-1.5 0v-.5zm0-6a.75.75 0 011.5 0V10a.75.75 0 01-1.5 0V6.75z" clipRule="evenodd" /></svg>
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
    if (data.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
        <div className="text-5xl mb-2">📭</div>
        <p className="font-medium text-gray-500">No records found</p>
        <p className="text-sm">There's no data to display for this section yet.</p>
      </div>
    );

    switch (activeTab) {
      case 'users': return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><TH>ID</TH><TH>Name</TH><TH>Email</TH><TH>Registered</TH><TH>Actions</TH></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TD><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{u.id}</span></TD>
                  <TD><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name?.charAt(0)?.toUpperCase()}</div><span className="font-medium text-gray-800">{u.name}</span></div></TD>
                  <TD className="text-gray-500">{u.email}</TD>
                  <TD className="text-gray-400">{new Date(u.created_at).toLocaleDateString()}</TD>
                  <TD>
                    <button onClick={() => setSelectedUser(u.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">View Data →</button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      case 'bmi': return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><TH>ID</TH><TH>User ID</TH><TH>Height (cm)</TH><TH>Weight (kg)</TH><TH>BMI</TH><TH>Category</TH><TH>Date</TH></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TD><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.id}</span></TD>
                  <TD>{r.user_id}</TD>
                  <TD>{r.height}</TD>
                  <TD>{r.weight}</TD>
                  <TD><span className="font-bold text-gray-800">{r.bmi != null ? r.bmi.toFixed(1) : 'N/A'}</span></TD>
                  <TD><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBmiPill(r.category)}`}>{r.category}</span></TD>
                  <TD className="text-gray-400">{new Date(r.timestamp).toLocaleDateString()}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      case 'diet-plans': return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><TH>ID</TH><TH>User ID</TH><TH>BMI</TH><TH>Created</TH><TH>Details</TH></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TD><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{p.id}</span></TD>
                  <TD>{p.user_id}</TD>
                  <TD><span className="font-bold text-gray-800">{p.bmi != null ? p.bmi.toFixed(1) : 'N/A'}</span></TD>
                  <TD className="text-gray-400">{new Date(p.created_at).toLocaleDateString()}</TD>
                  <TD><button onClick={() => handleViewPlan(p)} className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">View Plan →</button></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      case 'medical-records': return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><TH>ID</TH><TH>User ID</TH><TH>Date</TH><TH>Blood Pressure</TH><TH>Blood Sugar</TH><TH>Notes</TH></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TD><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.id}</span></TD>
                  <TD>{r.user_id}</TD>
                  <TD className="text-gray-400">{r.date}</TD>
                  <TD><span className="font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs">{r.bloodPressure} mmHg</span></TD>
                  <TD><span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-xs">{r.bloodSugar} mg/dL</span></TD>
                  <TD className="max-w-xs truncate text-gray-400 italic text-xs">{r.notes || '—'}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      case 'feedback': return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><TH>ID</TH><TH>User ID</TH><TH>Aspect</TH><TH>Rating</TH><TH>Comments</TH><TH>Suggestion</TH><TH>Date</TH></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((f, i) => (
                <tr key={f.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <TD><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{f.id}</span></TD>
                  <TD>{f.user_id}</TD>
                  <TD><span className="capitalize inline-flex px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">{f.aspect}</span></TD>
                  <TD><StarRating val={f.rating} /></TD>
                  <TD className="max-w-xs truncate">{f.comments}</TD>
                  <TD className="max-w-xs truncate text-gray-400 italic text-xs">{f.suggestion || '—'}</TD>
                  <TD className="text-gray-400">{new Date(f.created_at).toLocaleDateString()}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      default: return null;
    }
  };

  const renderPlanDetails = () => {
    if (!selectedPlan?.plan) return null;
    const plan = selectedPlan.plan;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {[['User ID', selectedPlan.user_id], ['BMI', selectedPlan.bmi?.toFixed(2) || 'N/A'], ['Created', new Date(selectedPlan.created_at).toLocaleDateString()], ['Calories', plan.calories || 'Not specified']].map(([label, val]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-semibold text-gray-800 text-sm">{val}</p>
            </div>
          ))}
        </div>
        {plan.meals && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">🍽 Meals</h4>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {Object.entries(plan.meals).map(([mealType, items], idx) => (
                <div key={mealType} className={`flex gap-3 px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className="font-semibold text-gray-700 capitalize min-w-[90px]">{mealType}</span>
                  <span className="text-gray-500">{Array.isArray(items) ? items.join(', ') : 'No items'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {plan.recommendations?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">✅ Recommendations</h4>
            <ul className="space-y-1.5">
              {plan.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-emerald-500 shrink-0">✓</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-100 border-t-blue-600" /></div>;
  if (!isLoggedIn) return <div className="flex items-center justify-center h-screen text-gray-500">Redirecting…</div>;

  const activeTabMeta = TABS.find(t => t.id === activeTab);

  return (
    <>
      <Head><title>Admin Dashboard | DiaBP</title></Head>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <BackToDashboard />
          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner">🛡️</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-300 text-sm mt-0.5">View and manage users, records, plans & feedback</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => {
            const colors = TAB_COLORS[tab.color];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all border ${isActive ? `${colors.active} shadow-lg border-transparent` : `${colors.inactive} border-transparent`
                  }`}
              >
                <span>{tab.icon}</span> {tab.label}
                {isActive && <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{data.length}</span>}
              </button>
            );
          })}
        </div>

        {/* Active user filter */}
        {selectedUser && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
              🔍 Filtering by User ID: {selectedUser}
            </span>
            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Clear filter">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>
        )}

        {/* Data Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeTabMeta?.icon}</span>
              <h2 className="font-semibold text-gray-800">{activeTabMeta?.label}</h2>
            </div>
            <button onClick={() => fetchData(activeTab)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
              Refresh
            </button>
          </div>
          {renderTable()}
        </div>
      </div>

      {/* Diet Plan Modal */}
      {showPlanModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥗</span>
                <h3 className="font-bold text-lg">Diet Plan Details</h3>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1">{renderPlanDetails()}</div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button onClick={() => setShowPlanModal(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}