import mongoose from 'mongoose';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corps de requête JSON invalide' });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ champ: e.path, message: e.message }));
    return res.status(400).json({ message: details[0].message, details });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Valeur invalide pour le champ ${err.path}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    const labels = { reference: 'Cette référence de machine', email: 'Cette adresse e-mail' };
    return res.status(409).json({ message: `${labels[field] || field} est déjà utilisé(e)` });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error('[Erreur serveur]', err);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }

  const body = { message: err.message };
  if (err.details) body.details = err.details;
  return res.status(statusCode).json(body);
};
