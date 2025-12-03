import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchNews, fetchContent, summarizeContent } from '@/lib/agents';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

async function generateForSubscription(subscriptionId: string, force: boolean = false) {
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
            topics: true,
            user: true
        },
    });

    if (!subscription) throw new Error('Subscription not found');

    const lastNewsletter = await prisma.newsletter.findFirst({
        where: { subscriptionId: subscription.id },
        orderBy: { sentAt: 'desc' },
    });

    const lastSentDate = lastNewsletter ? lastNewsletter.sentAt : new Date(0);
    const now = new Date();
    const diffDays = (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24);

    // Frequency Check (Skip if force is true)
    if (!force) {
        if (subscription.deliveryFreq === 'Weekly') {
            // Check if enough time passed AND it's the right day
            if (diffDays < 6) { // Allow some buffer
                console.log(`Skipping ${subscription.user.email} (Sub ${subscription.id}): Weekly freq, not due yet.`);
                return null;
            }
            if (subscription.deliveryDay !== null && now.getDay() !== subscription.deliveryDay) {
                console.log(`Skipping ${subscription.user.email} (Sub ${subscription.id}): Wrong day of week (Today: ${now.getDay()}, Target: ${subscription.deliveryDay})`);
                return null;
            }
        } else if (subscription.deliveryFreq === 'Daily' && diffDays < 0.9) {
            console.log(`Skipping ${subscription.user.email} (Sub ${subscription.id}): Daily freq, already sent today.`);
            return null;
        }
    }

    const searchFromDate = lastNewsletter ? lastNewsletter.sentAt : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let allArticles: { title: string; link: string; text: string }[] = [];

    for (const topic of subscription.topics) {
        const results = await searchNews(topic.name, searchFromDate);
        for (const result of results) {
            const text = await fetchContent(result.link);
            if (text.length > 500) {
                allArticles.push({ title: result.title, link: result.link, text });
            }
        }
    }

    if (allArticles.length === 0) return null;

    const topArticles = allArticles.slice(0, 5);
    const newsletterContent = await summarizeContent(topArticles);

    const newsletter = await prisma.newsletter.create({
        data: {
            content: newsletterContent,
            subscriptionId: subscription.id,
        },
    });

    await sendEmail(subscription.user.email, `Your NewsPulse Digest (${subscription.deliveryFreq})`, newsletterContent);
    return newsletter;
}

export async function POST(request: Request) {
    try {
        const { subscriptionId } = await request.json();
        if (!subscriptionId) return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });

        const newsletter = await generateForSubscription(subscriptionId);
        if (!newsletter) return NextResponse.json({ message: 'No news found or not due' });

        return NextResponse.json({ success: true, newsletterId: newsletter.id });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Cron job endpoint - generates for ALL subscriptions
    try {
        const subscriptions = await prisma.subscription.findMany();
        const results = [];

        for (const sub of subscriptions) {
            try {
                const newsletter = await generateForSubscription(sub.id);
                if (newsletter) results.push({ id: sub.id, status: 'sent' });
                else results.push({ id: sub.id, status: 'skipped' });
            } catch (e) {
                console.error(`Failed for sub ${sub.id}`, e);
                results.push({ id: sub.id, status: 'error' });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
