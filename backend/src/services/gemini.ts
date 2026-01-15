import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export async function streamChat(
    messages: { role: string; content: string }[],
    onChunk: (text: string) => void
): Promise<void> {
    try {
        // Get API key at runtime, not at module load time
        const API_KEY = process.env.GEMINI_API_KEY as string;

        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        const genAI = new GoogleGenerativeAI(API_KEY);

        // Convert messages to Gemini format
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Get the model
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });


        const result = await model.generateContentStream({ contents });

        // Process the stream using async iterator
        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                onChunk(text);
            }
        }

    } catch (error: any) {
        console.error('Gemini error:', error);
        throw new Error(error.message || 'Failed to communicate with AI service');
    }
}
