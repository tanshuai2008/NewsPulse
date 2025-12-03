import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            email,
            jobTitle,
            industry,
            topics,
            deliveryTime,
            deliveryFreq,
            deliveryMethod,
        } = body;

        // Basic validation
        if (!email || !jobTitle || !industry || !topics || !deliveryTime || !deliveryFreq || !deliveryMethod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create or update user
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                jobTitle,
                industry,
                deliveryTime,
                deliveryFreq,
                deliveryMethod,
                topics: {
                    deleteMany: {}, // Remove old topics
                    create: topics.split(',').map((t: string) => ({ name: t.trim() })),
                },
            },
            create: {
                email,
                jobTitle,
                industry,
                deliveryTime,
                deliveryFreq,
                deliveryMethod,
                topics: {
                    create: topics.split(',').map((t: string) => ({ name: t.trim() })),
                },
            },
            include: {
                topics: true,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
