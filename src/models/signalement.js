import mongoose from 'mongoose';

const signalementSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'machine',
      required: true,
    },
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ouvert', 'en cours', 'résolu'],
      default: 'ouvert',
    },
    noteResolution: {
      type: String,
      trim: true,
    },
    dateResolution: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Signalement = mongoose.model('Signalement', signalementSchema);
export default Signalement;
