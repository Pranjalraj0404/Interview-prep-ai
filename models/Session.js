import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  experience: {
    type: String, // Keeping as String to be flexible (e.g. "5 years" or "5")
    required: true,
  },
  topics_to_focus: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
