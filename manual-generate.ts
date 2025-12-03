import { prisma } from './lib/prisma';
import { searchNews, fetchContent, summarizeContent } from './lib/agents';
import { sendEmail } from './lib/email';

async function main() {
    const userEmail = 'tanshuai2008@gmail.com'; // Hardcoded for debugging based on previous output

    try {
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: {
                subscriptions: {
                    include: { topics: true }
                }
            },
        });

        if (!user || user.subscriptions.length === 0) {
            console.error('User or subscription not found');
            return;
        }

        const subscription = user.subscriptions[0];
        console.log(`Generating newsletter for ${user.email} (Sub ID: ${subscription.id})...`);
        console.log(`Topics: ${subscription.topics.map(t => t.name).join(', ')}`);

        let allArticles: { title: string; link: string; text: string }[] = [];

        const lastSentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const topic of subscription.topics) {
            console.log(`Searching for: ${topic.name}`);
            const results = await searchNews(topic.name, lastSentDate);
            console.log(`Found ${results.length} results.`);

            for (const result of results) {
                console.log(`Fetching: ${result.link}`);
                const text = await fetchContent(result.link);
                console.log(`Fetched ${text.length} chars.`);
                if (text.length > 500) {
                    allArticles.push({
                        title: result.title,
                        link: result.link,
                        text,
                    });
                }
            }
        }

        if (allArticles.length === 0) {
            console.log('No articles found.');
            return;
        }

        console.log('Summarizing...');
        const topArticles = allArticles.slice(0, 5);
        const newsletterContent = await summarizeContent(topArticles);
        console.log('Summary generated.');
        console.log(newsletterContent.slice(0, 200) + '...');

        const newsletter = await prisma.newsletter.create({
            data: {
                content: newsletterContent,
                subscriptionId: subscription.id,
            },
        });

        console.log(`Newsletter saved with ID: ${newsletter.id}`);
        await sendEmail(user.email, 'Your NewsPulse Digest', newsletterContent);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
