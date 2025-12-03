'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FeedbackForm() {
    const searchParams = useSearchParams();
    const newsletterId = searchParams.get('newsletterId');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!newsletterId) {
            alert('No newsletter ID found.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newsletterId, rating, comment }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert('Failed to submit feedback.');
            }
        } catch (error) {
            console.error(error);
            alert('Error submitting feedback.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center fade-in">
                <h2 className="text-2xl font-bold mb-4 text-green-400">Thank You!</h2>
                <p className="text-slate-300">Your feedback helps us improve your next newsletter.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <label className="block text-sm mb-2">Rate this newsletter</label>
                <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-600'
                                }`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm mb-2">Any comments?</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="input-field min-h-[100px]"
                    placeholder="What did you like? What can be improved?"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !newsletterId}
                className="btn-primary w-full"
            >
                {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>

            {!newsletterId && (
                <p className="text-red-400 text-sm mt-2">
                    Error: No newsletter ID provided in URL.
                </p>
            )}
        </div>
    );
}

export default function FeedbackPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="glass-card p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-center">Feedback</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <FeedbackForm />
                </Suspense>
            </div>
        </main>
    );
}
