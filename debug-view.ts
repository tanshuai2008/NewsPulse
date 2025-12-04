import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
    try {
        console.log('--- Debugging Newsletter View ---');

        const newsletter = await prisma.newsletter.findFirst({
            orderBy: { sentAt: 'desc' },
            include: {
                subscription: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!newsletter) {
            console.log('No newsletters found.');
            return;
        }

        console.log(`Newsletter ID: ${newsletter.id}`);
        console.log(`Sent At: ${newsletter.sentAt}`);
        console.log(`Subscription ID: ${newsletter.subscriptionId}`);

        if (newsletter.subscription) {
            console.log(`User Email: ${newsletter.subscription.user.email}`);
        } else {
            console.error('ERROR: Subscription is missing!');
        }

        console.log('Content Preview:');
        console.log(newsletter.content.slice(0, 200));
        console.log(`Content Length: ${newsletter.content.length}`);

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
