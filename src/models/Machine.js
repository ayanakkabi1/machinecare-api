import mongoose from 'mongoose';
import { MACHINE_STATUSES } from '../utils/constants.js';

const machineSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: [true, 'La référence est obligatoire'],
      unique: true,
      trim: true,
    },
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    workshop: {
      type: String,
      required: [true, "L'atelier est obligatoire"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: MACHINE_STATUSES,
        message: `Statut inconnu. Valeurs possibles : ${MACHINE_STATUSES.join(', ')}`,
      },
      default: 'disponible',
    },
  },
  { timestamps: true, versionKey: false }
);

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;
