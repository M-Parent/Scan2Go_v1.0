const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const AdmZip = require("adm-zip");
const fs = require("fs");
const db = require("../db");
const logger = require("../logger");

// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectImgFolder = path.join("uploads", "project_img");
    fs.mkdirSync(projectImgFolder, { recursive: true });
    cb(null, projectImgFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});
const upload = multer({ storage: storage });

// Route POST pour la création de projets
router.post("/", upload.single("projectImage"), (req, res) => {
  const { projectName } = req.body;
  const projectImage = req.file ? req.file.path.replace(/\\/g, "/") : null;

  if (!projectName) {
    return res.status(400).json({ error: "Le nom du projet est requis." });
  }

  db.query(
    "SELECT 1 FROM project WHERE project_name = ?",
    [projectName],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification du nom du projet :", err);
        return res.status(500).json({
          error: "Erreur lors de la vérification du nom du projet.",
        });
      }

      if (results.length > 0) {
        // Suppression de l'image uploadée si le nom existe déjà
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Ce nom de projet existe déjà." });
      }

      const projectFolder = path.join("uploads", projectName);
      fs.mkdirSync(projectFolder, { recursive: true });

      db.query(
        "INSERT INTO project (project_name, project_image) VALUES (?, ?)",
        [projectName, projectImage],
        (err, results) => {
          if (err) {
            console.error("Erreur lors de l'ajout du projet :", err);
            return res
              .status(500)
              .json({ error: "Erreur lors de l'ajout du projet." });
          }

          const newProjectId = results.insertId;

          db.query(
            "SELECT * FROM project WHERE id = ?",
            [newProjectId],
            (err, newProjectResults) => {
              if (err) {
                console.error(
                  "Erreur lors de la récupération du nouveau projet :",
                  err
                );
                return res.status(500).json({
                  error: "Erreur lors de la récupération du nouveau projet.",
                });
              }
              const newProject = newProjectResults[0];
              logger.info(
                `Project created: ID=${newProject.id}, Name="${newProject.project_name}", Image Path="${newProject.project_image}", Created At=${newProject.created_at}`
              );
              return res.status(201).json(newProjectResults[0]);
            }
          );
        }
      );
    }
  );
});
// GET routes (adjust similarly)
router.get("/", (req, res) => {
  db.query("SELECT * FROM project", (err, results) => {
    if (err) {
      /* ... */
    }
    res.status(200).json(results);
  });
});

router.get("/:id", (req, res) => {
  const projectId = req.params.id;
  db.query(
    "SELECT * FROM project WHERE id = ?",
    [projectId],
    (err, results) => {
      if (err) {
        /* ... */
      }
      if (results.length === 0) {
        /* ... */
      }
      res.status(200).json(results[0]);
    }
  );
});

// Route PUT pour la mise à jour des projets
router.put("/:id", upload.single("projectImage"), (req, res) => {
  const projectId = req.params.id;
  let { projectName } = req.body;
  let newProjectImage = req.file ? req.file.path.replace(/\\/g, "/") : null;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Erreur transaction." });
    }

    db.query(
      "SELECT 1 FROM project WHERE project_name = ? AND id != ?",
      [projectName, projectId],
      (err, results) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ error: err.message })
          );
        }
        if (results.length > 0) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return db.rollback(() =>
            res.status(400).json({ error: "Ce nom de projet existe déjà." })
          );
        }

        db.query(
          "SELECT project_name, project_image, updated_at FROM project WHERE id = ?",
          [projectId],
          (err, results) => {
            if (err || results.length === 0) {
              return db.rollback(() =>
                res
                  .status(err ? 500 : 404)
                  .json({ error: err ? err.message : "Projet introuvable." })
              );
            }

            let currentProjectName = results[0].project_name;
            let dbProjectImage = results[0].project_image;
            let currentUpdatedAt = results[0].updated_at;

            if (!projectName) projectName = currentProjectName;

            const updateProject = (newProjectImage, callback) => {
              const sql = `
                UPDATE project 
                SET project_name = ?, 
                    project_image = CASE 
                        WHEN ? IS NOT NULL THEN ? 
                        ELSE ?
                    END
                WHERE id = ?`;

              const imagePathForDB = newProjectImage
                ? newProjectImage.replace("uploads/", "uploads/")
                : dbProjectImage;

              db.query(
                sql,
                [
                  projectName,
                  newProjectImage,
                  imagePathForDB,
                  dbProjectImage,
                  projectId,
                ],
                (err, result) => {
                  if (err) {
                    return callback(err);
                  }
                  callback(null, result);
                }
              );
            };

            const handleImageAndFolder = (callback) => {
              const oldFolderPath = path.join("uploads", currentProjectName);
              const newFolderPath = path.join("uploads", projectName);

              if (projectName !== currentProjectName) {
                fs.access(oldFolderPath, (err) => {
                  if (err) {
                    return callback(new Error("Ancien dossier inaccessible."));
                  }

                  fs.access(
                    dbProjectImage
                      .replace("uploads/", "uploads/project_img/")
                      .split("/")
                      .slice(0, -1)
                      .join("/"),
                    (err) => {
                      if (err) {
                        logger.info("Image non trouvé");
                      }

                      fs.rename(oldFolderPath, newFolderPath, (err) => {
                        if (err) {
                          return callback(
                            new Error("Renommage dossier échoué.")
                          );
                        }

                        db.query(
                          "UPDATE project SET project_image = ? WHERE id = ?",
                          [
                            dbProjectImage.replace(
                              currentProjectName,
                              projectName
                            ),
                            projectId,
                          ],
                          (err, result) => {
                            if (err) {
                              console.error(
                                "Erreur lors de la mise à jour du nom du fichier :",
                                err
                              );
                              return callback(err);
                            }
                            callback(null);
                          }
                        );
                      });
                    }
                  );
                });
              } else {
                callback(null);
              }
            };

            const handleDeleteOldImage = (callback) => {
              if (newProjectImage && dbProjectImage) {
                const fullOldImagePath = path.join(
                  "uploads",
                  "project_img",
                  dbProjectImage.substring(dbProjectImage.lastIndexOf("/") + 1)
                );
                fs.access(fullOldImagePath, (err) => {
                  if (!err) {
                    fs.unlink(fullOldImagePath, (err) => {
                      if (err) {
                        console.error(
                          "Erreur suppression ancienne image :",
                          err
                        );
                      }
                      callback(null);
                    });
                  } else {
                    callback(null);
                  }
                });
              } else {
                callback(null);
              }
            };

            handleDeleteOldImage((err) => {
              if (err) {
                return db.rollback(() =>
                  res.status(500).json({ error: err.message })
                );
              }

              handleImageAndFolder((err) => {
                if (err) {
                  return db.rollback(() =>
                    res.status(500).json({ error: err.message })
                  );
                }

                updateProject(newProjectImage, (err, result) => {
                  if (err) {
                    return db.rollback(() =>
                      res.status(500).json({ error: err.message })
                    );
                  }

                  db.commit((err) => {
                    if (err) {
                      return res.status(500).json({ error: "Erreur commit." });
                    }
                    db.query(
                      "SELECT * FROM project WHERE id = ?",
                      [projectId],
                      (err, updatedProjectResults) => {
                        const updatedProject = updatedProjectResults[0];

                        //Log des changements
                        if (
                          currentProjectName !== updatedProject.project_name
                        ) {
                          logger.info(
                            `Project name changed - Old: "${currentProjectName}", New: "${updatedProject.project_name}", Updated at: ${updatedProject.updated_at}`
                          );
                        }
                        if (dbProjectImage !== updatedProject.project_image) {
                          logger.info(
                            `Project image changed - Old: "${dbProjectImage}", New: "${updatedProject.project_image}", Updated at: ${updatedProject.updated_at}`
                          );
                        }

                        res.status(200).json(updatedProject);
                      }
                    );
                  });
                });
              });
            });
          }
        );
      }
    );
  });
});

// DELETE route (Corrected to use callbacks)
router.delete("/:id", (req, res) => {
  const projectId = req.params.id;

  db.query(
    "SELECT project_name, project_image FROM project WHERE id = ?",
    [projectId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error retrieving project." });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Project not found." });
      }

      const projectName = results[0].project_name;
      const projectImage = results[0].project_image;
      const projectFolder = path.join("uploads", projectName);
      const projectImageToDelete = path.join(
        "uploads",
        "project_img",
        projectImage.substring(projectImage.lastIndexOf("/") + 1)
      );

      // Nouvelle requête pour récupérer les informations du projet avant la suppression
      db.query(
        "SELECT id, project_name, updated_at FROM project WHERE id = ?",
        [projectId],
        (err, projectResults) => {
          if (err) {
            console.error("Error retrieving project:", err);
            return res.status(500).json({
              error: "Error retrieving project.",
            });
          }

          if (projectResults.length > 0) {
            const project = projectResults[0];
            logger.info(
              `Project deleted: ID=${project.id}, Name="${project.project_name}", Deleted At=${project.updated_at}`
            );
          } else {
            logger.info(`Project with ID ${projectId} not found.`);
            return res.status(404).json({ error: "Project not found." });
          }

          // Suppression du projet après la journalisation
          db.query("DELETE FROM project WHERE id = ?", [projectId], (err) => {
            if (err) {
              return res.status(500).json({ error: "Error deleting project." });
            }

            fs.access(projectFolder, (err) => {
              if (!err) {
                fs.rm(projectFolder, { recursive: true }, (err) => {
                  if (err) {
                    console.error("Error deleting folder:", err);
                  } else {
                    logger.info("Folder deleted:", projectFolder);
                  }
                });
              } else {
                logger.info(
                  "Folder does not exist or has already been deleted:",
                  projectFolder
                );
              }
            });

            fs.access(projectImageToDelete, (err) => {
              if (!err) {
                fs.unlink(projectImageToDelete, (err) => {
                  if (err) {
                    console.error("Error deleting image:", err);
                  } else {
                    logger.info("Image deleted:", projectImageToDelete);
                  }
                });
              } else {
                logger.info(
                  "Image does not exist or has already been deleted:",
                  projectImageToDelete
                );
              }
            });

            return res.status(204).json();
          });
        }
      );
    }
  );
});

router.get("/export-project-files/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);
    if (!project || project.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const projectName = project[0].project_name;

    const projectFolder = path.join(__dirname, "..", "uploads", projectName);

    if (!fs.existsSync(projectFolder)) {
      return res.status(404).json({ error: "Project folder not found." });
    }

    // Récupérer tous les chemins de fichiers pour le projet
    const [files] = await db.promise().query(
      `
        SELECT file.path_file
        FROM file
        JOIN section ON file.section_id = section.id
        WHERE section.project_id = ?
      `,
      [projectId]
    );

    if (!files || files.length === 0) {
      logger.info(
        `Project files export failed: Project ID=${projectId}, Project Name="${projectName}", No files found.`
      );
      return res
        .status(404)
        .json({ error: "No files found for this project." });
    }

    const zip = new AdmZip();

    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path_file);
      if (fs.existsSync(filePath)) {
        const relativePath = path.relative(projectFolder, filePath);
        zip.addLocalFile(filePath, path.dirname(relativePath));
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

    const zipBuffer = zip.toBuffer();

    res.set("Content-Type", "application/zip");
    res.set(
      "Content-Disposition",
      `attachment; filename=${projectName}_files.zip`
    );
    res.send(zipBuffer);

    // Ajout du message de journalisation
    const now = new Date();
    logger.info(
      `Project files exported: Project ID=${projectId}, Project Name="${projectName}", Exported at: ${now.toISOString()}`
    );
  } catch (error) {
    console.error("Error exporting project files:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/export-project-qr/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);
    if (!project || project.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const projectName = project[0].project_name;

    const projectFolder = path.join(__dirname, "..", "uploads", projectName);

    if (!fs.existsSync(projectFolder)) {
      return res.status(404).json({ error: "Project folder not found." });
    }

    // Récupérer tous les chemins de fichiers QR pour le projet
    const [files] = await db.promise().query(
      `
        SELECT file.path_pdf
        FROM file
        JOIN section ON file.section_id = section.id
        WHERE section.project_id = ?
      `,
      [projectId]
    );

    if (!files || files.length === 0) {
      logger.info(
        `Project QR codes export failed: Project ID=${projectId}, Project Name="${projectName}", No QR code files found.`
      );
      return res
        .status(404)
        .json({ error: "No QR code files found for this project." });
    }

    const zip = new AdmZip();

    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path_pdf);
      if (fs.existsSync(filePath)) {
        const relativePath = path.relative(projectFolder, filePath);
        zip.addLocalFile(filePath, path.dirname(relativePath));
      } else {
        console.warn(`QR code file not found: ${filePath}`);
      }
    }

    const zipBuffer = zip.toBuffer();

    res.set("Content-Type", "application/zip");
    res.set(
      "Content-Disposition",
      `attachment; filename=${projectName}_qr.zip`
    );
    res.send(zipBuffer);

    // Ajout du message de journalisation
    const now = new Date();
    logger.info(
      `Project QR codes exported: Project ID=${projectId}, Project Name="${projectName}", Exported at: ${now.toISOString()}`
    );
  } catch (error) {
    console.error("Error exporting project QR codes:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:projectId/search", (req, res) => {
  const projectId = req.params.projectId;
  const searchTerm = req.query.term;

  db.query(
    `SELECT
    f.*,
    s.section_name,
    p.project_name
    FROM file f
    JOIN section s ON f.section_id = s.id
    JOIN project p ON s.project_id = p.id
    LEFT JOIN tag t ON f.id = t.file_id
    WHERE p.id = ? AND (
    f.name LIKE ? OR
    s.section_name LIKE ? OR
    t.tag_name LIKE ?
)
GROUP BY f.id`,
    [projectId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la recherche de fichiers :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de la recherche de fichiers." });
      }
      res.status(200).json(results);
    }
  );
});

module.exports = router;
