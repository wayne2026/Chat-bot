import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatRateLimiter } from '../middleware/rateLimiter';
import Message from '../models/Message';
import { streamChat } from '../services/gemini';

const router = Router();

// Get chat history
router.post('/getMessageHistory', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const messages = await Message.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(messages.reverse());
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Send message and stream response
router.post('/message', authenticate, chatRateLimiter, async (req: AuthRequest, res: Response) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Save user message
        const userMessage = new Message({
            userId: req.userId,
            role: 'user',
            content: message
        });
        await userMessage.save();

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Get recent conversation history
        const recentMessages = await Message.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(10);

        const conversationHistory = recentMessages.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));
        //sending the whole history user msg and ai msg for context of the new resposne the will be recieved from the AI 
        let fullResponse = '';

        // Stream response from Gemini
        await streamChat(conversationHistory, (chunk: string) => {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        });

        // Save assistant response
        const assistantMessage = new Message({
            userId: req.userId,
            role: 'assistant',
            content: fullResponse
        });
        await assistantMessage.save();

        // Send completion event
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

    } catch (error) {
        console.error('Chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Failed to process message' })}\n\n`);
        res.end();
    }
});

export default router;
