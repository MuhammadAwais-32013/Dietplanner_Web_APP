import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { calculateBMI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BMI_RANGES = [
  { label: 'Underweight', min: 0, max: 18.5, color: '#3b82f6', bg: '#eff6ff', tip: 'Below 18.5' },
  { label: 'Normal', min: 18.5, max: 25, color: '#10b981', bg: '#f0fdf4', tip: '18.5 – 24.9' },
  { label: 'Overweight', min: 25, max: 30, color: '#f59e0b', bg: '#fffbeb', tip: '25 – 29.9' },
  { label: 'Obese', min: 30, max: 100, color: '#ef4444', bg: '#fef2f2', tip: '30 & above' },
];

function getBMICategory(bmi) {
  return BMI_RANGES.find(r => bmi >= r.min && bmi < r.max) || BMI_RANGES[3];
}

const BMI_ADVICE = {
  'underweight': {
    icon: '🥗',
    desc: 'You are below the healthy weight range. Focus on gaining weight through balanced, nutrient-rich foods.',
    tips: [
      'Eat nutrient-dense, calorie-rich foods like nuts, seeds & avocados',
      'Include protein-rich foods — eggs, legumes, lean meats',
      'Eat smaller, more frequent meals throughout the day',
      'Consider strength training to build healthy muscle mass',
    ],
  },
  'normal': {
    icon: '✅',
    desc: 'You are in the healthy weight range. Keep up your excellent habits!',
    tips: [
      'Maintain a balanced diet with colorful fruits and vegetables',
      'Stay active — 150 min of moderate exercise per week',
      'Monitor your weight periodically to stay on track',
      'Focus on overall wellness, not just the number on the scale',
    ],
  },
  'overweight': {
    icon: '⚠️',
    desc: 'You are slightly above the healthy range. Small lifestyle changes can make a big difference.',
    tips: [
      'Practice portion control and mindful eating',
      'Aim for 30 min of moderate exercise most days',
      'Choose whole foods and reduce processed snacks',
      'Stay hydrated — drink 8+ glasses of water daily',
    ],
  },
  'obese': {
    icon: '🏥',
    desc: 'Your BMI suggests obesity. Prioritizing weight management will significantly improve your health.',
    tips: [
      'Consult a healthcare professional before starting a new program',
      'Make gradual, sustainable dietary changes — avoid crash diets',
      'Begin with gentle exercise and increase intensity over time',
      'Track your meals and focus on whole, unprocessed foods',
    ],
  },
};

export default function BMICalculator() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({ height: '', weight: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.height) newErrors.height = 'Height is required';
    else if (isNaN(formData.height) || formData.height <= 0 || formData.height > 300)
      newErrors.height = 'Enter a valid height (1–300 cm)';
    if (!formData.weight) newErrors.weight = 'Weight is required';
    else if (isNaN(formData.weight) || formData.weight <= 0 || formData.weight > 500)
      newErrors.weight = 'Enter a valid weight (1–500 kg)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const data = await calculateBMI({ height: parseFloat(formData.height), weight: parseFloat(formData.weight) });
      if (data.success) {
        setResult(data);
        localStorage.setItem('bmi', data.bmi.toString());
      } else {
        setError(data.error || 'Failed to calculate BMI');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) return null;

  const category = result ? getBMICategory(result.bmi) : null;
  const advice = result ? BMI_ADVICE[category.label.toLowerCase()] : null;

  // Gauge needle position (0% = left, 100% = right) for BMI range 10-45
  const gaugePercent = result ? Math.min(Math.max(((result.bmi - 10) / 35) * 100, 0), 100) : 0;

  return (
    <>
      <Head>
        <title>BMI Calculator | DiaBP Diet Consultant</title>
        <meta name="description" content="Calculate your BMI and get personalized diet recommendations" />
      </Head>

      <div className="bmi-page">
        {/* Page header */}
        <div className="page-header">
          <Link href="/" className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Dashboard
          </Link>

          <div className="page-title-block">
            <div className="page-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="page-title">BMI Calculator</h1>
              <p className="page-subtitle">Calculate your Body Mass Index & get personalized diet guidance</p>
            </div>
          </div>

          {/* Quick reference cards */}
          <div className="bmi-ref-cards">
            {BMI_RANGES.map(r => (
              <div key={r.label} className="ref-card" style={{ borderColor: r.color + '40', background: r.bg }}>
                <span className="ref-badge" style={{ background: r.color }}>{r.label}</span>
                <span className="ref-range" style={{ color: r.color }}>{r.tip}</span>
              </div>
            ))}
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

        <div className="bmi-grid">
          {/* Left: input form */}
          <div className="form-card">
            <div className="form-card-header">
              <h2>Your Measurements</h2>
              <p>Enter your height and weight to get your BMI score</p>
            </div>

            <form onSubmit={handleSubmit} className="bmi-form">
              <div className="input-group">
                <label htmlFor="height" className="input-label">Height</label>
                <div className="input-row">
                  <div className="input-box">
                    <span className="input-prefix">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                    </span>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="e.g. 170"
                      min="1" max="300"
                      className={`bmi-input ${errors.height ? 'has-error' : ''}`}
                    />
                    <span className="input-unit">cm</span>
                  </div>
                </div>
                {errors.height && <p className="input-error">{errors.height}</p>}
                <p className="input-hint">Example: 170 cm (5 ft 7 in)</p>
              </div>

              <div className="input-group">
                <label htmlFor="weight" className="input-label">Weight</label>
                <div className="input-row">
                  <div className="input-box">
                    <span className="input-prefix">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </span>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g. 70"
                      min="1" max="500"
                      className={`bmi-input ${errors.weight ? 'has-error' : ''}`}
                    />
                    <span className="input-unit">kg</span>
                  </div>
                </div>
                {errors.weight && <p className="input-error">{errors.weight}</p>}
                <p className="input-hint">Example: 70 kg (154 lbs)</p>
              </div>

              <button type="submit" className="calc-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calculate BMI
                  </>
                )}
              </button>
            </form>

            {/* BMI formula */}
            <div className="formula-box">
              <p className="formula-title">How BMI is calculated</p>
              <p className="formula-text">BMI = weight (kg) ÷ height² (m²)</p>
              <p className="formula-note">A universal measure of body fatness based on height and weight</p>
            </div>
          </div>

          {/* Right: result or placeholder */}
          {result ? (
            <div className="result-card" style={{ borderTop: `4px solid ${category.color}` }}>
              <div className="result-header">
                <span className="result-icon">{advice.icon}</span>
                <div>
                  <h2>Your BMI Result</h2>
                  <p>Based on {formData.height} cm height &amp; {formData.weight} kg weight</p>
                </div>
              </div>

              {/* Big score */}
              <div className="score-block" style={{ background: category.bg }}>
                <div className="score-number" style={{ color: category.color }}>{result.bmi.toFixed(1)}</div>
                <div className="score-category" style={{ color: category.color }}>{result.category}</div>
              </div>

              {/* Gauge bar */}
              <div className="gauge-container">
                <div className="gauge-bar">
                  <div className="gauge-segment" style={{ background: '#3b82f6', flex: 1 }} />
                  <div className="gauge-segment" style={{ background: '#10b981', flex: 1.3 }} />
                  <div className="gauge-segment" style={{ background: '#f59e0b', flex: 1 }} />
                  <div className="gauge-segment" style={{ background: '#ef4444', flex: 2 }} />
                  <div className="gauge-needle" style={{ left: `${gaugePercent}%` }} />
                </div>
                <div className="gauge-labels">
                  <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
                </div>
              </div>

              <p className="result-desc">{advice.desc}</p>

              <div className="tips-section">
                <h3>💡 Health Tips</h3>
                <ul className="tips-list">
                  {advice.tips.map((tip, i) => (
                    <li key={i} className="tip-item">
                      <span className="tip-dot" style={{ background: category.color }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="result-actions">
                <button onClick={() => router.push('/diet-plan')} className="action-btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Diet Plan
                </button>
                <button onClick={() => setResult(null)} className="action-btn-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recalculate
                </button>
              </div>
            </div>
          ) : (
            <div className="placeholder-card">
              <div className="placeholder-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3>Ready to calculate?</h3>
              <p>Enter your height and weight on the left to see your BMI result and personalized health tips.</p>

              <div className="range-guide">
                {BMI_RANGES.map(r => (
                  <div key={r.label} className="range-item">
                    <span className="range-dot" style={{ background: r.color }} />
                    <span className="range-label">{r.label}</span>
                    <span className="range-val">{r.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .bmi-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
          animation: fadeUp 0.4s ease-out;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.15s;
          margin-bottom: 1.25rem;
        }
        .back-link:hover { color: #2563eb; }

        .page-header { margin-bottom: 2rem; }
        .page-title-block { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
        .page-icon {
          width:56px; height:56px;
          background:linear-gradient(135deg,#2563eb,#4f46e5);
          border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 12px rgba(79,70,229,0.3);
          flex-shrink:0;
        }
        .page-title { font-size:1.75rem; font-weight:800; color:#111827; letter-spacing:-0.025em; }
        .page-subtitle { color:#6b7280; font-size:0.9rem; margin-top:0.15rem; }

        .bmi-ref-cards { display:flex; gap:0.75rem; flex-wrap:wrap; }
        .ref-card {
          display:flex; flex-direction:column; align-items:flex-start; gap:0.25rem;
          padding:0.625rem 1rem;
          border-radius:10px;
          border:1.5px solid;
          min-width:110px;
        }
        .ref-badge { font-size:0.72rem; font-weight:700; color:white; padding:0.15rem 0.5rem; border-radius:99px; }
        .ref-range { font-size:0.78rem; font-weight:600; }

        .error-banner {
          display:flex; align-items:center; gap:0.625rem;
          background:#fef2f2; border:1px solid #fecaca; color:#b91c1c;
          padding:0.875rem 1.25rem; border-radius:10px; font-size:0.875rem;
          margin-bottom:1.5rem;
        }

        .bmi-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }

        /* Form card */
        .form-card { background:white; border-radius:20px; border:1.5px solid #e5e7eb; padding:2rem; box-shadow:0 4px 20px rgba(0,0,0,0.06); }
        .form-card-header { margin-bottom:1.75rem; }
        .form-card-header h2 { font-size:1.25rem; font-weight:700; color:#111827; margin-bottom:0.3rem; }
        .form-card-header p { font-size:0.875rem; color:#6b7280; }
        .bmi-form { display:flex; flex-direction:column; gap:1.25rem; }
        .input-group { }
        .input-label { display:block; font-size:0.875rem; font-weight:600; color:#374151; margin-bottom:0.4rem; }
        .input-row { }
        .input-box { position:relative; display:flex; align-items:center; }
        .input-prefix { position:absolute; left:0.875rem; color:#9ca3af; display:flex; align-items:center; }
        .bmi-input {
          width:100%; padding:0.75rem 3.5rem 0.75rem 2.75rem;
          border:1.5px solid #e5e7eb; border-radius:10px;
          font-size:0.9rem; color:#111827; background:#fafafa; outline:none;
          transition:border-color 0.15s, box-shadow 0.15s;
        }
        .bmi-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12); background:white; }
        .bmi-input.has-error { border-color:#ef4444; }
        .input-unit { position:absolute; right:0.875rem; font-size:0.8rem; font-weight:600; color:#9ca3af; }
        .input-error { font-size:0.78rem; color:#ef4444; margin-top:0.25rem; }
        .input-hint { font-size:0.75rem; color:#9ca3af; margin-top:0.25rem; }

        .calc-btn {
          display:flex; align-items:center; justify-content:center; gap:0.5rem;
          width:100%; padding:0.875rem; margin-top:0.5rem;
          background:linear-gradient(135deg,#2563eb,#4f46e5);
          color:white; font-weight:600; font-size:0.925rem;
          border:none; border-radius:10px; cursor:pointer;
          box-shadow:0 4px 14px rgba(79,70,229,0.35);
          transition:all 0.2s;
        }
        .calc-btn:hover:not(:disabled) { background:linear-gradient(135deg,#1d4ed8,#4338ca); transform:translateY(-1px); box-shadow:0 6px 20px rgba(79,70,229,0.45); }
        .calc-btn:disabled { opacity:0.7; cursor:not-allowed; }

        .formula-box {
          margin-top:1.5rem; padding:1rem 1.25rem;
          background:#f8faff; border:1px dashed #c7d2fe;
          border-radius:10px; text-align:center;
        }
        .formula-title { font-size:0.75rem; color:#6b7280; margin-bottom:0.3rem; text-transform:uppercase; letter-spacing:0.05em; }
        .formula-text { font-size:1rem; font-weight:700; color:#4f46e5; font-family:monospace; }
        .formula-note { font-size:0.75rem; color:#9ca3af; margin-top:0.25rem; }

        /* Result card */
        .result-card { background:white; border-radius:20px; border:1.5px solid #e5e7eb; padding:2rem; box-shadow:0 4px 20px rgba(0,0,0,0.07); animation:fadeUp 0.4s ease-out; }
        .result-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
        .result-icon { font-size:2rem; }
        .result-header h2 { font-size:1.25rem; font-weight:700; color:#111827; margin-bottom:0.2rem; }
        .result-header p { font-size:0.8rem; color:#9ca3af; }

        .score-block { display:flex; flex-direction:column; align-items:center; padding:1.5rem; border-radius:16px; margin-bottom:1.25rem; }
        .score-number { font-size:3.5rem; font-weight:900; line-height:1; }
        .score-category { font-size:1rem; font-weight:700; margin-top:0.25rem; }

        .gauge-container { margin-bottom:1.25rem; }
        .gauge-bar { position:relative; display:flex; height:10px; border-radius:99px; overflow:visible; margin-bottom:0.35rem; }
        .gauge-segment { height:100%; }
        .gauge-segment:first-child { border-radius:99px 0 0 99px; }
        .gauge-segment:last-child { border-radius:0 99px 99px 0; }
        .gauge-needle {
          position:absolute; top:-3px; width:4px; height:16px;
          background:#111827; border-radius:2px;
          transform:translateX(-50%);
          transition:left 0.5s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        }
        .gauge-labels { display:flex; justify-content:space-between; font-size:0.65rem; color:#9ca3af; font-weight:500; }

        .result-desc { font-size:0.875rem; color:#4b5563; line-height:1.6; margin-bottom:1.25rem; }
        .tips-section h3 { font-size:0.9rem; font-weight:700; color:#111827; margin-bottom:0.75rem; }
        .tips-list { list-style:none; display:flex; flex-direction:column; gap:0.5rem; padding:0; margin:0 0 1.5rem; }
        .tip-item { display:flex; align-items:flex-start; gap:0.5rem; font-size:0.85rem; color:#374151; }
        .tip-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:0.35rem; }

        .result-actions { display:flex; gap:0.75rem; }
        .action-btn-primary {
          flex:1; display:flex; align-items:center; justify-content:center; gap:0.4rem;
          padding:0.75rem; background:linear-gradient(135deg,#2563eb,#4f46e5);
          color:white; font-weight:600; font-size:0.875rem;
          border:none; border-radius:10px; cursor:pointer;
          box-shadow:0 4px 12px rgba(79,70,229,0.3); transition:all 0.2s;
        }
        .action-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(79,70,229,0.4); }
        .action-btn-secondary {
          flex:1; display:flex; align-items:center; justify-content:center; gap:0.4rem;
          padding:0.75rem; background:white; color:#4f46e5; font-weight:600; font-size:0.875rem;
          border:1.5px solid #c7d2fe; border-radius:10px; cursor:pointer; transition:all 0.2s;
        }
        .action-btn-secondary:hover { background:#f0f4ff; }

        /* Placeholder card */
        .placeholder-card {
          background:linear-gradient(135deg,#f0f9ff,#e0e7ff);
          border-radius:20px; border:1.5px solid #c7d2fe;
          padding:2.5rem 2rem; display:flex; flex-direction:column; align-items:center; text-align:center;
          box-shadow:0 4px 20px rgba(99,102,241,0.08);
        }
        .placeholder-icon { width:96px; height:96px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; box-shadow:0 4px 16px rgba(59,130,246,0.15); }
        .placeholder-card h3 { font-size:1.25rem; font-weight:700; color:#1e3a8a; margin-bottom:0.5rem; }
        .placeholder-card p { font-size:0.875rem; color:#475569; max-width:280px; line-height:1.6; margin-bottom:1.75rem; }

        .range-guide { width:100%; display:flex; flex-direction:column; gap:0.5rem; text-align:left; }
        .range-item { display:flex; align-items:center; gap:0.75rem; background:white; border-radius:8px; padding:0.5rem 0.875rem; }
        .range-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .range-label { font-size:0.85rem; font-weight:600; color:#374151; flex:1; }
        .range-val { font-size:0.8rem; color:#9ca3af; }

        @media (max-width:768px) {
          .bmi-grid { grid-template-columns:1fr; }
          .bmi-ref-cards { display:grid; grid-template-columns:1fr 1fr; }
          .page-title-block { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </>
  );
}