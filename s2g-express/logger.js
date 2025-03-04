const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
  level: "info", // Niveau de log par défaut (info, error, warn, debug, etc.)
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "server.log"), // Chemin du fichier de log
    }),
  ],
});

// Si vous êtes en environnement de développement, affichez également les logs dans la console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
