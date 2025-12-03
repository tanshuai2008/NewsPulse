import { prisma } from './lib/prisma';

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: { topics: true },
        });

        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Topics: ${u.topics.map(t => t.name).join(', ')}`);
        });
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
