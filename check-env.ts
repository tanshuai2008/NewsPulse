import 'dotenv/config';

console.log('Checking environment variables...');
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set (length: ' + process.env.DATABASE_URL.length + ')');
} else {
    console.error('DATABASE_URL is NOT set');
}
