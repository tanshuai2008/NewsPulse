import { prisma } from './lib/prisma';

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                subscriptions: {
                    include: { topics: true }
                }
            },
        });

        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}`);
            console.log(`  Email: ${u.email}`);
            u.subscriptions.forEach(sub => {
                console.log(`  Sub (${sub.deliveryFreq}): ${sub.topics.map(t => t.name).join(', ')}`);
            });
        });
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
