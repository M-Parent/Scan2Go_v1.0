const logger = require("./logger");

require("dotenv").config();
const mysql = require("mysql2");

// Configuration de la connexion à la base de données
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "scan2go",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DATABASE || "scan2go",
});

// Connection DB log
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    process.exit(1); // Arrêter l'application en cas d'erreur critique
  }
  logger.info("Connecté à la base de données MySQL!");
  createProjectTable();
  createSectionTable();
  createFileTable();
  createTagTable();
});

// Create Table MYSQL
async function createProjectTable() {
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
    const [results] = await db.promise().query(createTableQuery);
    logger.info('Table "project" créée ou déjà existante.');
  } catch (err) {
    console.error("Erreur lors de la création de la table project:", err);
  }
}

async function createSectionTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS section (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT,
      section_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
    );
  `;

  try {
    const [results] = await db.promise().query(createTableQuery);
    logger.info('Table "section" créée ou déjà existante.');
  } catch (err) {
    console.error("Erreur lors de la création de la table section:", err);
  }
}

async function createFileTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS file (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_id INT,
      name VARCHAR(255),
      url_qr_code VARCHAR(255),
      path_file VARCHAR(255),
      path_pdf VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES section(id) ON DELETE CASCADE
    );
  `;

  try {
    const [results] = await db.promise().query(createTableQuery);
    logger.info('Table "file" créée ou déjà existante.');
  } catch (err) {
    console.error("Erreur lors de la création de la table file:", err);
  }
}

async function createTagTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tag (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_id INT,
      tag_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES file(id) ON DELETE CASCADE
    );
  `;

  try {
    const [results] = await db.promise().query(createTableQuery);
    logger.info('Table "tag" créée ou déjà existante.');
  } catch (err) {
    console.error("Erreur lors de la création de la table tag:", err);
  }
}

// Fonction pour fermer la connexion (à utiliser plus tard)
function closeConnection() {
  db.end((err) => {
    if (err) {
      console.error("Erreur lors de la fermeture de la connexion:", err);
    } else {
      logger.info("Connexion à la base de données fermée.");
    }
  });
}

module.exports = db; // Exportez l'objet de connexion pour l'utiliser dans d'autres fichiers
