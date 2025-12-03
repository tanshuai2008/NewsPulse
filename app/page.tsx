'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    jobTitle: '',
    industry: '',
    topics: '',
    deliveryTime: '08:00',
    deliveryFreq: 'Daily',
    deliveryMethod: 'Email Text',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        // Trigger first newsletter generation immediately for demo
        await fetch('/api/newsletter/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        });
        alert('Setup complete! Check your console/email for the first newsletter.');
        setStep(4); // Success step
      } else {
        alert('Something went wrong.');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="glass-card p-8 max-w-2xl w-full fade-in">
        <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          NewsPulse
        </h1>
        <p className="text-slate-400 text-center mb-8">Your AI-powered personalized newsletter.</p>

        {step === 1 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-xl font-semibold mb-4">Tell us about your work</h2>
            <div>
              <label className="block text-sm mb-1">Job Title</label>
              <input
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Industry</label>
              <input
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Technology"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Topics (comma separated)</label>
              <input
                name="topics"
                value={formData.topics}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. AI Agents, Web Development, Space"
              />
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={nextStep} className="btn-primary">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <div>
              <label className="block text-sm mb-1">Delivery Time</label>
              <input
                type="time"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Frequency</label>
              <select
                name="deliveryFreq"
                value={formData.deliveryFreq}
                onChange={handleChange}
                className="input-field"
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Delivery Method</label>
              <select
                name="deliveryMethod"
                value={formData.deliveryMethod}
                onChange={handleChange}
                className="input-field"
              >
                <option>Email Text</option>
                <option>Audio Attachment</option>
              </select>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={prevStep} className="text-slate-400 hover:text-white">Back</button>
              <button onClick={nextStep} className="btn-primary">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-xl font-semibold mb-4">Contact Info</h2>
            <div>
              <label className="block text-sm mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={prevStep} className="text-slate-400 hover:text-white">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                {loading ? 'Setting up...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center fade-in">
            <h2 className="text-2xl font-bold mb-4 text-green-400">All Set!</h2>
            <p className="text-slate-300 mb-6">
              Your preferences have been saved. We are generating your first newsletter now.
            </p>
            <p className="text-sm text-slate-500">
              Check your email (or console logs) shortly.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
