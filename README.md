# LGPI Notes — React + Tailwind

Application de fiches de révision pour LGPI, construite avec React, Tailwind CSS, Framer Motion et Firebase.

## Lancer en local

```bash
npm install
npm run dev
```

## Déployer sur Cloudflare Pages

1. Connecte le repo GitHub à Cloudflare Pages
2. **Build command** : `npm run build`
3. **Build output directory** : `dist`
4. **Node version** : 20

C'est tout — Cloudflare gère le reste automatiquement à chaque push.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** pour le style
- **Framer Motion** pour les animations
- **Firebase Firestore** pour la synchronisation
