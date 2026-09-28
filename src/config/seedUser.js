import User from '../models/User.js';

export const seedInitialUser = async () => {
  const email = (process.env.INITIAL_USER_EMAIL || 'user@machinecare.com').toLowerCase().trim();
  const password = process.env.INITIAL_USER_PASSWORD || 'UserPassword123!';
  const name = process.env.INITIAL_USER_NAME || 'Default User';

  try {
    if (await User.exists({ email })) {
      console.log('Compte initial déjà présent.');
      return;
    }
    // Le mot de passe est haché par le hook pre('save') du modèle User
    await User.create({ name, email, password });
    console.log(`Compte initial créé : ${email}`);
  } catch (error) {
    console.error('Erreur lors de la création du compte initial :', error.message);
  }
};
