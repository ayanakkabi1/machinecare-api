import mongoose from 'mongoose';
import { SIGNALEMENT_STATUSES } from '../utils/constants.js';

const signalementSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'La machine est obligatoire'],
      index: true,
    },
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: SIGNALEMENT_STATUSES,
        message: `Statut inconnu. Valeurs possibles : ${SIGNALEMENT_STATUSES.join(', ')}`,
      },
      default: 'ouvert',
      index: true,
    },
    noteResolution: {
      type: String,
      trim: true,
    },
    dateResolution: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true, versionKey: false }
);

const Signalement = mongoose.model('Signalement', signalementSchema);
export default Signalement;
