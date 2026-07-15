# Ayimolou Frontend

Application mobile Expo/React Native pour Ayimolou.

## Demarrage

```bash
npm install
npx expo start
```

## Scripts utiles

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Configuration

Les variables locales sont a placer dans `.env`.

# corrections apportées 15/07/2026 : 
Les erreurs de dépendance et incompatibilité package expo.
corrigé app.json, package.json, eas.json.
supprimer les packeges bloquant non utiilisé.
ajouter la clé publique clerk dans eas.json pour le preview apk.
ajouter le .npmrc pour ignorer les warnings eas build preview expo.
corrigé l'auth clerk pour la redirection url par l'ajout d'un utl scheme.
ajout bouton Google G dans le pressable continuer avec google.