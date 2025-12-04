import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewsletterDetailPage({ params }: { params: { id: string } }) {
    console.log(`[NewsletterDetail] Rendering for ID: ${params.id}`);
    const newsletter = await prisma.newsletter.findUnique({
        where: { id: params.id },
        include: {
            subscription: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!newsletter) {
        console.log(`[NewsletterDetail] Newsletter not found: ${params.id}`);
        notFound();
    }

    return (
        <main className="min-h-screen p-8 bg-white text-slate-900">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex justify-between items-center border-b pb-4">
                    <div>
                        <Link href="/newsletters" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                            ← Back to Archive
                        </Link>
                        <p className="text-sm text-slate-500">
                            Sent to: {newsletter.subscription.user.email} on {newsletter.sentAt.toISOString().split('T')[0]}
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
