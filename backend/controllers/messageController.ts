import { Request, Response } from 'express';
import db from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const list = await db.messages.find();
    // Return in chronological order
    const sorted = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    res.json({
      success: true,
      count: sorted.length,
      messages: sorted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { text = '', channel = 'engineering-sync', attachments = [] } = req.body;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if ((!text || !text.trim()) && !hasAttachments) {
      return res.status(400).json({ success: false, message: 'Message text or attachment is required' });
    }

    const user = req.user;
    const cleanText = text ? text.trim() : '';
    const newMsg = await db.messages.create({
      userId: user?._id || 'anonymous',
      userName: user?.name || 'Engineer',
      userAvatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=eng',
      userRole: user?.role || 'developer',
      text: cleanText,
      channel,
      isAiResponse: false,
      attachments: hasAttachments ? attachments : [],
    });

    const lower = cleanText.toLowerCase();

    // Check if a specific team member was @mentioned
    const allUsers = await db.users.find();
    for (const member of allUsers) {
      const firstName = member.name.split(' ')[0].toLowerCase();
      if (
        lower.includes(`@${firstName}`) ||
        lower.includes(`@${member.name.toLowerCase()}`)
      ) {
        // If mentioned member is not the current sender, post a realistic quick acknowledgment in chatbox
        if (member._id !== user?._id) {
          setTimeout(async () => {
            let replyText = `Thanks @${(user?.name || 'Alex').split(' ')[0]}, I'm looking into this right now and will update the sprint board shortly.`;
            if (member.role === 'qa') {
              replyText = `Got it @${(user?.name || 'Alex').split(' ')[0]}! Running the E2E regression suite on staging now.`;
            } else if (member.role === 'lead') {
              replyText = `Ack @${(user?.name || 'Alex').split(' ')[0]} — I'll review the PR and check the database query plan.`;
            }
            await db.messages.create({
              userId: member._id,
              userName: member.name,
              userAvatar: member.avatar,
              userRole: member.role,
              text: replyText,
              channel,
              isAiResponse: false,
            });
          }, 900);
        }
        break;
      }
    }

    // Check if the user addressed AI or asked for help
    if (lower.includes('@ai') || lower.includes('copilot') || lower.includes('help')) {
      setTimeout(async () => {
        let aiAnswer = 'I am your PulseDev Engineering Copilot. All services, Redis queues, and MongoDB connection pools are running optimally in Sprint 44.';
        if (lower.includes('index') || lower.includes('mongodb')) {
          aiAnswer = 'Tip: Always use the ESR (Equality, Sort, Range) rule for MongoDB compound indexes to avoid COLLSCAN stages on high-traffic queries.';
        } else if (lower.includes('review') || lower.includes('pr')) {
          aiAnswer = 'Make sure unit tests pass with Jest/Vitest and mutation coverage is above 85% before requesting QA sign-off.';
        } else if (lower.includes('deploy') || lower.includes('docker')) {
          aiAnswer = 'Deployment pipelines are armed. Blue/Green zero-downtime routing active on Kubernetes ingress.';
        }

        await db.messages.create({
          userId: 'pulse-ai-bot',
          userName: 'PulseDev AI Copilot',
          userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&h=128&q=80',
          userRole: 'admin',
          text: aiAnswer,
          channel,
          isAiResponse: true,
        });
      }, 500);
    }

    res.status(201).json({
      success: true,
      message: newMsg,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
