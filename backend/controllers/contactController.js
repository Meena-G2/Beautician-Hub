const ContactMessage = require("../models/ContactMessage");

// POST /api/contact  (public)
const createMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  await ContactMessage.create({ name, email, subject, message });

  res.status(201).json({
    success: true,
    message: "Thank you! Your message has been received.",
  });
};

// GET /api/contact  (admin)
const getMessages = async (req, res) => {
  const messages = await ContactMessage.find().sort("-createdAt").limit(200);

  res.json({
    success: true,
    count: messages.length,
    unread: messages.filter((m) => !m.isRead).length,
    messages,
  });
};

// PUT /api/contact/:id/read  (admin)
const setRead = async (req, res) => {
  const item = await ContactMessage.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Message not found");
  }

  item.isRead = req.body.isRead;
  await item.save();

  res.json({ success: true, message: item });
};

// DELETE /api/contact/:id  (admin)
const deleteMessage = async (req, res) => {
  const item = await ContactMessage.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Message not found");
  }

  await item.deleteOne();
  res.json({ success: true, message: "Message deleted" });
};

module.exports = { createMessage, getMessages, setRead, deleteMessage };