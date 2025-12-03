import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchNews, fetchContent, summarizeContent } from '@/lib/agents';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Attempt to increase timeout to 60s

async function generateForSubscription(subscriptionId: string, force: boolean = false) {
    const logs: string[] = [];
    logs.push(`Starting generation for subscription ${subscriptionId} (Force: ${force})`);

    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
            topics: true,
            user: true
        },
    });

    if (!subscription) {
        logs.push('Error: Subscription not found');
        return { result: null, logs };
    }

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
            if (diffDays < 6) {
                logs.push(`Skipping: Weekly freq, not due yet. (Diff: ${diffDays.toFixed(2)} days)`);
                return { result: null, logs };
            }
            if (subscription.deliveryDay !== null && now.getDay() !== subscription.deliveryDay) {
                logs.push(`Skipping: Wrong day. (Today: ${now.getDay()}, Target: ${subscription.deliveryDay})`);
                return { result: null, logs };
            }
        } else if (subscription.deliveryFreq === 'Daily' && diffDays < 0.9) {
            logs.push(`Skipping: Daily freq, already sent today. (Diff: ${diffDays.toFixed(2)} days)`);
            return { result: null, logs };
        }
    }

    const searchFromDate = lastNewsletter ? lastNewsletter.sentAt : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let allArticles: { title: string; link: string; text: string }[] = [];

    for (const topic of subscription.topics) {
        logs.push(`Searching for topic: ${topic.name}`);
        try {
            const { results, error } = await searchNews(topic.name, searchFromDate);

            if (error) {
                logs.push(`Search Error for ${topic.name}: ${error}`);
            }

            logs.push(`Found ${results.length} results for ${topic.name}`);

            for (const result of results) {
                logs.push(`Fetching: ${result.link}`);
                const text = await fetchContent(result.link);
                if (text.length > 500) {
                    allArticles.push({ title: result.title, link: result.link, text });
                    logs.push(`Fetched ${text.length} chars (Success)`);
                } else {
                    logs.push(`Fetched ${text.length} chars (Skipped - too short)`);
                }
            }
        } catch (e) {
            logs.push(`Error searching topic ${topic.name}: ${e}`);
        }
    }

    if (allArticles.length === 0) {
        logs.push('No valid articles found after search and fetch.');
        return { result: null, logs };
    }

    logs.push(`Summarizing ${allArticles.length} articles...`);
    const topArticles = allArticles.slice(0, 3); // Reduced to 3 for performance
    const newsletterContent = await summarizeContent(topArticles);
    logs.push('Summary generated.');

    const newsletter = await prisma.newsletter.create({
        data: {
            content: newsletterContent,
            subscriptionId: subscription.id,
        },
    });
    logs.push(`Newsletter created with ID: ${newsletter.id}`);

    await sendEmail(subscription.user.email, `Your NewsPulse Digest (${subscription.deliveryFreq})`, newsletterContent);
    logs.push('Email sent.');

    return { result: newsletter, logs };
}

export async function POST(request: Request) {
    try {
        const { subscriptionId, force } = await request.json();
        if (!subscriptionId) return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });

        const { result, logs } = await generateForSubscription(subscriptionId, force);

        if (!result) {
            return NextResponse.json({
                message: 'No news found or not due',
                logs
            });
        }

        return NextResponse.json({
            success: true,
            newsletterId: result.id,
            logs
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Cron job endpoint - generates for ALL subscriptions
    try {
        const subscriptions = await prisma.subscription.findMany();
        const results = [];

        for (const sub of subscriptions) {
            try {
                const { result, logs } = await generateForSubscription(sub.id);
                if (result) results.push({ id: sub.id, status: 'sent', logs });
                else results.push({ id: sub.id, status: 'skipped', logs });
            } catch (e) {
                console.error(`Failed for sub ${sub.id}`, e);
                results.push({ id: sub.id, status: 'error', error: String(e) });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
