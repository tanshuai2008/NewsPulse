import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchNews, fetchContent, summarizeContent } from '@/lib/agents';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

async function generateForUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { topics: true },
    });

    if (!user) throw new Error('User not found');

    const lastNewsletter = await prisma.newsletter.findFirst({
        where: { userId: user.id },
        orderBy: { sentAt: 'desc' },
    });

    const lastSentDate = lastNewsletter ? lastNewsletter.sentAt : new Date(0);

    // Check if due based on frequency
    const now = new Date();
    const diffDays = (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (user.deliveryFreq === 'Weekly' && diffDays < 7) {
        console.log(`Skipping ${user.email}: Weekly freq, last sent ${diffDays.toFixed(1)} days ago`);
        return null;
    }
    if (user.deliveryFreq === 'Monthly' && diffDays < 30) {
        console.log(`Skipping ${user.email}: Monthly freq, last sent ${diffDays.toFixed(1)} days ago`);
        return null;
    }
    if (user.deliveryFreq === 'Daily' && diffDays < 1) {
        console.log(`Skipping ${user.email}: Daily freq, last sent ${diffDays.toFixed(1)} days ago`);
        return null;
    }

    // Use 7 days lookback for context if it's the first time or long gap, 
    // otherwise use the actual last sent date for the search query.
    const searchFromDate = lastNewsletter ? lastNewsletter.sentAt : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let allArticles: { title: string; link: string; text: string }[] = [];

    for (const topic of user.topics) {
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
            userId: user.id,
        },
    });

    await sendEmail(user.email, 'Your NewsPulse Digest', newsletterContent);
    return newsletter;
}

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        const newsletter = await generateForUser(userId);
        if (!newsletter) return NextResponse.json({ message: 'No news found' });

        return NextResponse.json({ success: true, newsletterId: newsletter.id });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Cron job endpoint - generates for ALL users
    try {
        const users = await prisma.user.findMany();
        const results = [];

        for (const user of users) {
            try {
                const newsletter = await generateForUser(user.id);
                if (newsletter) results.push({ email: user.email, status: 'sent' });
                else results.push({ email: user.email, status: 'no_news' });
            } catch (e) {
                console.error(`Failed for ${user.email}`, e);
                results.push({ email: user.email, status: 'error' });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
