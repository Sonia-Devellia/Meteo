// ========================================
// 1. SÉLECTION DES ÉLÉMENTS HTML
// ========================================
const formulaire = document.getElementById("formulaireMeteo");
const messageEtat = document.getElementById("messageEtat");
const zoneResultat = document.getElementById("resultat");
const zoneAnalyse = document.getElementById("analyse");
const canvasGraphique = document.getElementById("graphiqueMeteo");

// Éléments pour la recherche de ville
const champRechercheVille = document.getElementById("rechercheVille");
const boutonRechercher = document.getElementById("boutonRechercher");
const zoneResultatsRecherche = document.getElementById("resultatsRecherche");
const champLatitude = document.getElementById("latitude");
const champLongitude = document.getElementById("longitude");

// Variable pour stocker le graphique (on le détruit avant d'en créer un nouveau)
let graphique = null;

// ========================================
// 2. CONFIGURATION DES DONNÉES MÉTÉO
// ========================================
const configMeteo = {
    temperature_2m: {
        label: "Température",
        unite: "°C",
        couleur: "#ef4444",
        couleurFond: "rgba(239, 68, 68, 0.1)"
    },
    wind_speed_10m: {
        label: "Vent",
        unite: "km/h",
        couleur: "#22c55e",
        couleurFond: "rgba(34, 197, 94, 0.1)"
    },
    precipitation: {
        label: "Précipitations",
        unite: "mm",
        couleur: "#3b82f6",
        couleurFond: "rgba(59, 130, 246, 0.1)"
    }
};

// ========================================
// 3. GESTION DE LA RECHERCHE DE VILLE
// ========================================

// Quand on clique sur le bouton "Rechercher"
boutonRechercher.addEventListener("click", () => {
    const ville = champRechercheVille.value.trim();

    // Vérifier qu'on a saisi quelque chose
    if (ville === "") {
        alert("Veuillez saisir le nom d'une ville");
        return;
    }

    // Rechercher la ville
    rechercherVille(ville);
});

// Permettre de rechercher en appuyant sur Entrée
champRechercheVille.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        boutonRechercher.click();
    }
});

// Fermer le dropdown si on clique en dehors
document.addEventListener("click", (e) => {
    const clicDansRecherche = e.target.closest(".champ-avec-dropdown");
    const clicSurBouton = e.target === boutonRechercher;
    
    if (!clicDansRecherche && !clicSurBouton) {
        fermerDropdown();
    }
});

// Fermer le dropdown avec la touche Échap
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        fermerDropdown();
    }
});

// Fonction pour fermer le dropdown
function fermerDropdown() {
    zoneResultatsRecherche.classList.remove("visible");
}

// Fonction pour rechercher une ville via l'API de géocodage
function rechercherVille(nomVille) {
    // Construire l'URL de l'API de géocodage
    // count=10 pour avoir plus de résultats
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomVille)}&count=10&language=fr&format=json`;

    // Afficher un message de chargement
    zoneResultatsRecherche.innerHTML = "<p style='padding: 12px; color: #6b7280;'>Recherche en cours...</p>";
    zoneResultatsRecherche.classList.add("visible");

    // Faire la requête
    fetch(url)
        .then((reponse) => {
            if (!reponse.ok) {
                throw new Error("Erreur lors de la recherche");
            }
            return reponse.json();
        })
        .then((donnees) => {
            // Afficher les résultats
            afficherResultatsRecherche(donnees.results);
        })
        .catch((erreur) => {
            zoneResultatsRecherche.innerHTML = "<p style='padding: 12px; color: #dc2626;'>Erreur lors de la recherche</p>";
            console.error(erreur);
        });
}

// Fonction pour afficher les résultats de recherche
function afficherResultatsRecherche(resultats) {
    // Si aucun résultat
    if (!resultats || resultats.length === 0) {
        zoneResultatsRecherche.innerHTML = "<p style='padding: 12px; color: #6b7280;'>Aucun lieu trouvé</p>";
        return;
    }

    // Construire le HTML des résultats
    let html = "";

    resultats.forEach((ville) => {
        const nomVille = ville.name;
        const pays = ville.country || "";
        const region = ville.admin1 || "";
        const sousRegion = ville.admin2 || "";
        const arrondissement = ville.admin3 || "";
        const quartier = ville.admin4 || "";
        const population = ville.population;
        const elevation = ville.elevation;
        const latitude = ville.latitude;
        const longitude = ville.longitude;

        // Construire la localisation complète
        let localisation = [];
        if (arrondissement) localisation.push(arrondissement);
        if (sousRegion) localisation.push(sousRegion);
        if (region) localisation.push(region);
        if (pays) localisation.push(pays);
        
        const localisationTexte = localisation.join(", ");

        // Informations supplémentaires
        let infosSupp = [];
        if (population) infosSupp.push(`${population.toLocaleString('fr-FR')} hab.`);
        if (elevation) infosSupp.push(`${elevation}m d'altitude`);
        
        const infosSuppTexte = infosSupp.length > 0 ? " • " + infosSupp.join(" • ") : "";

        html += `
            <div class="resultat-item" data-lat="${latitude}" data-lon="${longitude}" data-nom="${nomVille}">
                <div>
                    <span class="ville">${nomVille}</span>
                    <span class="pays">${localisationTexte}</span>
                </div>
                <div class="coords">Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}${infosSuppTexte}</div>
            </div>
        `;
    });

    zoneResultatsRecherche.innerHTML = html;

    // Ajouter les événements de clic sur chaque résultat
    const items = zoneResultatsRecherche.querySelectorAll(".resultat-item");
    items.forEach((item) => {
        item.addEventListener("click", () => {
            selectionnerVille(item);
        });
    });
}

// Fonction pour sélectionner une ville
function selectionnerVille(item) {
    const latitude = item.getAttribute("data-lat");
    const longitude = item.getAttribute("data-lon");
    const nomVille = item.getAttribute("data-nom");

    // Remplir les champs latitude et longitude
    champLatitude.value = latitude;
    champLongitude.value = longitude;

    // Mettre le nom de la ville dans le champ de recherche
    champRechercheVille.value = nomVille;

    // Fermer le dropdown
    fermerDropdown();

    // Feedback visuel sur les champs modifiés
    champLatitude.style.borderColor = "#22c55e";
    champLongitude.style.borderColor = "#22c55e";
    
    setTimeout(() => {
        champLatitude.style.borderColor = "";
        champLongitude.style.borderColor = "";
    }, 2000);

    console.log(`Ville sélectionnée: ${nomVille} (${latitude}, ${longitude})`);
}

// ========================================
// 4. GESTION DU FORMULAIRE
// ========================================
formulaire.addEventListener("submit", (e) => {
    e.preventDefault();

    // Afficher le chargement
    afficherChargement();

    // Récupérer les valeurs du formulaire
    const parametres = recupererParametres();

    // Vérifier qu'au moins une donnée est sélectionnée
    if (parametres.donneesSelectionnees.length === 0) {
        afficherErreur("Veuillez sélectionner au moins une donnée météo");
        return;
    }

    // Construire l'URL de l'API
    const url = construireURL(parametres);

    // Récupérer les données
    recupererDonnees(url)
        .then((donnees) => {
            // Afficher les résultats
            afficherResultats(donnees, parametres.donneesSelectionnees);

            // Message de succès
            afficherSucces();
        })
        .catch((erreur) => {
            afficherErreur("Impossible de récupérer les données");
            console.error(erreur);
        });
});

// ========================================
// 5. FONCTIONS UTILITAIRES
// ========================================

// Récupérer les paramètres du formulaire
function recupererParametres() {
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;
    const dateDebut = document.getElementById("dateDebut").value;
    const dateFin = document.getElementById("dateFin").value;

    // Récupérer les cases cochées
    const checkboxes = document.querySelectorAll('input[name="donneeMeteo"]:checked');
    const donneesSelectionnees = Array.from(checkboxes).map(cb => cb.value);

    return { latitude, longitude, dateDebut, dateFin, donneesSelectionnees };
}

// Construire l'URL de l'API
function construireURL({ latitude, longitude, dateDebut, dateFin, donneesSelectionnees }) {
    const baseURL = "https://api.open-meteo.com/v1/forecast";
    const params = new URLSearchParams({
        latitude,
        longitude,
        hourly: donneesSelectionnees.join(","),
        start_date: dateDebut,
        end_date: dateFin,
        timezone: "Europe/Paris"
    });

    return `${baseURL}?${params}`;
}

// Récupérer les données depuis l'API
function recupererDonnees(url) {
    return fetch(url)
        .then((reponse) => {
            if (!reponse.ok) {
                throw new Error("Erreur lors de la requête");
            }
            return reponse.json();
        });
}

// ========================================
// 6. AFFICHAGE DES RÉSULTATS
// ========================================

// Afficher tous les résultats
function afficherResultats(donnees, donneesSelectionnees) {
    const heures = donnees.hourly.time;

    // Préparer les valeurs pour chaque donnée sélectionnée
    const valeursParDonnee = {};
    donneesSelectionnees.forEach(donnee => {
        valeursParDonnee[donnee] = donnees.hourly[donnee];
    });

    // Afficher les 3 éléments
    afficherAnalyse(valeursParDonnee, donneesSelectionnees);
    afficherTableau(heures, valeursParDonnee, donneesSelectionnees);
    afficherGraphique(heures, valeursParDonnee, donneesSelectionnees);
}

// Afficher l'analyse statistique (moyenne, min, max)
function afficherAnalyse(valeursParDonnee, donneesSelectionnees) {
    let html = "";

    donneesSelectionnees.forEach(donnee => {
        const valeurs = valeursParDonnee[donnee];
        const stats = calculerStatistiques(valeurs);
        const config = configMeteo[donnee];

        html += `
            <div class="analyse-item">
                <h3>${config.label}</h3>
                <ul>
                    <li><strong>Moyenne :</strong> ${stats.moyenne.toFixed(2)} ${config.unite}</li>
                    <li><strong>Minimum :</strong> ${stats.min} ${config.unite}</li>
                    <li><strong>Maximum :</strong> ${stats.max} ${config.unite}</li>
                    <li><strong>Points de données :</strong> ${stats.total}</li>
                </ul>
            </div>
        `;
    });

    zoneAnalyse.innerHTML = html;
}

// Calculer les statistiques (moyenne, min, max)
function calculerStatistiques(valeurs) {
    // Filtrer les valeurs nulles
    const valeursValides = valeurs.filter(v => v !== null && v !== undefined);

    if (valeursValides.length === 0) {
        return { moyenne: 0, min: 0, max: 0, total: 0 };
    }

    const somme = valeursValides.reduce((acc, val) => acc + val, 0);
    const moyenne = somme / valeursValides.length;
    const min = Math.min(...valeursValides);
    const max = Math.max(...valeursValides);

    return { moyenne, min, max, total: valeursValides.length };
}

// Afficher le tableau HTML
function afficherTableau(heures, valeursParDonnee, donneesSelectionnees) {
    const table = document.createElement("table");

    // Créer l'en-tête
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Colonne Date/Heure
    const thDate = document.createElement("th");
    thDate.textContent = "Date / Heure";
    headerRow.appendChild(thDate);

    // Colonnes pour chaque donnée
    donneesSelectionnees.forEach(donnee => {
        const th = document.createElement("th");
        th.textContent = configMeteo[donnee].label;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Créer le corps du tableau
    const tbody = document.createElement("tbody");

    heures.forEach((heure, index) => {
        const row = document.createElement("tr");

        // Cellule date/heure
        const tdHeure = document.createElement("td");
        tdHeure.textContent = formaterDate(heure);
        row.appendChild(tdHeure);

        // Cellules pour chaque donnée
        donneesSelectionnees.forEach(donnee => {
            const td = document.createElement("td");
            const valeur = valeursParDonnee[donnee][index];
            td.textContent = valeur !== null ? valeur : "N/A";
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    zoneResultat.innerHTML = "";
    zoneResultat.appendChild(table);
}

// Formater la date pour l'affichage
function formaterDate(dateStr) {
    // Convertir "2024-01-15T14:00" en "15/01 14:00"
    const [date, heure] = dateStr.split("T");
    const [annee, mois, jour] = date.split("-");
    return `${jour}/${mois} ${heure}`;
}

// Afficher le graphique Chart.js
function afficherGraphique(heures, valeursParDonnee, donneesSelectionnees) {
    // Détruire l'ancien graphique s'il existe
    if (graphique) {
        graphique.destroy();
    }

    // Formater les labels (dates)
    const labels = heures.map(formaterDate);

    // Créer les datasets (une courbe par donnée)
    const datasets = donneesSelectionnees.map((donnee, index) => {
        const config = configMeteo[donnee];

        return {
            label: config.label,
            data: valeursParDonnee[donnee],
            borderColor: config.couleur,
            backgroundColor: config.couleurFond,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 1,
            pointHoverRadius: 5,
            yAxisID: donnee
        };
    });

    // Créer les axes Y (un par donnée)
    const scales = { x: {} };

    donneesSelectionnees.forEach((donnee, index) => {
        const config = configMeteo[donnee];

        scales[donnee] = {
            type: "linear",
            position: index % 2 === 0 ? "left" : "right",
            title: {
                display: true,
                text: config.unite
            }
        };
    });

    // Créer le graphique
    graphique = new Chart(canvasGraphique, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const donnee = context.dataset.yAxisID;
                            const valeur = context.raw;
                            const unite = configMeteo[donnee].unite;
                            return `${context.dataset.label}: ${valeur} ${unite}`;
                        }
                    }
                }
            },
            scales
        }
    });
}

// ========================================
// 7. GESTION DES MESSAGES
// ========================================

function afficherChargement() {
    messageEtat.textContent = "Chargement des données météo...";
    messageEtat.className = "chargement";

    // Désactiver le bouton
    document.querySelector("button[type='submit']").disabled = true;

    // Vider les zones
    zoneResultat.innerHTML = "";
    zoneAnalyse.innerHTML = "";
}

function afficherSucces() {
    messageEtat.textContent = "Données affichées avec succès !";
    messageEtat.className = "succes";

    // Réactiver le bouton
    document.querySelector("button[type='submit']").disabled = false;
}

function afficherErreur(message) {
    messageEtat.textContent = `${message}`;
    messageEtat.className = "error";

    // Réactiver le bouton
    document.querySelector("button[type='submit']").disabled = false;
}