import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { addMedicalRecord } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AddMedicalRecord() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bloodPressure: '',
    bloodSugar: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.bloodPressure) newErrors.bloodPressure = 'Blood pressure is required';
    else if (!/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure)) newErrors.bloodPressure = 'Use format 120/80';
    if (!formData.bloodSugar) newErrors.bloodSugar = 'Blood sugar is required';
    else if (isNaN(formData.bloodSugar) || parseFloat(formData.bloodSugar) <= 0) newErrors.bloodSugar = 'Enter a valid blood sugar value';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const data = await addMedicalRecord(formData);
      if (data.success) {
        setMessage({ text: 'Health record saved successfully! Redirecting…', type: 'success' });
        setFormData({ date: new Date().toISOString().split('T')[0], bloodPressure: '', bloodSugar: '', notes: '' });
        setTimeout(() => router.push('/records'), 2000);
      } else {
        setMessage({ text: data.error || 'Failed to save medical record', type: 'error' });
      }
    } catch {
      setMessage({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Add Health Record | DiaBP Diet Consultant</title>
        <meta name="description" content="Add a new blood pressure and blood sugar reading to track your health progress" />
      </Head>

      <div className="add-record-page">
        {/* Back link */}
        <Link href="/records" className="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Records
        </Link>

        {/* Header */}
        <div className="page-header">
          <div className="page-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Add Health Record</h1>
            <p className="page-subtitle">Log your blood pressure and blood sugar for today</p>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`message-banner ${message.type === 'success' ? 'msg-success' : 'msg-error'}`}>
            {message.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        <div className="form-layout">
          {/* Main Form Card */}
          <div className="form-card">
            <div className="form-card-title">
              <h2>Health Information</h2>
              <p>Fields marked with <span className="required-star">*</span> are required</p>
            </div>

            <form onSubmit={handleSubmit} className="record-form">
              <div className="form-grid">
                {/* Date */}
                <div className="field">
                  <label htmlFor="date" className="field-label">
                    📅 Date <span className="required-star">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`field-input ${errors.date ? 'field-error' : ''}`}
                  />
                  {errors.date && <p className="error-msg">{errors.date}</p>}
                </div>

                {/* Blood Pressure */}
                <div className="field">
                  <label htmlFor="bloodPressure" className="field-label">
                    🩺 Blood Pressure <span className="required-star">*</span>
                  </label>
                  <div className="input-combo">
                    <input
                      type="text"
                      id="bloodPressure"
                      name="bloodPressure"
                      value={formData.bloodPressure}
                      onChange={handleChange}
                      placeholder="e.g. 120/80"
                      className={`field-input ${errors.bloodPressure ? 'field-error' : ''}`}
                    />
                    <span className="input-unit">mmHg</span>
                  </div>
                  {errors.bloodPressure ? (
                    <p className="error-msg">{errors.bloodPressure}</p>
                  ) : (
                    <p className="field-hint">Systolic / Diastolic (e.g. 120/80)</p>
                  )}
                </div>

                {/* Blood Sugar */}
                <div className="field">
                  <label htmlFor="bloodSugar" className="field-label">
                    🩸 Blood Sugar <span className="required-star">*</span>
                  </label>
                  <div className="input-combo">
                    <input
                      type="number"
                      id="bloodSugar"
                      name="bloodSugar"
                      value={formData.bloodSugar}
                      onChange={handleChange}
                      placeholder="e.g. 95"
                      min="1"
                      className={`field-input ${errors.bloodSugar ? 'field-error' : ''}`}
                    />
                    <span className="input-unit">mg/dL</span>
                  </div>
                  {errors.bloodSugar ? (
                    <p className="error-msg">{errors.bloodSugar}</p>
                  ) : (
                    <p className="field-hint">Fasting glucose — normal range: 70–100 mg/dL</p>
                  )}
                </div>

                {/* Notes */}
                <div className="field col-span-2">
                  <label htmlFor="notes" className="field-label">📝 Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Optional: Include notes about medications, diet changes, exercise, or how you're feeling today…"
                    className="field-input field-textarea"
                  />
                  <p className="field-hint">Optional but recommended for context</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="button" onClick={() => router.push('/records')} className="cancel-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Panel */}
          <div className="info-panel">
            <div className="info-card">
              <h3 className="info-title">📊 Reference Ranges</h3>
              <div className="ref-rows">
                <div className="ref-row">
                  <span className="ref-label">Normal BP</span>
                  <span className="ref-val ref-normal">Less than 120/80</span>
                </div>
                <div className="ref-row">
                  <span className="ref-label">Elevated BP</span>
                  <span className="ref-val ref-warn">120–129/80</span>
                </div>
                <div className="ref-row">
                  <span className="ref-label">High BP</span>
                  <span className="ref-val ref-danger">130+ / 80+</span>
                </div>
                <div className="ref-divider" />
                <div className="ref-row">
                  <span className="ref-label">Normal Sugar</span>
                  <span className="ref-val ref-normal">70–100 mg/dL</span>
                </div>
                <div className="ref-row">
                  <span className="ref-label">Pre-diabetic</span>
                  <span className="ref-val ref-warn">100–125 mg/dL</span>
                </div>
                <div className="ref-row">
                  <span className="ref-label">Diabetic</span>
                  <span className="ref-val ref-danger">126+ mg/dL</span>
                </div>
              </div>
            </div>

            <div className="info-tip">
              <div className="info-tip-icon">💡</div>
              <div>
                <p className="info-tip-title">Why track regularly?</p>
                <p className="info-tip-desc">Regular monitoring helps our AI generate more accurate personalized diet plans based on trends in your health data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .add-record-page { max-width:960px; margin:0 auto; padding:1.5rem 1rem 3rem; animation:fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .back-link { display:inline-flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:500; color:#6b7280; text-decoration:none; margin-bottom:1.25rem; transition:color 0.15s; }
        .back-link:hover { color:#2563eb; }

        .page-header { display:flex; align-items:center; gap:1rem; margin-bottom:2rem; }
        .page-icon { width:56px; height:56px; background:linear-gradient(135deg,#0d9488,#2563eb); border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(13,148,136,0.3); flex-shrink:0; }
        .page-title { font-size:1.75rem; font-weight:800; color:#111827; letter-spacing:-0.025em; }
        .page-subtitle { font-size:0.85rem; color:#6b7280; margin-top:0.15rem; }

        .message-banner { display:flex; align-items:center; gap:0.5rem; padding:0.875rem 1.25rem; border-radius:10px; font-size:0.875rem; font-weight:500; margin-bottom:1.5rem; }
        .msg-success { background:#f0fdf4; border:1px solid #86efac; color:#15803d; }
        .msg-error { background:#fef2f2; border:1px solid #fca5a5; color:#b91c1c; }

        .form-layout { display:grid; grid-template-columns:1fr 300px; gap:1.5rem; }

        .form-card { background:white; border-radius:20px; border:1.5px solid #e5e7eb; padding:2rem; box-shadow:0 4px 20px rgba(0,0,0,0.05); }
        .form-card-title { margin-bottom:1.5rem; }
        .form-card-title h2 { font-size:1.1rem; font-weight:700; color:#111827; margin-bottom:0.25rem; }
        .form-card-title p { font-size:0.8rem; color:#9ca3af; }
        .required-star { color:#ef4444; }

        .record-form { }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem; }
        .col-span-2 { grid-column:1/-1; }

        .field { }
        .field-label { display:block; font-size:0.875rem; font-weight:600; color:#374151; margin-bottom:0.4rem; }
        .input-combo { position:relative; }
        .field-input {
          width:100%; padding:0.75rem 1rem;
          border:1.5px solid #e5e7eb; border-radius:10px;
          font-size:0.9rem; color:#111827; background:#fafafa; outline:none;
          transition:border-color 0.15s, box-shadow 0.15s;
        }
        .input-combo .field-input { padding-right:3rem; }
        .field-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12); background:white; }
        .field-input.field-error { border-color:#ef4444; }
        .field-textarea { resize:vertical; min-height:100px; font-family:inherit; }
        .input-unit { position:absolute; right:0.875rem; top:50%; transform:translateY(-50%); font-size:0.78rem; font-weight:600; color:#9ca3af; pointer-events:none; }
        .error-msg { font-size:0.78rem; color:#ef4444; margin-top:0.25rem; }
        .field-hint { font-size:0.75rem; color:#9ca3af; margin-top:0.25rem; }

        .form-actions { display:flex; align-items:center; justify-content:space-between; padding-top:1.25rem; border-top:1px solid #f3f4f6; }
        .cancel-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.625rem 1rem; background:white; color:#6b7280; font-size:0.875rem; font-weight:500; border:1.5px solid #e5e7eb; border-radius:10px; cursor:pointer; transition:all 0.15s; }
        .cancel-btn:hover { color:#374151; border-color:#d1d5db; }
        .submit-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.75rem 1.75rem; background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; font-size:0.875rem; font-weight:600; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px rgba(79,70,229,0.3); transition:all 0.2s; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 16px rgba(79,70,229,0.4); }
        .submit-btn:disabled { opacity:0.7; cursor:not-allowed; }

        /* Info Panel */
        .info-panel { display:flex; flex-direction:column; gap:1rem; }
        .info-card { background:white; border-radius:16px; border:1.5px solid #e5e7eb; padding:1.5rem; box-shadow:0 2px 10px rgba(0,0,0,0.04); }
        .info-title { font-size:0.9rem; font-weight:700; color:#111827; margin-bottom:1rem; }
        .ref-rows { display:flex; flex-direction:column; gap:0.625rem; }
        .ref-row { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
        .ref-label { font-size:0.8rem; color:#6b7280; }
        .ref-val { font-size:0.78rem; font-weight:600; padding:0.2rem 0.5rem; border-radius:99px; white-space:nowrap; }
        .ref-normal { background:#f0fdf4; color:#15803d; }
        .ref-warn   { background:#fffbeb; color:#b45309; }
        .ref-danger { background:#fef2f2; color:#b91c1c; }
        .ref-divider { height:1px; background:#f3f4f6; margin:0.25rem 0; }
        .info-tip { background:linear-gradient(135deg,#eff6ff,#e0e7ff); border:1.5px solid #c7d2fe; border-radius:14px; padding:1.25rem; display:flex; gap:0.875rem; }
        .info-tip-icon { font-size:1.5rem; flex-shrink:0; }
        .info-tip-title { font-size:0.875rem; font-weight:700; color:#1e3a8a; margin-bottom:0.35rem; }
        .info-tip-desc { font-size:0.8rem; color:#475569; line-height:1.55; }

        @media (max-width:768px) {
          .form-layout { grid-template-columns:1fr; }
          .form-grid { grid-template-columns:1fr; }
          .col-span-2 { grid-column:1; }
          .info-panel { flex-direction:row; flex-wrap:wrap; }
          .info-card, .info-tip { flex:1; min-width:240px; }
        }
      `}</style>
    </>
  );
}