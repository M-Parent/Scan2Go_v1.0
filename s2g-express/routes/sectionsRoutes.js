const express = require("express");
const router = express.Router();
const multer = require("multer");
const AdmZip = require("adm-zip");
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

// Route GET
router.get("/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const [sections] = await db
      .promise()
      .query("SELECT * FROM section WHERE project_id = ?", [projectId]);

    if (!sections || sections.length === 0) {
      // Renvoyer un tableau vide au lieu d'une erreur 404
      return res.status(200).json([]);
    }

    res.status(200).json(sections); // Envoyer les données des sections
  } catch (error) {
    console.error("Erreur lors de la récupération des sections:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.put("/:sectionId", async (req, res) => {
  const sectionId = req.params.sectionId;
  const { section_name: newSectionName } = req.body; // Get the new name from the request body

  if (!newSectionName) {
    return res.status(400).json({ error: "New section name is required." });
  }

  try {
    // 1. Get the current section name and project name
    const [section] = await db
      .promise()
      .query("SELECT section_name, project_id FROM section WHERE id = ?", [
        sectionId,
      ]);

    if (!section || section.length === 0) {
      return res.status(404).json({ error: "Section not found." });
    }

    const currentSectionName = section[0].section_name;
    const projectId = section[0].project_id;

    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);

    if (!project || project.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const projectName = project[0].project_name;

    // 2. Rename the folder
    const oldFolderPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      currentSectionName
    );
    const newFolderPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      newSectionName
    );

    if (fs.existsSync(oldFolderPath)) {
      // Only rename if the folder exists
      fs.renameSync(oldFolderPath, newFolderPath);
    } else {
      console.warn(`Folder ${oldFolderPath} does not exist. Skipping rename.`);
    }

    // 3. Update the database
    const [result] = await db
      .promise()
      .query("UPDATE section SET section_name = ? WHERE id = ?", [
        newSectionName,
        sectionId,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Section not found for update." }); // Should not happen but good to check
    }

    // 4. Return the updated section data (optional but good practice)
    const [updatedSection] = await db
      .promise()
      .query("SELECT * FROM section WHERE id = ?", [sectionId]);

    res.status(200).json(updatedSection[0]); // Send the updated section data
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:sectionId", async (req, res) => {
  const sectionId = req.params.sectionId;

  try {
    const [section] = await db
      .promise()
      .query("SELECT section_name, project_id FROM section WHERE id = ?", [
        sectionId,
      ]);

    if (!section || section.length === 0) {
      return res.status(404).json({ error: "Section not found." });
    }

    const sectionName = section[0].section_name;
    const projectId = section[0].project_id;

    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);

    if (!project || project.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const projectName = project[0].project_name;

    // 1. Delete the folder
    const folderPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName
    );

    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true }); // Use recursive: true to delete non-empty directories
    } else {
      console.warn(`Folder ${folderPath} does not exist. Skipping delete.`);
    }

    // 2. Delete the database entry
    const [result] = await db
      .promise()
      .query("DELETE FROM section WHERE id = ?", [sectionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Section not found for deletion." });
    }

    res.status(200).json({ message: "Section deleted successfully." });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/export/:sectionId", async (req, res) => {
  const sectionId = req.params.sectionId;

  try {
    const [section] = await db
      .promise()
      .query("SELECT section_name, project_id FROM section WHERE id = ?", [
        sectionId,
      ]);
    if (!section || section.length === 0) {
      return res.status(404).json({ error: "Section not found." });
    }
    const sectionName = section[0].section_name;
    const projectId = section[0].project_id;

    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);
    if (!project || project.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const projectName = project[0].project_name;

    const folderPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName
    );

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "Section folder not found." });
    }

    // Récupérer les chemins des fichiers depuis la base de données
    const [files] = await db
      .promise()
      .query("SELECT path_file FROM file WHERE section_id = ?", [sectionId]);

    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ error: "No files found for this section." });
    }

    const zip = new AdmZip();

    // Ajouter chaque fichier au ZIP en conservant la structure
    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path_file); // Assurez-vous que le chemin est correct
      if (fs.existsSync(filePath)) {
        // Calculer le chemin relatif à partir du dossier de la section
        const relativePath = path.relative(folderPath, filePath);
        zip.addLocalFile(filePath, path.dirname(relativePath)); // Ajouter le fichier en conservant la structure
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

    const zipBuffer = zip.toBuffer();

    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename=${sectionName}.zip`);
    res.send(zipBuffer);
  } catch (error) {
    console.error("Error exporting section:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/export-qr/:sectionId", async (req, res) => {
  const sectionId = req.params.sectionId;

  try {
    const [section] = await db
      .promise()
      .query("SELECT section_name, project_id FROM section WHERE id = ?", [
        sectionId,
      ]);
    if (!section || section.length === 0) {
      return res.status(404).json({ error: "Section not found." });
    }
    const sectionName = section[0].section_name;
    const projectId = section[0].project_id;

    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);
    if (!project || project.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    const projectName = project[0].project_name;

    const folderPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName
    );

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "Section folder not found." });
    }

    // Récupérer les chemins des fichiers PDF depuis la base de données
    const [files] = await db
      .promise()
      .query("SELECT path_pdf FROM file WHERE section_id = ?", [sectionId]);

    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ error: "No QR code files found for this section." });
    }

    const zip = new AdmZip();

    // Ajouter chaque fichier PDF au ZIP en conservant la structure
    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path_pdf); // Assurez-vous que le chemin est correct
      if (fs.existsSync(filePath)) {
        const relativePath = path.relative(folderPath, filePath);
        zip.addLocalFile(filePath, path.dirname(relativePath));
      } else {
        console.warn(`QR code file not found: ${filePath}`);
      }
    }

    const zipBuffer = zip.toBuffer();

    res.set("Content-Type", "application/zip");
    res.set(
      "Content-Disposition",
      `attachment; filename=${sectionName}_qr.zip`
    ); // Nom du fichier ZIP modifié
    res.send(zipBuffer);
  } catch (error) {
    console.error("Error exporting QR code files:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
