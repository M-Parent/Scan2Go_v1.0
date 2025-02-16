const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../db");

// Configuration de Multer pour gérer les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId, sectionNames } = req.body; // Access project and section info
    // 1. Get project name (same logic as before)
    db.promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId])
      .then(([project]) => {
        if (!project || project.length === 0) {
          return cb(new Error("Project not found"), null); // Handle project not found
        }
        const projectName = project[0].project_name;
        const projectPath = path.join(__dirname, "..", "uploads", projectName);
        const sectionPath = path.join(projectPath, sectionNames[0]); // Use the first section name for the initial folder.  If you need to handle multiple files per section, you'll need a more complex approach.
        fs.mkdirSync(sectionPath, { recursive: true }); // Create the directory
        cb(null, sectionPath); // Set the destination folder
      })
      .catch((err) => cb(err, null)); // Handle database errors
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    ); // Unique filenames
  },
});

const upload = multer({ storage: storage });

router.post("/addsections", upload.array("files"), async (req, res) => {
  const { projectId, sectionNames } = req.body;
  const errors = {}; // Object to store errors
  const sectionsToAdd = [];

  if (!projectId || !sectionNames || !Array.isArray(sectionNames)) {
    // ... (Cleanup - same as before)
    return res.status(400).json({ message: "Données invalides" });
  }

  try {
    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);

    if (!project || project.length === 0) {
      // ... (Cleanup - same as before)
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const projectName = project[0].project_name;

    // Validation and duplicate check
    for (const sectionName of sectionNames) {
      if (!sectionName) continue; // Skip empty names

      const [existingSection] = await db
        .promise()
        .query(
          "SELECT id FROM section WHERE project_id = ? AND section_name = ?",
          [projectId, sectionName]
        );

      if (existingSection && existingSection.length > 0) {
        errors[sectionName] = "This section name is already in use."; // Add error message
      } else {
        sectionsToAdd.push(sectionName); // Add to the array of sections to add
      }
    }

    if (Object.keys(errors).length > 0) {
      // If there are errors, send them back
      return res
        .status(400)
        .json({ message: "Des noms de section sont invalides.", errors }); // Send errors object
    }

    // Now add the valid sections
    for (const sectionName of sectionsToAdd) {
      const sectionPath = path.join(
        __dirname,
        "..",
        "uploads",
        projectName,
        sectionName
      );
      fs.mkdirSync(sectionPath, { recursive: true });

      await db
        .promise()
        .query("INSERT INTO section (project_id, section_name) VALUES (?, ?)", [
          projectId,
          sectionName,
        ]);

      console.log(
        `Section "${sectionName}" ajoutée pour le projet ${projectName} (ID: ${projectId})`
      );
    }

    res
      .status(201)
      .json({ message: "Sections et fichiers ajoutés avec succès" });
  } catch (error) {
    console.error("Erreur lors de l'ajout des sections:", error);
    // ... (Cleanup - same as before)
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
