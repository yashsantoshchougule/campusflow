import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
  sourceRef: String,
  blockId: mongoose.Schema.Types.ObjectId,
  quote: String
}, { _id: false });

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    default: 'mcq'
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 4;
      },
      message: 'Options must have exactly 4 items'
    }
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [String],
  citations: [citationSchema],
  orderIndex: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
});

questionSchema.index({ quizId: 1, orderIndex: 1 });

export const Question = mongoose.model('Question', questionSchema);