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

    const pdfRelativePath = pdfPath.replace(path.join(__dirname, ".."), "");
    await db
      .promise()
      .query("UPDATE file SET url_qr_code = ?, path_pdf = ? WHERE id = ?", [
        fileUrl,
        pdfRelativePath.replace(/\\/g, "/"),
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
  const { projectName, fileName } = req.query;

  try {
    const [sections] = await db.promise().query(
      `
                    SELECT section.id 
                    FROM section 
                    JOIN project ON section.project_id = project.id 
                    WHERE project.project_name = ?;
                    `,
      [projectName]
    );

    if (sections.length === 0) {
      return res
        .status(400)
        .json({ error: "Aucune section trouvée pour ce projet." });
    }

    const sectionIds = sections.map((section) => section.id);

    const [fileResults] = await db.promise().query(
      `
                    SELECT * FROM file 
                    WHERE section_id IN (${sectionIds
                      .map(() => "?")
                      .join(",")}) 
                    AND name = ?;
                    `,
      [...sectionIds, fileName]
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

module.exports = router;
