import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewsletterDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    console.log(`[NewsletterDetail] Rendering for ID: ${id}`);
    const newsletter = await prisma.newsletter.findUnique({
        where: { id },
        include: {
            subscription: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!newsletter) {
        console.log(`[NewsletterDetail] Newsletter not found: ${id}`);
        notFound();
    }

    const userEmail = newsletter.subscription?.user?.email || 'Unknown User';
    const sentDate = newsletter.sentAt ? new Date(newsletter.sentAt).toISOString().split('T')[0] : 'Unknown Date';

    return (
        <main className="min-h-screen p-8 bg-white text-slate-900">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex justify-between items-center border-b pb-4">
                    <div>
                        <Link href="/newsletters" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                            ← Back to Archive
                        </Link>
                        <p className="text-sm text-slate-500">
                            Sent to: {userEmail} on {sentDate}
                        </p>
                    </div>
                </div>

                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: newsletter.content }}
                />
            </div>
        </main>
    );
}
