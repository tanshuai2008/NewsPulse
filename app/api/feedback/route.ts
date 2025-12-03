import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { newsletterId, rating, comment } = await request.json();

        if (!newsletterId || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const feedback = await prisma.feedback.create({
            data: {
                newsletterId,
                rating: parseInt(rating),
                comment,
            },
        });

        return NextResponse.json({ success: true, feedback });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
}
