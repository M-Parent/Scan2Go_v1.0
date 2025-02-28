const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const os = require("os");
require("dotenv").config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { projectName, sectionName, fileName } = req.body;
    if (!projectName || !sectionName || !fileName) {
      return cb(
        new Error("Project, section, or file name missing in request body.")
      );
    }
    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName,
      fileName
    );
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if ("IPv4" === iface.family && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

router.post("/upload", upload.single("file"), async (req, res) => {
  const { fileName, sectionName, projectName, tags } = req.body;
  const originalFileName = req.file.originalname;
  const filePath = path.join(
    "uploads",
    projectName,
    sectionName,
    fileName,
    originalFileName
  );

  try {
    const [sectionResults] = await db
      .promise()
      .query("SELECT id FROM section WHERE section_name = ?", [sectionName]);

    if (sectionResults.length === 0) {
      return res.status(400).send("Section not found.");
    }

    const sectionId = sectionResults[0].id;

    const sql =
      "INSERT INTO file (section_id, name, path_file, url_qr_code, path_pdf) VALUES (?, ?, ?, NULL, NULL)";
    const [insertResults] = await db
      .promise()
      .query(sql, [sectionId, fileName, filePath]);

    const fileId = insertResults.insertId;

    const serverIP = process.env.SERVER_IP_EXPRESS || getLocalIPv4();
    const fileUrl = `http://${serverIP}:6301/${filePath.replace(/\\/g, "/")}`;

    const pdfPath = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName,
      fileName,
      `${fileName}_qr.pdf`
    );

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    QRCode.toDataURL(fileUrl, { errorCorrectionLevel: "H" }, (err, url) => {
      if (err) {
        console.error("Erreur lors de la génération du QR code :", err);
        return;
      }

      // Ajouter le nom du fichier en gras, 48px et centré
      doc.fontSize(48).font("Helvetica-Bold");

      const textWidth = doc.widthOfString(fileName);
      const pageWidth = doc.page.width;
      const textX = (pageWidth - textWidth) / 2;
      const textY = 50;

      doc.text(fileName, textX, textY);

      // Ajouter ProjectName/SectionName/Filename en 24px, normal, centré
      doc.fontSize(20).font("Helvetica");
      const subText = `${projectName} / ${sectionName} / ${fileName}`;
      const subTextWidth = doc.widthOfString(subText);
      const subTextX = (pageWidth - subTextWidth) / 2;
      const subTextY = textY + 100; // Ajustez la position verticale
      doc.text(subText, subTextX, subTextY);

      // Ajouter les tags en 24px, normal, centré
      if (tags && tags.length > 0) {
        doc.fontSize(20).font("Helvetica");
        const tagsText = Array.isArray(tags) ? tags.join(", ") : tags;
        const tagsTextWidth = doc.widthOfString(tagsText);
        const tagsTextX = (pageWidth - tagsTextWidth) / 2;
        const tagsTextY = subTextY + 70; // Ajustez la position verticale
        doc.text(tagsText, tagsTextX, tagsTextY);
      }

      // Centrer le QR code
      const qrCodeWidth = 250;
      const qrCodeHeight = 250;
      const pageHeight = doc.page.height;
      const x = (pageWidth - qrCodeWidth) / 2;
      let y = 0;
      if (tags && tags.length > 0) {
        y = (pageHeight - qrCodeHeight) / 2;
      } else {
        y = (pageHeight - qrCodeHeight) / 2;
      }

      doc.image(url, x, y, {
        fit: [qrCodeWidth, qrCodeHeight],
        align: "center",
        valign: "center",
      });

      doc.end();
    });

    const pdfRelativePath = path.win32.relative(
      path.win32.join(__dirname, ".."),
      pdfPath
    );
    await db
      .promise()
      .query("UPDATE file SET url_qr_code = ?, path_pdf = ? WHERE id = ?", [
        fileUrl,
        pdfRelativePath.replace(/\\/g, "\\"),
        fileId,
      ]);

    if (tags && tags.length > 0) {
      if (Array.isArray(tags)) {
        for (const tagName of tags) {
          await db
            .promise()
            .query("INSERT INTO tag (file_id, tag_name) VALUES (?, ?)", [
              fileId,
              tagName,
            ]);
        }
      } else {
        await db
          .promise()
          .query("INSERT INTO tag (file_id, tag_name) VALUES (?, ?)", [
            fileId,
            tags,
          ]);
      }
    }

    res
      .status(200)
      .send(
        "Fichier téléchargé, QR code généré dans un PDF et informations enregistrées avec succès."
      );
  } catch (err) {
    console.error("Erreur lors de l'insertion dans la base de données :", err);
    return res
      .status(500)
      .send("Erreur lors de l'insertion dans la base de données.");
  }
});

router.get("/checkFileName", async (req, res) => {
  const { fileName, sectionId } = req.query;

  if (!fileName || !sectionId) {
    return res
      .status(400)
      .json({ error: "Nom de fichier et ID de section requis." });
  }

  try {
    const [fileResults] = await db.promise().query(
      `
        SELECT * FROM file 
        WHERE section_id = ? AND name = ?
      `,
      [sectionId, fileName]
    );

    res.json({ exists: fileResults.length > 0 });
  } catch (err) {
    console.error("Erreur lors de la vérification du nom de fichier :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

router.use("/uploads", (req, res, next) => {
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${path.basename(req.url)}"`
  );
  next();
});

router.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

router.get("/files/:sectionId", async (req, res) => {
  const { sectionId } = req.params;

  try {
    const [files] = await db
      .promise()
      .query("SELECT * FROM file WHERE section_id = ?", [sectionId]);

    // Ajouter la récupération de la taille du fichier
    const filesWithSize = await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(__dirname, "..", file.path_file);
          const stats = fs.statSync(filePath);
          return { ...file, size: stats.size };
        } catch (error) {
          console.error(`Error getting file size for ${file.name}:`, error);
          return { ...file, size: 0 }; // Taille 0 en cas d'erreur
        }
      })
    );

    res.json(filesWithSize);
  } catch (err) {
    console.error("Erreur lors de la récupération des fichiers :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

router.get("/files/:fileId/tags", async (req, res) => {
  const { fileId } = req.params;

  try {
    const [tags] = await db
      .promise()
      .query("SELECT tag_name FROM tag WHERE file_id = ?", [fileId]);

    // Formatter les résultats pour renvoyer un tableau de noms de tags
    const tagNames = tags.map((tag) => tag.tag_name);

    res.json(tagNames);
  } catch (err) {
    console.error("Erreur lors de la récupération des tags :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

router.get("/files/:fileId", async (req, res) => {
  const { fileId } = req.params;
  console.log(`Récupération du fichier avec l'ID : ${fileId}`);
  try {
    const sql = "SELECT * FROM file WHERE id = ?"; // Stocker la requête dans une variable
    console.log("Requête SQL :", sql, [fileId]); // Afficher la requête et les paramètres
    const [files] = await db.promise().query(sql, [fileId]);

    console.log("Résultat de la requête SQL :", files);

    if (files.length === 0) {
      console.log(`Fichier avec l'ID : ${fileId} non trouvé.`);
      return res.status(404).json({ error: "Fichier non trouvé." });
    }

    console.log(`Fichier avec l'ID : ${fileId} trouvé :`, files);
    res.json(files);
  } catch (err) {
    console.error("Erreur lors de la récupération du fichier :", err);
    console.error("Erreur SQL:", err.sqlMessage, err.sql); // Afficher plus d'informations
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/files/:fileId", async (req, res) => {
  const { fileId } = req.params;

  try {
    // 1. Récupérer les informations du fichier depuis la base de données
    const [fileResults] = await db
      .promise()
      .query("SELECT * FROM file WHERE id = ?", [fileId]);

    if (fileResults.length === 0) {
      return res.status(404).json({ error: "Fichier non trouvé." });
    }

    const file = fileResults[0];
    const filePath = path.join(__dirname, "..", file.path_file);
    const pdfPath = path.join(__dirname, "..", file.path_pdf);

    // 2. Supprimer le fichier et le PDF du système de fichiers
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    // 3. Supprimer le dossier contenant le fichier
    const folderPath = path.dirname(filePath);
    if (fs.existsSync(folderPath) && fs.readdirSync(folderPath).length === 0) {
      fs.rmdirSync(folderPath);
    }

    // 4. Supprimer l'entrée du fichier de la base de données
    await db.promise().query("DELETE FROM file WHERE id = ?", [fileId]);

    // 5. Supprimer les tags associés au fichier
    await db.promise().query("DELETE FROM tag WHERE file_id = ?", [fileId]);

    res.json({ message: "Fichier supprimé avec succès." });
  } catch (err) {
    console.error("Erreur lors de la suppression du fichier :", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du fichier." });
  }
});

router.put("/files/:fileId", upload.single("file"), async (req, res) => {
  const { fileId } = req.params;
  const { fileName, projectName, sectionName, tags } = req.body;
  const newFile = req.file;

  // Fonction pour générer le PDF et le QR code
  const generatePdfAndQrCode = (
    fileUrl,
    pdfPath,
    fileName,
    projectName,
    sectionName,
    tags
  ) => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(pdfPath));

      QRCode.toDataURL(fileUrl, { errorCorrectionLevel: "H" }, (err, url) => {
        if (err) {
          return reject("Erreur lors de la génération du QR code.");
        }

        // Ajouter le nom du fichier en gras, 48px et centré
        doc.fontSize(48).font("Helvetica-Bold");
        const textWidth = doc.widthOfString(fileName);
        const pageWidth = doc.page.width;
        const textX = (pageWidth - textWidth) / 2;
        const textY = 50;
        doc.text(fileName, textX, textY);

        // Ajouter ProjectName/SectionName/Filename en 24px, normal, centré
        doc.fontSize(20).font("Helvetica");
        const subText = `${projectName} / ${sectionName} / ${fileName}`;
        const subTextWidth = doc.widthOfString(subText);
        const subTextX = (pageWidth - subTextWidth) / 2;
        const subTextY = textY + 100; // Ajustez la position verticale
        doc.text(subText, subTextX, subTextY);

        // Ajouter les tags en 24px, normal, centré
        if (tags && tags.length > 0) {
          doc.fontSize(20).font("Helvetica");
          const tagsText = Array.isArray(tags) ? tags.join(", ") : tags;
          const tagsTextWidth = doc.widthOfString(tagsText);
          const tagsTextX = (pageWidth - tagsTextWidth) / 2;
          const tagsTextY = subTextY + 70; // Ajustez la position verticale
          doc.text(tagsText, tagsTextX, tagsTextY);
        }

        // Centrer le QR code
        const qrCodeWidth = 250;
        const qrCodeHeight = 250;
        const pageHeight = doc.page.height;
        const x = (pageWidth - qrCodeWidth) / 2;
        let y = 0;
        if (tags && tags.length > 0) {
          y = (pageHeight - qrCodeHeight) / 2;
        } else {
          y = (pageHeight - qrCodeHeight) / 2;
        }

        doc.image(url, x, y, {
          fit: [qrCodeWidth, qrCodeHeight],
          align: "center",
          valign: "center",
        });

        doc.end();

        resolve();
      });
    });
  };

  try {
    // Récupérer les informations actuelles du fichier
    const [existingFiles] = await db
      .promise()
      .query("SELECT * FROM file WHERE id = ?", [fileId]);

    if (existingFiles.length === 0) {
      return res.status(404).json({ error: "Fichier non trouvé." });
    }

    const oldFileName = existingFiles[0].name;
    const oldFilePath = path.join(__dirname, "..", existingFiles[0].path_file);
    const oldFolderPath = path.dirname(oldFilePath); // Dossier actuel du fichier
    const parentFolder = path.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName
    );
    const newFolderPath = path.join(parentFolder, fileName); // Nouveau dossier si fileName change
    const newFilePath = path.resolve(
      newFolderPath,
      newFile ? newFile.originalname : path.basename(oldFilePath)
    );

    // Supprimer l'ancien PDF avant de renommer le dossier
    if (oldFileName !== fileName) {
      const oldPdfPath = path.join(
        __dirname,
        "..",
        "uploads",
        projectName,
        sectionName,
        oldFileName,
        `${oldFileName}_qr.pdf`
      );

      console.log("Chemin de l'ancien PDF :", oldPdfPath); // Debugging pour vérifier le chemin

      if (fs.existsSync(oldPdfPath)) {
        try {
          fs.unlinkSync(oldPdfPath); // Supprimer l'ancien PDF
          console.log("Ancien PDF supprimé avec succès.");
        } catch (unlinkErr) {
          console.error(
            "Erreur lors de la suppression de l'ancien PDF :",
            unlinkErr
          );
          return res
            .status(500)
            .json({ error: "Erreur lors de la suppression de l'ancien PDF." });
        }
      } else {
        console.log("L'ancien PDF n'existe pas à ce chemin.");
      }

      // Renommer le dossier une fois le PDF supprimé
      if (fs.existsSync(oldFolderPath)) {
        try {
          fs.renameSync(oldFolderPath, newFolderPath);
          console.log("Dossier renommé avec succès.");
        } catch (renameErr) {
          return res
            .status(500)
            .json({ error: "Erreur lors du renommage du dossier." });
        }
      }
    }

    // Si un nouveau fichier est fourni, supprimer l'ancien fichier et enregistrer le nouveau
    if (newFile) {
      if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath, { recursive: true });
      }

      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath); // Supprimer l'ancien fichier
        } catch (unlinkErr) {
          return res.status(500).json({
            error: "Erreur lors de la suppression de l'ancien fichier.",
          });
        }
      }

      try {
        fs.renameSync(newFile.path, newFilePath); // Déplacer le nouveau fichier
      } catch (fileRenameErr) {
        return res
          .status(500)
          .json({ error: "Erreur lors du déplacement du fichier uploadé." });
      }
    }

    // Mise à jour du chemin relatif pour la base de données
    const newFileRelativePath = path.win32
      .relative(path.win32.join(__dirname, "..", "uploads"), newFilePath)
      .replace(/\//g, "\\"); // Remplacer les slashes par des backslashes pour le chemin Windows

    const serverIP = process.env.SERVER_IP_EXPRESS || getLocalIPv4();
    const fileUrl = `http://${serverIP}:6301/uploads/${newFileRelativePath.replace(
      /\\/g,
      "/"
    )}`;

    // Définir le chemin du nouveau PDF
    const pdfPath = path.win32.join(
      __dirname,
      "..",
      "uploads",
      projectName,
      sectionName,
      fileName,
      `${fileName}_qr.pdf`
    );

    // Appeler la fonction pour générer le PDF et QR code
    await generatePdfAndQrCode(
      fileUrl,
      pdfPath,
      fileName,
      projectName,
      sectionName,
      tags
    );

    // Remplacer les slashes par des backslashes pour le PDF path
    const pdfRelativePath = path.win32
      .relative(path.win32.join(__dirname, ".."), pdfPath)
      .replace(/\//g, "\\"); // Remplacer les slashes par des backslashes pour le chemin Windows

    await db
      .promise()
      .query(
        "UPDATE file SET name = ?, path_file = ?, url_qr_code = ?, path_pdf = ? WHERE id = ?",
        [
          fileName,
          `uploads\\${newFileRelativePath}`, // Utilisation des backslashes pour path_file
          fileUrl,
          pdfRelativePath, // Utilisation des backslashes pour path_pdf
          fileId,
        ]
      );

    // Gestion des tags
    if (tags && tags.length > 0) {
      const tagNames = Array.isArray(tags) ? tags : [tags];

      // Récupérer les tags existants pour ce fichier
      const [existingTags] = await db
        .promise()
        .query("SELECT tag_name FROM tag WHERE file_id = ?", [fileId]);
      const existingTagNames = existingTags.map((tag) => tag.tag_name);

      // Ajouter les nouveaux tags et ignorer les doublons
      for (const tagName of tagNames) {
        if (!existingTagNames.includes(tagName)) {
          await db
            .promise()
            .query("INSERT INTO tag (file_id, tag_name) VALUES (?, ?)", [
              fileId,
              tagName,
            ]);
        }
      }

      // Supprimer les tags qui ne sont plus présents
      for (const existingTagName of existingTagNames) {
        if (!tagNames.includes(existingTagName)) {
          await db
            .promise()
            .query("DELETE FROM tag WHERE file_id = ? AND tag_name = ?", [
              fileId,
              existingTagName,
            ]);
        }
      }
    } else {
      // Si aucun tag n'est envoyé, supprimer tous les tags existants
      await db.promise().query("DELETE FROM tag WHERE file_id = ?", [fileId]);
    }

    res.status(200).json({ message: "Fichier mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du fichier :", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour du fichier." });
  }
});

module.exports = router;
