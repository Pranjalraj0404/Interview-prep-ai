import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    default: '',
  },
  is_pinned: {
    type: Boolean,
    default: false,
  },
  note: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
