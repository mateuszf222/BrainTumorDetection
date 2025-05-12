// chat.ts (Message Model and API Handlers)
import mongoose from 'mongoose';

import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); // Store uploaded files in /uploads/

const chatSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String },
  image: { type: String }, // Add image field
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'delivered' } // 'delivered' | 'read'
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
    upload.single('image'), // Handle optional image upload
    async (req, res) => {
      const { sender, receiver, message } = req.body;
      const image = req.file?.filename;

      if (!sender || !receiver || (!message && !image)) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }

      try {
        const chatMsg = new chat.model({
          sender,
          receiver,
          message: message || null,
          image: image || null
        });
        await chatMsg.save();
        res.status(201).json({ success: true, message: 'Message stored successfully.' });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  ]
};

export default chat;
