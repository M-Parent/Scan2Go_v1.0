import React, { useState } from "react";
import { ModalInputText } from "./ModalInputText";
import { ModalInputFile } from "./ModalInputFile";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";
import API_BASE_URL from "../../../api";

export function ModalAddProject({ onCloseModal, onProjectAdded }) {
  // Ajout de la prop onProjectAdded
  const [projectName, setProjectName] = useState("");
  const [projectImage, setProjectImage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!projectName) {
      setError("Le nom du projet est requis.");
      return;
    }

    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("projectImage", projectImage);

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Projet ajouté avec succès !");

        const newProject = await response.json(); // Récupérer le nouveau projet depuis la réponse

        if (onProjectAdded) {
          onProjectAdded(newProject); // Appeler la fonction de callback
        }

        if (onCloseModal) onCloseModal();

        setProjectName("");
        setProjectImage(null);
      } else {
        try {
          // Ajouter un bloc try...catch
          const errorData = await response.json();
          setError(errorData.error || "Erreur lors de l'ajout du projet.");
          console.error("Erreur lors de l'ajout du projet:", errorData);
        } catch (jsonError) {
          // Capturer l'erreur si la réponse n'est pas du JSON
          setError("Erreur lors de l'ajout du projet (erreur serveur)"); // Message d'erreur générique
          console.error(
            "Erreur lors de l'ajout du projet (erreur non JSON):",
            jsonError
          );
          console.error(
            "Réponse du serveur (non JSON):",
            await response.text()
          ); // Afficher le contenu de la réponse pour déboguer
        }
      }
    } catch (error) {
      setError("Erreur de connexion.");
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalTitle title="ADD PROJECT" onClose={onCloseModal} />
      <div className="pt-7 md:px-14 px-7">
        <ModalInputText
          label="Project Name:"
          for="projectName"
          placeholder="Server, Network..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <ModalInputFile
          label="Project Image:"
          for="projectImage"
          onChange={(file) => setProjectImage(file)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
      <ModalFooter name="ADD" onClick={handleSubmit} onClose={onCloseModal} />
    </form>
  );
}
