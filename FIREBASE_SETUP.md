# Branchement Firebase — infra_LVN

L'application est prête côté code. Elle reste volontairement en `demo` tant que le projet Firebase réel n'est pas configuré.

## 1. Créer le projet Firebase

Dans Firebase Console :
1. Créer un projet (nom conseillé : `infra-LVN`).
2. Ajouter une application **Web**.
3. Copier le bloc `firebaseConfig`.

## 2. Activer les services

### Authentication
Activer :
- **Anonyme** — utilisé en arrière-plan pour les agents terrain ; aucun compte ni mot de passe ne leur est demandé.
- **Adresse e-mail / Mot de passe** — utilisé uniquement par le compte Infra commun.

Créer ensuite **un seul compte Infra commun** dans Authentication > Users.

### Cloud Firestore
Créer la base Cloud Firestore.

### Storage
Activer Firebase Storage.

## 3. Renseigner le projet dans le code

Dans `js/firebase-config.js` :
- remplacer les valeurs `A_REMPLACER` par le bloc Firebase réel ;
- passer `APP_MODE` de `'demo'` à `'firebase'`.

## 4. Verrouiller le compte Infra

Dans :
- `firestore.rules`
- `storage.rules`

remplacer exactement :

`A_REMPLACER_EMAIL_INFRA`

par l'adresse e-mail du compte Infra commun.

Tant que cette valeur n'est pas remplacée, **aucun compte Infra ne peut accéder aux données** : c'est volontairement sécurisé par défaut.

## 5. Publier les règles

Déployer :
- `firestore.rules`
- `storage.rules`

Le fichier `firebase.json` est déjà présent pour un déploiement via Firebase CLI si souhaité.

## 6. Test fonctionnel attendu

1. Ouvrir `index.html`.
2. Signaler une anomalie sans connexion visible.
3. Vérifier la création dans Firestore et la photo dans Storage.
4. Ouvrir `infra.html`.
5. Se connecter avec le compte Infra.
6. Vérifier que la pièce devient rouge.
7. Passer l'anomalie en `En cours`, puis `Résolu`.
8. Vérifier que la pièce redevient verte lorsque toutes les anomalies actives sont résolues.
