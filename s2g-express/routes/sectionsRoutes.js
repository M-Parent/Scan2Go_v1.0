// sectionsRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const db = require("../db");

router.post("/:projectId", (req, res) => {
  const projectId = req.params.projectId;
  const { sections } = req.body; // sections est un tableau d'objets { name: "NomSection" }

  if (!Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "Aucune section fournie." });
  }

  if (sections.length > 20) {
    return res
      .status(400)
      .json({ error: "Vous ne pouvez pas ajouter plus de 20 sections." });
  }

  db.query(
    "SELECT project_name FROM project WHERE id = ?",
    [projectId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Projet non trouvé." });
      }

      const projectName = results[0].project_name;
      const projectFolder = path.join("uploads", projectName);

      // Vérifier si le dossier du projet existe
      fs.access(projectFolder, (err) => {
        if (err) {
          return res.status(500).json({ error: "Dossier projet non trouvé." });
        }

        db.beginTransaction((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          let sectionsProcessed = 0;
    const errors = [];
    const createdSections = []; // Array to store the created sections

    sections.forEach((section) => {
      createSection(section, (err, result) => {
        if (err) {
          // ... (error handling)
        }

        sectionsProcessed++;
        if (result && result.insertId) { // Check if result and insertId exists
          // Fetch the section from the db to get all the data
          db.query("SELECT * FROM section WHERE id = ?", result.insertId, (err, sectionData) => {
            if (err) {
              errors.push(err);
              db.rollback(() => {
                return res.status(500).json({ error: errors.map((e) => e.message).join(", ") });
              });
            } else {
              createdSections.push(sectionData[0]); // Add the created section data
              if (sectionsProcessed === sections.length) {
                if (errors.length > 0) {
                  // ... (error handling)
                } else {
                  db.commit((err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ sections: createdSections, message: "Sections créées avec succès." }); // Send back the sections
                  });
                }
              }
            }
          });
        }


      });
    });
  });
});

router.get("/:projectId", (req, res) => {
  const projectId = req.params.projectId;

  db.query(
    "SELECT * FROM section WHERE project_id = ?",
    [projectId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(results); // Envoyer les résultats au format JSON
    }
  );
});

module.exports = router;
