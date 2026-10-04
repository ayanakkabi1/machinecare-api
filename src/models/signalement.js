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
      enum: ['ouvert', 'ferme'],
      default: 'ouvert',
    },
  },
  { timestamps: true }
);

const Signalement = mongoose.model('Signalement', signalementSchema);
export default Signalement;
