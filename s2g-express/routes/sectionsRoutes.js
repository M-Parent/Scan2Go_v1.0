const express = require("express");
const router = express.Router();
const multer = require("multer");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const logger = require("../logger");

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
  const errors = {};
  const sectionsToAdd = [];

  if (!projectId || !sectionNames || !Array.isArray(sectionNames)) {
    return res.status(400).json({ message: "Données invalides" });
  }

  try {
    const [project] = await db
      .promise()
      .query("SELECT project_name FROM project WHERE id = ?", [projectId]);

    if (!project || project.length === 0) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const projectName = project[0].project_name;

    for (const sectionName of sectionNames) {
      if (!sectionName) continue;

      const [existingSection] = await db
        .promise()
        .query(
          "SELECT id FROM section WHERE project_id = ? AND section_name = ?",
          [projectId, sectionName]
        );

      if (existingSection && existingSection.length > 0) {
        errors[sectionName] = "This section name is already in use.";
      } else {
        sectionsToAdd.push(sectionName);
      }
    }

    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json({ message: "Des noms de section sont invalides.", errors });
    }

    for (const sectionName of sectionsToAdd) {
      const sectionPath = path.join(
        __dirname,
        "..",
        "uploads",
        projectName,
        sectionName
      );
      fs.mkdirSync(sectionPath, { recursive: true });

      // Insertion de la section et récupération de l'ID
      const [result] = await db
        .promise()
        .query("INSERT INTO section (project_id, section_name) VALUES (?, ?)", [
          projectId,
          sectionName,
        ]);

      const sectionId = result.insertId;

      // Récupération de la date de création
      const [sectionInfo] = await db
        .promise()
        .query("SELECT created_at FROM section WHERE id = ?", [sectionId]);

      const createdAt = sectionInfo[0].created_at;

      logger.info(
        `Section created: ID = ${sectionId}, section name: "${sectionName}" for project name: "${projectName}", Created at: ${createdAt}`
      );
    }

    res
      .status(201)
      .json({ message: "Sections et fichiers ajoutés avec succès" });
  } catch (error) {
    console.error("Erreur lors de l'ajout des sections:", error);
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
  const { section_name: newSectionName } = req.body;

  if (!newSectionName) {
    return res.status(400).json({ error: "New section name is required." });
  }

  try {
    // 1. Get the current section name, project name, and updated_at
    const [section] = await db
      .promise()
      .query(
        "SELECT section_name, project_id, updated_at FROM section WHERE id = ?",
        [sectionId]
      );

    if (!section || section.length === 0) {
      return res.status(404).json({ error: "Section not found." });
    }

    const currentSectionName = section[0].section_name;
    const projectId = section[0].project_id;
    const sectionUpdatedAt = section[0].updated_at;

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
      fs.renameSync(oldFolderPath, newFolderPath);
    } else {
      logger.warn(`Folder ${oldFolderPath} does not exist. Skipping rename.`);
    }

    // 3. Update the database
    const [result] = await db
      .promise()
      .query("UPDATE section SET section_name = ? WHERE id = ?", [
        newSectionName,
        sectionId,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Section not found for update." });
    }

    // 4. Update file paths in the database
    const [filesToUpdate] = await db
      .promise()
      .query(
        "SELECT id, path_file, url_qr_code, path_pdf FROM file WHERE section_id = ?",
        [sectionId]
      );

    for (const file of filesToUpdate) {
      // Créer les chemins pour le remplacement
      const oldFilePath = `uploads\\${projectName}\\${currentSectionName}\\`;
      const newFilePath = `uploads\\${projectName}\\${newSectionName}\\`;
      const oldUrlPath = `uploads/${projectName}/${currentSectionName}/`;
      const newUrlPath = `uploads/${projectName}/${newSectionName}/`;

      // Remplacer les chemins (backslashes pour path_file et path_pdf)
      const updatedPathFile = file.path_file.replace(oldFilePath, newFilePath);
      const updatedPathPdf = file.path_pdf.replace(oldFilePath, newFilePath);

      // Remplacer les chemins (forward slashes pour url_qr_code)
      const updatedUrlQrCode = file.url_qr_code.replace(oldUrlPath, newUrlPath);

      // Mettre à jour la base de données
      await db
        .promise()
        .query(
          "UPDATE file SET path_file = ?, url_qr_code = ?, path_pdf = ? WHERE id = ?",
          [updatedPathFile, updatedUrlQrCode, updatedPathPdf, file.id]
        );

      logger.info(
        `Updated file paths for file ID ${file.id} - Old path: ${oldFilePath}, New path: ${newFilePath}`
      );
    }

    // 5. Return the updated section data and log the change
    const [updatedSection] = await db
      .promise()
      .query("SELECT * FROM section WHERE id = ?", [sectionId]);

    const updatedSectionData = updatedSection[0];

    // Log the section name change
    logger.info(
      `Section name changed - Old Name: "${currentSectionName}", New Name: "${updatedSectionData.section_name}", for project: "${projectName}", Updated at: ${sectionUpdatedAt}`
    );

    res.status(200).json(updatedSectionData);
  } catch (error) {
    logger.error("Error updating section:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:sectionId", async (req, res) => {
  const sectionId = req.params.sectionId;

  try {
    // Récupérer les informations de la section avant la suppression
    const [section] = await db
      .promise()
      .query(
        "SELECT section_name, project_id, updated_at FROM section WHERE id = ?",
        [sectionId]
      );

    if (!section || section.length === 0) {
      return res.status(404).json({ error: "Section not found." });
    }

    const sectionName = section[0].section_name;
    const projectId = section[0].project_id;
    const sectionUpdatedAt = section[0].updated_at;

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
      fs.rmSync(folderPath, { recursive: true });
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

    // Journalisation de la suppression après la suppression
    logger.info(
      `Section deleted: ID = ${sectionId}, section name: "${sectionName}" for project name: "${projectName}", deleted at: ${sectionUpdatedAt}`
    );

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

    const [files] = await db
      .promise()
      .query("SELECT path_file FROM file WHERE section_id = ?", [sectionId]);

    if (!files || files.length === 0) {
      logger.info(
        `Section files export failed: Section ID=${sectionId}, Section Name="${sectionName}", Project Name="${projectName}", No files found.`
      );
      return res
        .status(404)
        .json({ error: "No files found for this section." });
    }

    const zip = new AdmZip();

    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path_file);
      if (fs.existsSync(filePath)) {
        const relativePath = path.relative(folderPath, filePath);
        zip.addLocalFile(filePath, path.dirname(relativePath));
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

    const zipBuffer = zip.toBuffer();

    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename=${sectionName}.zip`);
    res.send(zipBuffer);

    const now = new Date();
    logger.info(
      `Section files exported: Section ID=${sectionId}, Section Name="${sectionName}", Project Name="${projectName}", Exported at: ${now.toISOString()}`
    );
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

    const [files] = await db
      .promise()
      .query("SELECT path_pdf FROM file WHERE section_id = ?", [sectionId]);

    if (!files || files.length === 0) {
      logger.info(
        `Section QR codes export failed: Section ID=${sectionId}, Section Name="${sectionName}", Project Name="${projectName}", No QR code files found.`
      );
      return res
        .status(404)
        .json({ error: "No QR code files found for this section." });
    }

    const zip = new AdmZip();

    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path_pdf);
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
    );
    res.send(zipBuffer);

    const now = new Date();
    logger.info(
      `Section QR codes exported: Section ID=${sectionId}, Section Name="${sectionName}", Project Name="${projectName}", Exported at: ${now.toISOString()}`
    );
  } catch (error) {
    console.error("Error exporting QR code files:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
