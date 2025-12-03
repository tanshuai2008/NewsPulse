'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subscription {
  topics: string;
  deliveryFreq: string;
  deliveryTime: string;
  deliveryDay: string; // "0"-"6"
  deliveryMethod: string;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState({
    email: '',
    jobTitle: '',
    industry: '',
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { topics: '', deliveryFreq: 'Daily', deliveryTime: '08:00', deliveryDay: '1', deliveryMethod: 'Email Text' }
  ]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubChange = (index: number, field: keyof Subscription, value: string) => {
    const newSubs = [...subscriptions];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setSubscriptions(newSubs);
  };

  const addSubscription = () => {
    setSubscriptions([...subscriptions, { topics: '', deliveryFreq: 'Daily', deliveryTime: '08:00', deliveryDay: '1', deliveryMethod: 'Email Text' }]);
  };

  const removeSubscription = (index: number) => {
    if (subscriptions.length > 1) {
      setSubscriptions(subscriptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, subscriptions }),
      });

      if (res.ok) {
        const data = await res.json();
        // Trigger generation for the first subscription as demo
        if (data.user.subscriptions.length > 0) {
          await fetch('/api/newsletter/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionId: data.user.subscriptions[0].id }),
          });
        }
        alert('Setup complete! Check your email.');
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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="glass-card p-8 max-w-4xl w-full fade-in">
        <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          NewsPulse
        </h1>
        <p className="text-slate-400 text-center mb-8">Manage your newsletter subscriptions.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">User Info</h2>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input name="email" value={user.email} onChange={handleUserChange} className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm mb-1">Job Title</label>
              <input name="jobTitle" value={user.jobTitle} onChange={handleUserChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm mb-1">Industry</label>
              <input name="industry" value={user.industry} onChange={handleUserChange} className="input-field" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-700 pb-2">Subscriptions</h2>
            {subscriptions.map((sub, index) => (
              <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative">
                {subscriptions.length > 1 && (
                  <button onClick={() => removeSubscription(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-sm">Remove</button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Topics (comma separated)</label>
                    <input
                      value={sub.topics}
                      onChange={(e) => handleSubChange(index, 'topics', e.target.value)}
                      className="input-field"
                      placeholder="e.g. AI, Space, Cooking"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Frequency</label>
                    <select
                      value={sub.deliveryFreq}
                      onChange={(e) => handleSubChange(index, 'deliveryFreq', e.target.value)}
                      className="input-field"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                  {sub.deliveryFreq === 'Weekly' && (
                    <div>
                      <label className="block text-sm mb-1">Day of Week</label>
                      <select
                        value={sub.deliveryDay}
                        onChange={(e) => handleSubChange(index, 'deliveryDay', e.target.value)}
                        className="input-field"
                      >
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm mb-1">Time</label>
                    <input
                      type="time"
                      value={sub.deliveryTime}
                      onChange={(e) => handleSubChange(index, 'deliveryTime', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Method</label>
                    <select
                      value={sub.deliveryMethod}
                      onChange={(e) => handleSubChange(index, 'deliveryMethod', e.target.value)}
                      className="input-field"
                    >
                      <option>Email Text</option>
                      <option>Audio Attachment</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addSubscription} className="text-blue-400 hover:text-blue-300 text-sm">+ Add another subscription</button>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full md:w-auto px-12">
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </main>
  );
}
