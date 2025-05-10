// chat.ts (Message Model and API Handlers)
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Explicitly set the collection name to 'chat'
const ChatMessage = mongoose.model('ChatMessage', chatSchema, 'chat');

const chat = {
  model: ChatMessage,

  init: (connection: mongoose.Connection) => {
    chat.model = connection.model('ChatMessage', chatSchema, 'chat');
  },

  get: [
    async (req, res) => {
      try {
        const { user1, user2 } = req.query;

        const query = user1 && user2
          ? {
              $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
              ]
            }
          : {};

        const messages = await chat.model
          .find(query)
          .sort({ timestamp: -1 })
          .limit(50);

        res.json(messages);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  ],

  post: [
    async (req, res) => {
      const { sender, receiver, message } = req.body;
      if (!sender || !receiver || !message) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }

      try {
        const chatMsg = new chat.model({ sender, receiver, message });
        await chatMsg.save();
        res.status(201).json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  ]
};

export default chat;
