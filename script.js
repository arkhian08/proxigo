
// ===================================
// CONFIGURATION SUPABASE
// ===================================

const SUPABASE_URL = "https://glmzqsdccyrnmudwqiqu.supabase.co";
const SUPABASE_KEY = "sb_publishable_pFZCAikFqvEynZDTwvgIwA_xK7ZpRGZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ===================================
// ELEMENTS HTML
// ===================================

const recherche = document.getElementById("recherche");
const boutons = document.querySelectorAll("[data-category]");
const liste = document.getElementById("listeActivites");

let activites = [];
let categorieActive = "all";

// ===================================
// CHARGEMENT DES ACTIVITES
// ===================================

async function chargerActivites() {

    liste.innerHTML = "<p>Chargement des activités...</p>";

    const { data, error } = await supabaseClient
        .from("activities")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

    console.log("Données reçues :", data);
    console.log("Erreur Supabase :", error);

    if (error) {
        console.error(error);
        liste.innerHTML =
            "<p>Erreur lors du chargement des activités.</p>";
        return;
    }

    activites = data || [];

    afficherActivites();
}

// ===================================
// AFFICHAGE ET FILTRAGE
// ===================================


function afficherActivites() {
    const texte = recherche.value.toLowerCase().trim();

    const resultats = activites.filter((activite) => {
        const contenu = [
            activite.title,
            activite.description,
            activite.city,
            activite.category
        ].join(" ").toLowerCase();

        const correspondRecherche = contenu.includes(texte);
        const correspondCategorie =
            categorieActive === "all" ||
            activite.category === categorieActive;

        return correspondRecherche && correspondCategorie;
    });

    liste.innerHTML = "";

    if (resultats.length === 0) {
        liste.innerHTML = "<p>Aucune activité trouvée.</p>";
        return;
    }

    resultats.forEach((activite) => {
        const carte = document.createElement("article");
        carte.className = "activity";

        // Image
        if (activite.image_url) {
            const image = document.createElement("img");
            image.src = activite.image_url;
            image.alt = activite.title;
            image.className = "activity-image";
            carte.appendChild(image);
        }

        // Titre
        const titre = document.createElement("h3");
        titre.textContent = activite.title;

        // Catégorie et ville
        const ville = document.createElement("p");
        ville.textContent =
            `${activite.category} · ${activite.city}`;

        // Description
        const description = document.createElement("p");
        description.textContent =
            activite.description || "Aucune description.";

        // Prix
        const prix = document.createElement("p");
        if (activite.price === null) {
            prix.textContent = "Prix à définir";
        } else if (Number(activite.price) === 0) {
            prix.textContent = "Gratuit";
        } else {
            prix.textContent = `${activite.price} €`;
        }

        // Âge
        const age = document.createElement("p");
        if (activite.min_age == null && activite.max_age == null) {
            age.textContent = "Tous âges";
        } else {
            age.textContent =
                `Âge : ${activite.min_age ?? "?"} à ${activite.max_age ?? "?"} ans`;
        }

        // Adresse
        const adresse = document.createElement("p");
        adresse.textContent = activite.address
            ? `📍 ${activite.address}`
            : "Adresse non renseignée";

        // Horaires
        const horaires = document.createElement("p");
        horaires.textContent = activite.schedule
            ? `🕒 ${activite.schedule}`
            : "Horaires non renseignés";

            const bouton = document.createElement("button");
            bouton.textContent = "Voir l'activité";

            bouton.addEventListener("click", () => {
               afficherDetail(activite);
            });

            carte.append(
               titre,
                ville,
               description,
               prix,
              bouton
            );

            liste.appendChild(carte);

        liste.appendChild(carte);
    });
}


// ===================================
// RECHERCHE
// ===================================

recherche.addEventListener("input", afficherActivites);

// ===================================
// CATEGORIES
// ===================================

boutons.forEach((bouton) => {

    bouton.addEventListener("click", () => {

        categorieActive = bouton.dataset.category;

        afficherActivites();
    });
});

// ===================================
// DEMARRAGE
// ===================================

chargerActivites();

function afficherDetail(activite) {
    liste.innerHTML = "";

    const detail = document.createElement("section");
    detail.className = "activity-detail";

    const titre = document.createElement("h2");
    titre.textContent = activite.title;

    const description = document.createElement("p");
    description.textContent = activite.description || "Aucune description.";

    const ville = document.createElement("p");
    ville.textContent = `Ville : ${activite.city}`;

    const prix = document.createElement("p");
    prix.textContent =
        Number(activite.price) === 0
            ? "Prix : Gratuit"
            : activite.price == null
                ? "Prix à définir"
                : `Prix : ${activite.price} €`;

    const age = document.createElement("p");
    age.textContent =
        `Âge : ${activite.min_age ?? "?"} à ${activite.max_age ?? "?"} ans`;

    const adresse = document.createElement("p");
    adresse.textContent = `Adresse : ${activite.address || "Non renseignée"}`;

    const horaires = document.createElement("p");
    horaires.textContent = `Horaires : ${activite.schedule || "Non renseignés"}`;

    if (activite.image_url) {
        const image = document.createElement("img");
        image.src = activite.image_url;
        image.alt = activite.title;
        image.className = "activity-image";
        detail.appendChild(image);
    }

    const retour = document.createElement("button");
    retour.textContent = "← Retour aux activités";
    retour.addEventListener("click", afficherActivites);

    detail.append(
        titre,
        description,
        ville,
        prix,
        age,
        adresse,
        horaires,
        retour
    );

    liste.appendChild(detail);
}

const formulaire = document.getElementById("formActivite");
const messageFormulaire = document.getElementById("messageFormulaire");

formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();

    messageFormulaire.textContent = "Envoi en cours...";

    const nouvelleActivite = {
        title: document.getElementById("titre").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("categorie").value.trim().toLowerCase(),
        city: document.getElementById("ville").value.trim(),
        address: document.getElementById("adresse").value.trim(),
        price: document.getElementById("prix").value === ""
            ? null
            : Number(document.getElementById("prix").value),
        min_age: document.getElementById("ageMin").value === ""
            ? null
            : Number(document.getElementById("ageMin").value),
        max_age: document.getElementById("ageMax").value === ""
            ? null
            : Number(document.getElementById("ageMax").value),
        schedule: document.getElementById("horaires").value.trim(),
        published: false
    };

    const { error } = await supabaseClient
        .from("activities")
        .insert([nouvelleActivite]);

    if (error) {
        console.error(error);
        messageFormulaire.textContent =
            "Erreur lors de l'envoi. Réessaie.";
        return;
    }

    messageFormulaire.textContent =
        "Activité envoyée ! Elle sera vérifiée avant publication.";

    formulaire.reset();
});

// Création de la carte
const map = L.map("map").setView([47.36, -1.18], 11);

// Fond de carte OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 19
}).addTo(map);

let marqueurs = [];

function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const rad = valeur => valeur * Math.PI / 180;

    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) *
        Math.cos(rad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Afficher les activités sur la carte
function afficherSurCarte(latitudeUtilisateur, longitudeUtilisateur) {
    marqueurs.forEach(m => map.removeLayer(m));
    marqueurs = [];

    const positionUtilisateur = L.marker([
        latitudeUtilisateur,
        longitudeUtilisateur
    ]).addTo(map);

    positionUtilisateur.bindPopup("📍 Vous êtes ici !");
    marqueurs.push(positionUtilisateur);

    const activitesAvecPosition = activites.filter(a =>
        Number.isFinite(Number(a.latitude)) &&
        Number.isFinite(Number(a.longitude)) &&
        a.latitude !== null &&
        a.longitude !== null
    );

    activitesAvecPosition.forEach(activite => {
        const distance = distanceKm(
            latitudeUtilisateur,
            longitudeUtilisateur,
            Number(activite.latitude),
            Number(activite.longitude)
        );

        const marqueur = L.marker([
            Number(activite.latitude),
            Number(activite.longitude)
        ]).addTo(map);

        marqueur.bindPopup(`
            <strong>${activite.title}</strong><br>
            ${activite.city}<br>
            À ${distance.toFixed(1)} km de vous
        `);

        marqueurs.push(marqueur);
    });

    map.setView(
        [latitudeUtilisateur, longitudeUtilisateur],
        12
    );

    const message = document.getElementById("messageLocalisation");

    message.textContent = activitesAvecPosition.length
        ? `${activitesAvecPosition.length} activités affichées sur la carte.`
        : "Aucune activité n'a encore de coordonnées GPS.";
}

// Demander la position uniquement après un clic
document.getElementById("localiser").addEventListener("click", () => {
    const message = document.getElementById("messageLocalisation");

    if (!navigator.geolocation) {
        message.textContent = "Ton navigateur ne prend pas en charge le GPS.";
        return;
    }

    message.textContent = "Recherche de ta position...";

    navigator.geolocation.getCurrentPosition(
        position => {
            afficherSurCarte(
                position.coords.latitude,
                position.coords.longitude
            );
        },
        erreur => {
            message.textContent =
                "Position indisponible. Vérifie les autorisations GPS.";
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
});
