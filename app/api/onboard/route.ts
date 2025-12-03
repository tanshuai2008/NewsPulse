import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user: userInfo, subscriptions } = body;

        if (!userInfo?.email || !subscriptions || !Array.isArray(subscriptions)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Create or update user
        const user = await prisma.user.upsert({
            where: { email: userInfo.email },
            update: {
                jobTitle: userInfo.jobTitle,
                industry: userInfo.industry,
                // Delete old subscriptions to replace with new ones (simplest sync strategy)
                subscriptions: {
                    deleteMany: {},
                    create: subscriptions.map((sub: any) => ({
                        deliveryFreq: sub.deliveryFreq,
                        deliveryTime: sub.deliveryTime,
                        deliveryDay: sub.deliveryDay ? parseInt(sub.deliveryDay) : null,
                        deliveryMethod: sub.deliveryMethod,
                        topics: {
                            create: sub.topics.split(',').map((t: string) => ({ name: t.trim() })),
                        },
                    })),
                },
            },
            create: {
                email: userInfo.email,
                jobTitle: userInfo.jobTitle,
                industry: userInfo.industry,
                subscriptions: {
                    create: subscriptions.map((sub: any) => ({
                        deliveryFreq: sub.deliveryFreq,
                        deliveryTime: sub.deliveryTime,
                        deliveryDay: sub.deliveryDay ? parseInt(sub.deliveryDay) : null,
                        deliveryMethod: sub.deliveryMethod,
                        topics: {
                            create: sub.topics.split(',').map((t: string) => ({ name: t.trim() })),
                        },
                    })),
                },
            },
            include: {
                subscriptions: true,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
