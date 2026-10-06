# infra_LVN

V0 d'un outil web de signalement et de suivi des anomalies d'infrastructure d'une caserne.

## Parcours terrain

- Un QR code unique ouvre `index.html`.
- Aucun identifiant ou mot de passe visible pour l'agent.
- Choix Bâtiment A/B.
- Les plans RDC et R+1 sont affichés sur la même page.
- Clic/toucher sur une pièce.
- Nom, prénom, description courte, une photo facultative, urgence facultative.
- Catégorie calculée automatiquement à partir de la description.
- Envoi vers la base de données.
- L'agent terrain ne voit jamais la liste des anomalies existantes.

## Espace Infra

`infra.html` est protégé par Firebase Authentication (Email/Mot de passe) en mode réel.

- Plans rouges/verts : rouge = au moins une anomalie `À traiter` ou `En cours`; vert = aucune anomalie active.
- Plusieurs anomalies par pièce.
- Liste filtrable par statut, catégorie, bâtiment et texte.
- Statuts : `À traiter`, `En cours`, `Résolu`.
- Priorité urgente avec indicateur 🚨.
- Création directe d'une anomalie par le service Infra.
- Correction de la catégorie, description, urgence et statut.
- Commentaire de résolution et photo après intervention facultative.
- Tableau de bord avec pourcentage réalisé.
- Main courante des changements.

## Mode démo actuel

Le fichier `js/firebase-config.js` contient :

```js
export const APP_MODE = 'demo';
```

Les données sont stockées uniquement dans `localStorage`. Trois anomalies de démonstration sont créées automatiquement. Cela permet de tester l'interface avant la création du projet Firebase.

## Passage à Firebase

1. Créer un projet Firebase dédié à `infra_LVN`.
2. Activer **Authentication** :
   - Anonymous (pour le formulaire terrain, invisible pour l'utilisateur) ;
   - Email/Password (pour le compte Infra commun).
3. Créer la base **Cloud Firestore**.
4. Activer **Firebase Storage**.
5. Créer le compte Email/Password commun du service Infra.
6. Copier la configuration Web Firebase dans `js/firebase-config.js`.
7. Passer `APP_MODE` à `firebase`.
8. Déployer `firestore.rules` et `storage.rules` dans la console Firebase.
9. Ajouter le futur domaine du site à la liste des domaines autorisés dans Firebase Authentication.
10. Avant mise en service réelle, activer **Firebase App Check** afin de limiter les soumissions automatisées abusives.

## Plans réels

Les rectangles actuels sont provisoires. La structure des plans se trouve dans `js/data.js`.

Quand les PDF/plans réels seront disponibles :

- relever toutes les pièces ;
- remplacer la géométrie provisoire par les vraies zones cliquables (polygones SVG) ;
- conserver le même identifiant stable pour chaque pièce ;
- remplacer/ajouter l'image de fond du plan si nécessaire.

L'architecture de l'application n'a pas besoin d'être refaite.

## Sécurité

Le formulaire terrain utilise en mode Firebase une **authentification anonyme transparente**. L'agent n'a ni compte à créer ni mot de passe à saisir, mais Firebase attribue un identifiant technique temporaire qui permet d'appliquer des règles de sécurité.

Les règles fournies empêchent l'utilisateur terrain de lire la liste des anomalies ou de modifier les donsées. Seul un compte authentifié non-anonyme peut accéder au suivi Infra.

**Important :** puisque les plans terrain sont accessibles sans mot de passe, les vrais plans ne doivent être intégrés qu'après validation du niveau de confidentialité acceptable pour la caserne.

## Déploiement

Le projet est statique (HTML/CSS/JavaScript) et peut être publié via GitHub Pages ou Firebase Hosting. Aucun framework ni serveur Node n'est requis pour la V0.
