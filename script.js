// ============================
// Sélection des éléments HTML
// ============================
// On récupère tous les éléments HTML dont on aura besoin dans le code

var formulaire = document.getElementById("formulaireMeteo");
var messageEtat = document.getElementById("messageEtat");
var zoneResultat = document.getElementById("resultat");
var zoneAnalyse = document.getElementById("analyse");
var boutonAfficher = document.getElementById("boutonAfficher");
var canvasGraphique = document.getElementById("graphiqueMeteo");

// Variable pour stocker le graphique
// Permet d'éviter d'empiler plusieurs graphiques (on détruit l'ancien avant de créer le nouveau)
var instanceGraphique = null;


// ===== AJOUT POUR ANIMATION =====
const animation = {
  x: {
    type: "number",
    easing: "linear",
    duration: 50,
    from: NaN,
    delay(ctx) {
      if (ctx.type !== "data" || ctx.xStarted) return 0;
      ctx.xStarted = true;
      return ctx.index * 50;
    },
  },
  y: {
    type: "number",
    easing: "easeOutQuart",
    duration: 50,
    from(ctx) {
      const axis = ctx.chart.scales[ctx.dataset.yAxisID];
      return axis ? axis.getPixelForValue(0) : 0;
    },
    delay(ctx) {
      if (ctx.type !== "data" || ctx.yStarted) return 0;
      ctx.yStarted = true;
      return ctx.index * 50;
    },
  },
};

// ============================
// Soumission du formulaire
// ============================
// Quand l'utilisateur clique sur "Afficher les données"

formulaire.addEventListener("submit", function (evenement) {
  // Empêche le rechargement de la page (comportement par défaut d'un formulaire)
  evenement.preventDefault();

  // ============================
  // Afficher le loader et réinitialiser l'affichage
  // ============================

  messageEtat.textContent = "Chargement des données météo...";
  messageEtat.classList.remove("error");
  messageEtat.classList.add("chargement");

  // Désactiver le bouton pour éviter les clics multiples pendant le chargement
  boutonAfficher.disabled = true;

  // Vider les anciennes données affichées
  zoneResultat.innerHTML = "";
  zoneAnalyse.innerHTML = "";

  // ============================
  // Récupérer les valeurs saisies dans le formulaire
  // ============================

  var latitude = document.getElementById("latitude").value;
  var longitude = document.getElementById("longitude").value;
  var dateDebut = document.getElementById("dateDebut").value;
  var dateFin = document.getElementById("dateFin").value;

  // ============================
  // Récupérer les données cochées
  // ============================
  // On cherche toutes les checkboxes qui sont cochées

  var checkboxes = document.querySelectorAll(
    'input[name="donneeMeteo"]:checked'
  );
  var donneesMeteo = [];

  // On parcourt chaque checkbox cochée pour récupérer sa valeur
  for (var i = 0; i < checkboxes.length; i++) {
    donneesMeteo.push(checkboxes[i].value);
  }

  // ============================
  // Vérifier qu'au moins une donnée est sélectionnée
  // ============================

  if (donneesMeteo.length === 0) {
    messageEtat.textContent = "Veuillez sélectionner au moins une donnée météo";
    messageEtat.classList.add("error");
    messageEtat.classList.remove("chargement");
    boutonAfficher.disabled = false;
    return; // Arrêter l'exécution si rien n'est coché
  }

  // ============================
  // Construire l'URL de l'API Open-Meteo
  // ============================
  // On combine tous les paramètres pour créer l'URL complète

  var url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" +
    latitude +
    "&longitude=" +
    longitude +
    "&hourly=" +
    donneesMeteo.join(",") + // Ex: "temperature_2m,wind_speed_10m"
    "&start_date=" +
    dateDebut +
    "&end_date=" +
    dateFin +
    "&timezone=Europe/Paris";

  // ============================
  // Requête asynchrone vers l'API
  // ============================
  // fetch() permet de récupérer les données sans recharger la page

  fetch(url)
    .then(function (reponse) {
      // Vérifier que la requête s'est bien passée
      if (!reponse.ok) {
        throw new Error("Erreur lors de la requête");
      }
      // Convertir la réponse en format JSON (objet JavaScript)
      return reponse.json();
    })
    .then(function (donnees) {
      // ============================
      // Préparer les données reçues
      // ============================

      // Récupérer les heures (timestamps)
      var heures = donnees.hourly.time;

      // Créer un objet qui contient les valeurs pour chaque donnée météo
      var valeursParDonnee = {};

      donneesMeteo.forEach(function (donnee) {
        valeursParDonnee[donnee] = donnees.hourly[donnee];
      });

      // ============================
      // Ne pas limiter les données
      // ============================
      // On affiche toutes les heures de la période demandée

      var heuresCompletes = heures;

      // ============================
      // Afficher l'analyse et le tableau
      // ============================

      // Afficher l'analyse (moyenne, min, max) pour la première donnée cochée
      // Nouveau code
      creerAnalyseMultiple(valeursParDonnee, donneesMeteo);

      // Afficher le tableau avec toutes les données cochées
      creerTableau(heuresCompletes, valeursParDonnee, donneesMeteo);

      // Créer le graphique avec toutes les données
      creerGraphiqueMulti(heuresCompletes, donneesMeteo, valeursParDonnee);

      // Fin du chargement
      // ============================

      messageEtat.textContent =
        "Données affichées pour la période sélectionnée";
      messageEtat.classList.remove("chargement");
      boutonAfficher.disabled = false; // Réactiver le bouton
    })
    .catch(function (erreur) {
      // ============================
      // Gestion des erreurs
      // ============================
      // Si la requête échoue ou s'il y a un problème

      messageEtat.textContent = "Impossible de récupérer les données";
      messageEtat.classList.add("error");
      messageEtat.classList.remove("chargement");
      boutonAfficher.disabled = false;
      console.log(erreur); // Afficher l'erreur dans la console pour le développeur
    });
});

// ============================
// Fonction : Analyse statistique multiple
// ============================
// Prend un objet "valeursParDonnee" et un tableau "donneesMeteo"
// Affiche la moyenne, min et max pour toutes les données cochées
function creerAnalyseMultiple(valeursParDonnee, donneesMeteo) {
  var htmlAnalyse = "";

  donneesMeteo.forEach(function (donnee) {
    var valeurs = valeursParDonnee[donnee];

    // Filtrer les valeurs nulles ou indéfinies
    var valeursNumeriques = valeurs.filter(function (v) {
      return v !== null && v !== undefined;
    });

    // Si aucune valeur exploitable, afficher un message
    if (valeursNumeriques.length === 0) {
      htmlAnalyse += "<p>Aucune valeur exploitable pour " + donnee + ".</p>";
      return;
    }

    // Calculer somme, min, max, moyenne
    var somme = 0;
    for (var i = 0; i < valeursNumeriques.length; i++) {
      somme += valeursNumeriques[i];
    }
    var min = Math.min.apply(null, valeursNumeriques);
    var max = Math.max.apply(null, valeursNumeriques);
    var moyenne = somme / valeursNumeriques.length;

    // Ajouter au HTML
    htmlAnalyse +=
      "<p><strong>Analyse pour " + donnee + " (sur " + valeursNumeriques.length + " points)</strong></p>" +
      "<ul>" +
      "<li>Moyenne : " + moyenne.toFixed(2) + "</li>" +
      "<li>Minimum : " + min + "</li>" +
      "<li>Maximum : " + max + "</li>" +
      "</ul>";
  });

  // Afficher toutes les analyses d'un coup
  zoneAnalyse.innerHTML = htmlAnalyse;
}


// ============================
// Fonction : Création du tableau HTML
// ============================
// Affiche les données sous forme de tableau avec toutes les colonnes cochées

function creerTableau(heures, valeursParDonnee, donneesMeteo) {
  // Créer les éléments HTML du tableau
  var tableau = document.createElement("table");
  var entete = document.createElement("thead");
  var corps = document.createElement("tbody");

  // ============================
  // Créer l'en-tête du tableau
  // ============================

  var ligneEntete = document.createElement("tr");

  // Première colonne : Date/Heure
  var celluleDate = document.createElement("th");
  celluleDate.textContent = "Date / Heure";
  ligneEntete.appendChild(celluleDate);

  // Ajouter une colonne pour chaque donnée cochée
  for (var i = 0; i < donneesMeteo.length; i++) {
    var celluleValeur = document.createElement("th");
    celluleValeur.textContent = donneesMeteo[i];
    ligneEntete.appendChild(celluleValeur);
  }
  entete.appendChild(ligneEntete);

  // ============================
  // Créer les lignes du tableau
  // ============================
  // Une ligne par heure

  for (var i = 0; i < heures.length; i++) {
    var ligne = document.createElement("tr");

    // Première cellule : l'heure
    var celluleHeure = document.createElement("td");
    celluleHeure.textContent = heures[i];
    ligne.appendChild(celluleHeure);

    // Cellules suivantes : les valeurs pour chaque donnée cochée
    for (var j = 0; j < donneesMeteo.length; j++) {
      var celluleDonnee = document.createElement("td");
      celluleDonnee.textContent = valeursParDonnee[donneesMeteo[j]][i];
      ligne.appendChild(celluleDonnee);
    }

    corps.appendChild(ligne);
  }

  // Assembler le tableau complet
  tableau.appendChild(entete);
  tableau.appendChild(corps);

  // Afficher le tableau dans la page
  zoneResultat.appendChild(tableau);
}

// ============================
// Fonction : Informations pour le graphique
// ============================
// Retourne les paramètres du graphique selon le type de donnée

function getInfosGraphique(donneeMeteo) {
  var type = "line"; // Type de graphique (ligne par défaut)
  var unite = ""; // Unité de mesure
  var beginAtZero = false; // Est-ce que l'axe Y commence à zéro ?

  // Paramètres spécifiques selon la donnée
  if (donneeMeteo === "temperature_2m") {
    unite = "°C";
    beginAtZero = false; // La température peut être négative
    type = "line";
  } else if (donneeMeteo === "wind_speed_10m") {
    unite = " km/h";
    beginAtZero = true; // Le vent ne peut pas être négatif
    type = "line";
  } else if (donneeMeteo === "precipitation") {
    unite = " mm";
    beginAtZero = true; // Les précipitations ne peuvent pas être négatives
    type = "line";
  }

  // Retourner un objet avec toutes les infos
  return { type: type, unite: unite, beginAtZero: beginAtZero };
}

// ============================
// Fonction : Création du graphique multi-datasets
// ============================
// Utilise Chart.js pour afficher plusieurs courbes sur un même graphique

function creerGraphiqueMulti(heures, donneesMeteo, allValues) {
  // Si un graphique existe déjà, on le détruit pour éviter les doublons
  if (instanceGraphique !== null) {
    instanceGraphique.destroy();
  }

  // ============================
  // Formater les labels (dates/heures)
  // ============================
  // Convertir "2024-01-15T14:00" en "15/01 14:00"

  var labels = heures.map(function (h) {
    var parts = h.split("T"); // Séparer date et heure
    return (
      parts[0].split("-")[2] + "/" + parts[0].split("-")[1] + " " + parts[1]
    );
  });

  // ============================
  // Définir les couleurs pour chaque donnée
  // ============================

  var couleurs = {
    temperature_2m: {
      borderColor: "red",
      backgroundColor: "rgba(255, 0, 0, 0.1)", // Rouge transparent
    },
    wind_speed_10m: {
      borderColor: "green",
      backgroundColor: "rgba(0, 128, 0, 0.1)", // Vert transparent
    },
    precipitation: {
      borderColor: "blue",
      backgroundColor: "rgba(0, 0, 255, 0.1)", // Bleu transparent
    },
  };

  // ============================
  // Créer les datasets (courbes)
  // ============================
  // Un dataset = une courbe dans le graphique

  var datasets = donneesMeteo.map(function (donnee) {
    var infos = getInfosGraphique(donnee);
    var couleur = couleurs[donnee] || {
      borderColor: "#6b7280",
      backgroundColor: "rgba(107, 114, 128, 0.1)",
    };

    return {
      label: donnee, // Nom affiché dans la légende
      data: allValues[donnee], // Toutes les valeurs de la période
      tension: 0.2, // Courbure de la ligne (0 = droite, 1 = très courbé)
      type: infos.type, // Type de graphique
      yAxisID: donnee, // Identifiant de l'axe Y à utiliser
      borderColor: couleur.borderColor, // Couleur de la ligne
      backgroundColor: couleur.backgroundColor, // Couleur de remplissage
      borderWidth: 2, // Épaisseur de la ligne
      pointRadius: 1, // Taille des points
      pointHoverRadius: 5, // Taille des points au survol
    };
  });

  // ============================
  // Créer les axes Y
  // ============================
  // Un axe Y différent pour chaque type de donnée

  var axes = {};
  donneesMeteo.forEach(function (donnee, i) {
    var infos = getInfosGraphique(donnee);
    axes[donnee] = {
      type: "linear", // Axe numérique linéaire
      position: i % 2 === 0 ? "left" : "right", // Alterner gauche/droite
      beginAtZero: infos.beginAtZero, // Commencer à zéro 
      title: { display: true, text: infos.unite }, // Afficher l'unité
    };
  });

  // ============================
  // Créer le graphique Chart.js
  // ============================

 instanceGraphique = new Chart(canvasGraphique, {
  type: "line",
  data: {
    labels: labels,
    datasets: datasets,
  },
  options: {
    responsive: true,
    animation: animation, 
    interaction: { intersect: false }, 
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function (context) {
            var label = context.dataset.label;
            var value = context.raw;

            if (value === null || value === undefined) {
              return label + " : données indisponibles";
            }

            var infos = getInfosGraphique(label);
            return label + " : " + value + infos.unite;
          },
        },
      },
    },
    scales: axes,
  }
});
}