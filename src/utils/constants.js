export const MACHINE_STATUSES = ['disponible', 'en maintenance', 'hors service'];

export const SIGNALEMENT_STATUSES = ['ouvert', 'en cours', 'résolu'];

// Cycle de vie d'un signalement : ouvert -> en cours -> résolu (statut final)
export const SIGNALEMENT_TRANSITIONS = {
  ouvert: ['en cours'],
  'en cours': ['résolu'],
  résolu: [],
};
