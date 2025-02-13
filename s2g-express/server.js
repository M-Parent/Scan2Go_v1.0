require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs"); // Importez le module fs pour la suppression de fichiers

const app = express();

app.use(cors()); // CORS avant les autres middleware
app.use(express.json()); // Pour parser le JSON
app.use(express.static(path.join(__dirname, "public"))); // Après le CORS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const port = process.env.PORT_EXPRESS || 6301;

// Configuration de Multer pour l'image
const storage = multer.diskStorage({
  destination: "uploads/projects",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename); // Enregistre seulement le nom du fichier
  },
});

const upload = multer({ storage: storage });

// Login to DB
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost", // Utilisez une variable d'env pour l'hôte
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Create Table MYSQL
function createProjectTable() {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS project (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_name VARCHAR(255),
            project_image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Erreur lors de la création de la table :", err);
      return;
    }
    console.log('Table "project" créée ou déjà existante.');
  });
}

// Connection DB log
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    return;
  }
  console.log("Connecté à la base de données MySQL!");
  createProjectTable();
});

// APP logs
app.listen(port, () => {
  console.log("Server running on Port : " + process.env.PORT_EXPRESS);
});

// Request POST
app.post("/api/projects", upload.single("projectImage"), (req, res) => {
  const { projectName } = req.body;
  const projectImage = req.file ? `projects/${req.file.filename}` : null; // Modification ici

  if (!projectName) {
    return res.status(400).json({ error: "Le nom du projet est requis." });
  }

  const sql = "INSERT INTO project (project_name, project_image) VALUES (?, ?)";
  db.query(sql, [projectName, projectImage], (err, results) => {
    if (err) {
      console.error("Erreur lors de l'ajout du projet :", err);
      return res
        .status(500)
        .json({ error: "Erreur lors de l'ajout du projet." });
    }

    const newProjectId = results.insertId; // Déclaration et affectation de newProjectId ICI
    const getNewProjectQuery = "SELECT * FROM project WHERE id = ?"; // Requête pour récupérer le projet complet
    db.query(getNewProjectQuery, [newProjectId], (err, newProjectResults) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération du nouveau projet :",
          err
        );
        return res
          .status(500)
          .json({ error: "Erreur lors de l'ajout du projet." });
      }

      console.log("Projet ajouté avec succès !");
      return res.status(201).json(newProjectResults[0]); // Envoi du nouveau projet (IMPORTANT)
    });
  });
});

// Route pour récupérer les projets (GET)
app.get("/api/projects", (req, res) => {
  const sql = "SELECT * FROM project";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des projets :", err);
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération des projets." });
    }
    res.status(200).json(results);
  });
});

// Route pour supprimer un projet (DELETE)
app.delete("/api/projects/:id", (req, res) => {
  const projectId = req.params.id;

  // 1. Récupérer le nom de l'image à supprimer
  const getImageQuery = `SELECT project_image FROM project WHERE id = ?`;

  db.query(getImageQuery, [projectId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération du nom de l'image :", err);
      return res
        .status(500)
        .json({ error: "Erreur lors de la suppression du projet (image)." }); // Message plus précis
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Projet non trouvé." });
    }

    const imagePath = path.join(__dirname, "uploads", results[0].project_image); // <-- Utiliser path.join

    // 2. Supprimer le projet de la base de données
    const deleteProjectQuery = `DELETE FROM project WHERE id = ?`;

    db.query(deleteProjectQuery, [projectId], (err) => {
      if (err) {
        console.error("Erreur lors de la suppression du projet (BDD) :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de la suppression du projet (BDD)." }); // Message plus précis
      }

      // 3. Supprimer le fichier image (si existant)
      if (imagePath) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Erreur lors de la suppression de l'image :", err);
            // IMPORTANT : Ne pas bloquer la suppression du projet si l'image ne peut pas être supprimée
          } else {
            console.log("Image supprimée :", imagePath);
          }
        });
      }

      res.status(200).json({ message: "Projet supprimé avec succès." });
    });
  });
});
