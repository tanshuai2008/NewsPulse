import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

export async function searchNews(topic: string, fromDate?: Date): Promise<{ results: SearchResult[], error?: string }> {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
        console.error('Missing Google Search API keys');
        return { results: [], error: 'Missing Google Search API keys (GOOGLE_API_KEY or GOOGLE_SEARCH_CX)' };
    }

    try {
        let query = `${topic} news`;
        if (fromDate) {
            const dateStr = fromDate.toISOString().split('T')[0];
            query += ` after:${dateStr}`;
        }

        const encodedQuery = encodeURIComponent(query);
        // Fetch up to 10 results (Google API max per page)
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodedQuery}&num=10`;
        console.log(`[Search] Requesting: ${url}`);

        const response = await fetch(url);
        const data = await response.json();
        console.log(`[Search] Response status: ${response.status}`);

        if (data.error) {
            console.error('[Search] API Error:', JSON.stringify(data.error, null, 2));
            return { results: [], error: `Google API Error: ${data.error.message} (Code: ${data.error.code})` };
        }

        if (!data.items) {
            console.log('[Search] No items found in response.');
            return { results: [], error: 'No items found in Google Search response' };
        }

        const results = data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        }));

        return { results };
    } catch (error) {
        console.error('Error searching news:', error);
        return { results: [], error: `Exception during search: ${String(error)}` };
    }
}

export async function fetchContent(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, and other non-content elements
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        $('header').remove();

        // Get text from paragraphs
        const text = $('p').map((i, el) => $(el).text()).get().join('\n\n');
        return text.slice(0, 10000); // Limit context window
    } catch (error) {
        console.error(`Error fetching content from ${url}:`, error);
        return '';
    }
}

export async function summarizeContent(contents: { title: string; link: string; text: string }[]): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt = `You are a professional newsletter editor. Summarize the following news articles into a cohesive newsletter.
  
  Requirements:
  1. Use MLA format for citations. When you state a fact or number, cite the source using the article number (e.g., [1]).
  2. At the end, list the Works Cited.
  3. The tone should be professional yet engaging.
  4. Focus on the most important information.
  5. Summarize each article in less than 100 words.
  
  Articles:
  `;

    contents.forEach((article, index) => {
        prompt += `\n\n[${index + 1}] Title: ${article.title}\nLink: ${article.link}\nContent: ${article.text}\n`;
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating summary:', error);
        return 'Failed to generate newsletter.';
    }
}
