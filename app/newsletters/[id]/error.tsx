'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Newsletter Detail Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
            <p className="text-slate-400 mb-4">
                We couldn't load this newsletter.
                {error.digest && <span className="block text-xs mt-2">Error Digest: {error.digest}</span>}
            </p>
            <button
                onClick={() => reset()}
                className="btn-primary"
            >
                Try again
            </button>
            <a href="/newsletters" className="mt-4 text-blue-400 hover:text-blue-300">
                Back to Archive
            </a>
        </div>
    );
}
