// ===================================
// CONFIGURATION SUPABASE
// ===================================

const SUPABASE_URL = "https://glmzqsdccyrnmudwqiqu.supabase.co";
const SUPABASE_KEY = "sb_publishable_pFZCAikFqvEynZDTwvgIwA_xK7ZpRGZ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===================================
// ÉLÉMENTS HTML
// ===================================

const recherche = document.getElementById("recherche");
const boutonRecherche = document.getElementById("boutonRecherche");
const boutons = document.querySelectorAll("[data-category]");
const liste = document.getElementById("listeActivites");

let activites = [];
let categorieActive = "all";

// ===================================
// OUTILS
// ===================================

// Empêche d'injecter du HTML dans les popups de la carte
function echapperHTML(texte) {
    const div = document.createElement("div");
    div.textContent = texte ?? "";
    return div.innerHTML;
}

function texteprix(prix) {
    if (prix == null) return "Prix à définir";
    if (Number(prix) === 0) return "Gratuit";
    return `${prix} €`;
}

function texteAge(min, max) {
    if (min == null && max == null) return "Tous âges";
    if (min != null && max == null) return `À partir de ${min} ans`;
    if (min == null && max != null) return `Jusqu'à ${max} ans`;
    return `De ${min} à ${max} ans`;
}

// ===================================
// CHARGEMENT DES ACTIVITÉS
// ===================================

async function chargerActivites() {
    liste.innerHTML = "<p>Chargement des activités...</p>";

    const { data, error } = await supabaseClient
        .from("activities")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        liste.innerHTML = "<p>Erreur lors du chargement des activités.</p>";
        return;
    }

    activites = data || [];

    afficherActivites();
    afficherMarqueursActivites();
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
            categorieActive === "all" || activite.category === categorieActive;

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

        if (activite.image_url) {
            const image = document.createElement("img");
            image.src = activite.image_url;
            image.alt = activite.title;
            image.className = "activity-image";
            carte.appendChild(image);
        }

        const titre = document.createElement("h3");
        titre.textContent = activite.title;

        const ville = document.createElement("p");
        ville.textContent = `${activite.category} · ${activite.city}`;

        const description = document.createElement("p");
        description.textContent = activite.description || "Aucune description.";

        const prix = document.createElement("p");
        prix.textContent = texteprix(activite.price);

        const bouton = document.createElement("button");
        bouton.textContent = "Voir l'activité";
        bouton.addEventListener("click", () => afficherDetail(activite));

        carte.append(titre, ville, description, prix, bouton);
        liste.appendChild(carte);
    });
}

// ===================================
// PAGE DÉTAIL
// ===================================

function afficherDetail(activite) {
    liste.innerHTML = "";

    const detail = document.createElement("section");
    detail.className = "activity-detail";

    if (activite.image_url) {
        const image = document.createElement("img");
        image.src = activite.image_url;
        image.alt = activite.title;
        image.className = "activity-image";
        detail.appendChild(image);
    }

    const titre = document.createElement("h2");
    titre.textContent = activite.title;

    const description = document.createElement("p");
    description.textContent = activite.description || "Aucune description.";

    const ville = document.createElement("p");
    ville.textContent = `Ville : ${activite.city}`;

    const prix = document.createElement("p");
    prix.textContent = `Prix : ${texteprix(activite.price)}`;

    const age = document.createElement("p");
    age.textContent = `Âge : ${texteAge(activite.min_age, activite.max_age)}`;

    const adresse = document.createElement("p");
    adresse.textContent = `📍 Adresse : ${activite.address || "Non renseignée"}`;

    const horaires = document.createElement("p");
    horaires.textContent = `🕒 Horaires : ${activite.schedule || "Non renseignés"}`;

    const retour = document.createElement("button");
    retour.textContent = "← Retour aux activités";
    retour.addEventListener("click", afficherActivites);

    detail.append(titre, description, ville, prix, age, adresse, horaires, retour);
    liste.appendChild(detail);

    document.getElementById("activites").scrollIntoView({ behavior: "smooth" });
}

// ===================================
// RECHERCHE
// ===================================

recherche.addEventListener("input", afficherActivites);

boutonRecherche.addEventListener("click", () => {
    afficherActivites();
    document.getElementById("activites").scrollIntoView({ behavior: "smooth" });
});

// ===================================
// CATÉGORIES
// ===================================

boutons.forEach((bouton) => {
    bouton.addEventListener("click", () => {
        categorieActive = bouton.dataset.category;

        boutons.forEach(b => b.classList.remove("active"));
        bouton.classList.add("active");

        afficherActivites();
    });
});

// ===================================
// FORMULAIRE "PROPOSER UNE ACTIVITÉ"
// ===================================

const formulaire = document.getElementById("formActivite");
const messageFormulaire = document.getElementById("messageFormulaire");

function nombreOuNull(id) {
    const valeur = document.getElementById(id).value;
    return valeur === "" ? null : Number(valeur);
}

formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();

    const ageMin = nombreOuNull("ageMin");
    const ageMax = nombreOuNull("ageMax");

    if (ageMin != null && ageMax != null && ageMin > ageMax) {
        messageFormulaire.textContent =
            "L'âge minimum doit être inférieur à l'âge maximum.";
        return;
    }

    messageFormulaire.textContent = "Envoi en cours...";

    const nouvelleActivite = {
        title: document.getElementById("titre").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("categorie").value,
        city: document.getElementById("ville").value.trim(),
        address: document.getElementById("adresse").value.trim(),
        price: nombreOuNull("prix"),
        min_age: ageMin,
        max_age: ageMax,
        schedule: document.getElementById("horaires").value.trim(),
        published: false
    };

    const { error } = await supabaseClient
        .from("activities")
        .insert([nouvelleActivite]);

    if (error) {
        console.error(error);
        messageFormulaire.textContent = "Erreur lors de l'envoi. Réessaie.";
        return;
    }

    messageFormulaire.textContent =
        "Activité envoyée ! Elle sera vérifiée avant publication.";

    formulaire.reset();
});

// ===================================
// CARTE
// ===================================

const map = L.map("map").setView([47.36, -1.18], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 19
}).addTo(map);

let marqueursActivites = [];
let marqueurUtilisateur = null;

function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const rad = valeur => valeur * Math.PI / 180;

    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function activitesAvecPosition() {
    return activites.filter(a =>
        a.latitude != null &&
        a.longitude != null &&
        Number.isFinite(Number(a.latitude)) &&
        Number.isFinite(Number(a.longitude))
    );
}

// Affiche les activités sur la carte (avec la distance si on connaît la position)
function afficherMarqueursActivites(latUtilisateur = null, lonUtilisateur = null) {
    marqueursActivites.forEach(m => map.removeLayer(m));
    marqueursActivites = [];

    activitesAvecPosition().forEach(activite => {
        const lat = Number(activite.latitude);
        const lon = Number(activite.longitude);

        let texteDistance = "";
        if (latUtilisateur != null) {
            const distance = distanceKm(latUtilisateur, lonUtilisateur, lat, lon);
            texteDistance = `<br>À ${distance.toFixed(1)} km de vous`;
        }

        const marqueur = L.marker([lat, lon]).addTo(map);

        marqueur.bindPopup(`
            <strong>${echapperHTML(activite.title)}</strong><br>
            ${echapperHTML(activite.city)}
            ${texteDistance}
        `);

        marqueursActivites.push(marqueur);
    });
}

document.getElementById("localiser").addEventListener("click", () => {
    const message = document.getElementById("messageLocalisation");

    if (!navigator.geolocation) {
        message.textContent = "Ton navigateur ne prend pas en charge le GPS.";
        return;
    }

    message.textContent = "Recherche de ta position...";

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            if (marqueurUtilisateur) map.removeLayer(marqueurUtilisateur);

            marqueurUtilisateur = L.marker([lat, lon])
                .addTo(map)
                .bindPopup("📍 Vous êtes ici !")
                .openPopup();

            afficherMarqueursActivites(lat, lon);
            map.setView([lat, lon], 12);

            const nombre = activitesAvecPosition().length;
            message.textContent = nombre
                ? `${nombre} activité(s) affichée(s) sur la carte.`
                : "Aucune activité n'a encore de coordonnées GPS.";
        },
        () => {
            message.textContent =
                "Position indisponible. Vérifie les autorisations GPS.";
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
});

// ===================================
// DÉMARRAGE
// ===================================

chargerActivites();
