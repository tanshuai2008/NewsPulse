import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewsletterListPage() {
    const newsletters = await prisma.newsletter.findMany({
        include: {
            subscription: {
                include: {
                    user: true,
                },
            },
        },
        orderBy: {
            sentAt: 'desc',
        },
    });

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Newsletter Archive</h1>
                    <Link href="/" className="text-blue-400 hover:text-blue-300">
                        ← Back to Home
                    </Link>
                </div>

                <div className="grid gap-4">
                    {newsletters.map((newsletter) => (
                        <div key={newsletter.id} className="glass-card p-6 hover:bg-slate-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-2">
                                        Digest for {newsletter.subscription.user.email}
                                    </h2>
                                    <p className="text-slate-400 text-sm mb-2">
                                        Frequency: {newsletter.subscription.deliveryFreq}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        Sent: {new Date(newsletter.sentAt).toISOString().split('T')[0]}
                                    </p>
                                </div>
                                <Link
                                    href={`/newsletters/${newsletter.id}`}
                                    className="btn-primary"
                                >
                                    View Content
                                </Link>
                            </div>
                        </div>
                    ))}

                    {newsletters.length === 0 && (
                        <div className="text-center text-slate-400 py-12">
                            No newsletters generated yet.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
