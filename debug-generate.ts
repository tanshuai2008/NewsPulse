import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { searchNews, fetchContent, summarizeContent } from '@/lib/agents';

async function main() {
    try {
        console.log('--- Starting Debug Generation ---');

        // 1. Get latest subscription
        const subscription = await prisma.subscription.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { topics: true, user: true }
        });

        if (!subscription) {
            console.error('No subscriptions found!');
            return;
        }

        console.log(`Debug for User: ${subscription.user.email}`);
        console.log(`Subscription ID: ${subscription.id}`);
        console.log(`Topics: ${subscription.topics.map(t => t.name).join(', ')}`);

        // 2. Test Search
        const searchFromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        let allArticles: { title: string; link: string; text: string }[] = [];

        for (const topic of subscription.topics) {
            console.log(`\nSearching for topic: "${topic.name}"...`);
            try {
                const { results, error } = await searchNews(topic.name, searchFromDate);
                if (error) console.error(`> Search Error: ${error}`);
                console.log(`> Found ${results.length} results.`);

                if (results.length > 0) {
                    console.log(`> First result: ${results[0].title} (${results[0].link})`);

                    // 3. Test Fetch
                    console.log(`> Fetching content for first result...`);
                    const text = await fetchContent(results[0].link);
                    console.log(`> Fetched ${text.length} characters.`);

                    if (text.length > 500) {
                        allArticles.push({ title: results[0].title, link: results[0].link, text });
                    } else {
                        console.log('> Content too short, skipping.');
                    }
                }
            } catch (e) {
                console.error(`> Error searching/fetching topic ${topic.name}:`, e);
            }
        }

        if (allArticles.length === 0) {
            console.error('\nFAILURE: No valid articles found for any topic.');
            return;
        }

        // 4. Test Summarization
        console.log('\nSummarizing content...');
        try {
            const summary = await summarizeContent(allArticles.slice(0, 1)); // Just summarize 1 for speed
            console.log('> Summary generated successfully.');
            console.log(`> Summary length: ${summary.length}`);
            console.log(`> Preview: ${summary.slice(0, 100)}...`);

            // 5. Test DB Save
            console.log('\nSaving to database...');
            const newsletter = await prisma.newsletter.create({
                data: {
                    content: summary,
                    subscriptionId: subscription.id
                }
            });
            console.log(`> SUCCESS! Newsletter created with ID: ${newsletter.id}`);

        } catch (e) {
            console.error('> Error during summarization or save:', e);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
