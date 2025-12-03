import { prisma } from './lib/prisma';

async function main() {
    try {
        const newsletters = await prisma.newsletter.findMany({
            include: { user: true },
            orderBy: { sentAt: 'desc' },
            take: 5
        });

        console.log(`Found ${newsletters.length} newsletters.`);
        newsletters.forEach(n => {
            console.log(`- ID: ${n.id}`);
            console.log(`  To: ${n.user.email}`);
            console.log(`  Sent At: ${n.sentAt}`);
            console.log(`  Content Length: ${n.content.length}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error checking newsletters:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
