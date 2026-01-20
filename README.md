# Application Météo — Open-Meteo & Chart.js

## Présentation
Cette application web permet de consulter des données météorologiques à partir de
coordonnées géographiques (latitude et longitude).  
Les données sont récupérées en temps réel depuis le service **Open-Meteo** grâce à des
requêtes JavaScript **asynchrones**, puis affichées dynamiquement sous forme de
**tableau** et de **graphique**.

L’objectif principal de ce projet est de mettre en pratique :
- les requêtes asynchrones en JavaScript,
- la manipulation du DOM,
- le traitement de données JSON,
- l’intégration d’une librairie graphique (Chart.js, bonus).

---

## Fonctionnalités
- Saisie des paramètres météo :
  - latitude,
  - longitude,
  - date de début,
  - date de fin,
  - variable météorologique.
- Construction dynamique de la requête vers l’API Open-Meteo.
- Récupération des données au format JSON.
- Limitation des données affichées à **24 valeurs horaires**.
- Analyse simple des données :
  - moyenne,
  - minimum,
  - maximum.
- Affichage dynamique :
  - tableau HTML généré en JavaScript,
  - graphique (courbe ou barres) avec Chart.js.
- Gestion de l’état de l’application :
  - message de chargement,
  - gestion des erreurs réseau.

---

## Structure du projet
/projet-meteo
├── index.html
├── style.css
└── app.js


---

## Installation / Intégration

### 1. Récupération des fichiers
Placer les fichiers suivants dans un même dossier :
- `index.html`
- `style.css`
- `app.js`

### 2. Feuille de style
Vérifier dans `index.html` que la feuille de style est bien liée :
```html
<link rel="stylesheet" href="style.css">
