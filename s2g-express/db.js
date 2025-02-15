require("dotenv").config();
const mysql = require("mysql2");

// Configuration de la connexion à la base de données
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost", // Hôte de la base de données
  user: process.env.MYSQL_USER, // Nom d'utilisateur
  password: process.env.MYSQL_PASSWORD, // Mot de passe
  database: process.env.MYSQL_DATABASE, // Nom de la base de données
});

// Connection DB log
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    process.exit(1); // Arrêter l'application en cas d'erreur critique
  }
  console.log("Connecté à la base de données MySQL!");
  createProjectTable();
});

// Create Table MYSQL
async function createProjectTable() {
  // Make it async
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS project (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_name VARCHAR(255),
        project_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

  try {
    const [results] = await db.promise().query(createTableQuery); // Use .promise() and await
    console.log('Table "project" créée ou déjà existante.');
  } catch (err) {
    console.error("Erreur lors de la création de la table :", err);
  }
}

createProjectTable(); // Call the async function

async function createSectionTable() {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS section (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT,
          section_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE -- Clé étrangère et relation
      );
  `;

  try {
    const [results] = await db.promise().query(createTableQuery);
    console.log('Table "section" créée ou déjà existante.');
  } catch (err) {
    console.error("Erreur lors de la création de la table section :", err);
  }
}

createSectionTable(); // Appeler la fonction de création de la table "section"

// Fonction pour fermer la connexion (à utiliser plus tard)
function closeConnection() {
  db.end((err) => {
    if (err) {
      console.error("Erreur lors de la fermeture de la connexion:", err);
    } else {
      console.log("Connexion à la base de données fermée.");
    }
  });
}

module.exports = db; // Exportez l'objet de connexion pour l'utiliser dans d'autres fichiers
