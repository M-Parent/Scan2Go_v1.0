require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { db, closeConnection } = require("./db"); // Importation destructurée
const projectRoutes = require("./routes/projectRoutes");
const sectionsRoutes = require("./routes/sectionsRoutes");
const filesRoutes = require("./routes/filesRoutes");

const app = express();
const port = process.env.PORT_EXPRESS || 6301;

if (
  !process.env.MYSQL_HOST ||
  !process.env.MYSQL_USER ||
  !process.env.MYSQL_PASSWORD ||
  !process.env.MYSQL_DATABASE
) {
  console.error(
    "Erreur : Les variables d'environnement pour la base de données ne sont pas définies."
  );
  process.exit(1); // Arrêter l'application
}

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Variable d'env pour l'origine
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/sections", sectionsRoutes);

// Gestion des erreurs globales (middleware d'erreur)
app.use((err, req, res, next) => {
  console.error("Erreur globale :", err); // Journalisation de l'erreur
  res.status(500).json({ error: "Une erreur est survenue." }); // Réponse générique au client
});

// Arrêt du serveur et fermeture de la connexion à la base de données
process.on("SIGINT", () => {
  // Ecoute du signal d'interruption (Ctrl+C)
  console.log("Fermeture du serveur...");
  closeConnection(); // Fermeture de la connexion à la base de données
  process.exit(0); // Arrêt du processus
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server running on Port : ${port}`); // Utilisation de template literals
});
