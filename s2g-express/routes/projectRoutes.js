const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");

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
              console.log("Projet ajouté avec succès !");
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
          // Suppression de l'image uploadée si le nom existe déjà
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return db.rollback(() =>
            res.status(400).json({ error: "Ce nom de projet existe déjà." })
          );
        }

        db.query(
          "SELECT project_name, project_image FROM project WHERE id = ?",
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
                        console.log("Image non trouvé");
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
                            console.log(
                              "Nom du fichier mis à jour dans la base de données."
                            );
                            currentProjectName = projectName;
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
                        res.status(200).json(updatedProjectResults[0]);
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
        return res
          .status(500)
          .json({ error: "Erreur lors de la récupération du projet." });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Projet non trouvé." });
      }

      const projectName = results[0].project_name;
      const projectImage = results[0].project_image;
      const projectFolder = path.join("uploads", projectName);
      const projectImageToDelete = path.join(
        "uploads",
        "project_img",
        projectImage.substring(projectImage.lastIndexOf("/") + 1)
      ); // Chemin vers l'image à supprimer

      db.query("DELETE FROM project WHERE id = ?", [projectId], (err) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Erreur lors de la suppression du projet." });
        }

        fs.access(projectFolder, (err) => {
          if (!err) {
            // Vérifier si le dossier existe avant de le supprimer
            fs.rm(projectFolder, { recursive: true }, (err) => {
              if (err) {
                console.error(
                  "Erreur lors de la suppression du dossier :",
                  err
                );
              } else {
                console.log("Dossier supprimé :", projectFolder);
              }
            });
          } else {
            console.log(
              "Le dossier n'existe pas ou a déjà été supprimé :",
              projectFolder
            );
          }
        });

        fs.access(projectImageToDelete, (err) => {
          if (!err) {
            // Vérifier si l'image existe avant de la supprimer
            fs.unlink(projectImageToDelete, (err) => {
              if (err) {
                console.error(
                  "Erreur lors de la suppression de l'image :",
                  err
                );
              } else {
                console.log("Image supprimée :", projectImageToDelete);
              }
            });
          } else {
            console.log(
              "L'image n'existe pas ou a déjà été supprimée :",
              projectImageToDelete
            );
          }
        });

        return res.status(204).json();
      });
    }
  );
});

module.exports = router;
