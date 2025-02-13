import { AddGlass } from "../component/molecules/glass/AddGlass";
import { LogoGlass } from "../component/molecules/glass/LogoGlass";
import { ProjectGlass } from "../component/molecules/glass/ProjectGlass";
import { useState, useEffect } from "react";
import { Modal } from "../component/molecules/modal/Modal";
import { ModalAddProject } from "../component/molecules/modal/ModalAddProject";
import { ModalEditProject } from "../component/molecules/modal/ModalEditProject";
import { CardProject } from "../component/molecules/CardProject";

export function Home() {
  const [projects, setProjects] = useState([]);
  const [showModalAddProject, setShowModalAddProject] = useState(false);
  const [showModalEditProject, setShowModalEditProject] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error("Error fetching projects:", response.status);
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []); // Fetch projects on mount

  const handleProjectAdded = (newProject) => {
    setProjects([...projects, newProject]); // Update state with the new project
    setShowModalAddProject(false); // Close the modal after adding
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the project from the state
        setProjects(projects.filter((project) => project.id !== projectId));
        console.log("Project deleted successfully");
      } else {
        console.error("Error deleting project:", response.status);
        const errorData = await response.json(); // Try to parse error response
        alert(errorData.error || "Failed to delete project"); // Show an alert with the error message
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("A network error occurred while deleting the project."); // Show an alert for network errors
    }
  };

  return (
    <>
      <LogoGlass alt="Logo of Scan2Go" />

      {projects.length > 0 && ( // Afficher ProjectGlass seulement s'il y a des projets
        <ProjectGlass projects={projects}>
          <div className="lg:flex lg:justify-around justify-center py-6 overflow-auto h-full scrollbar-custom">
            <div className="grid justify-center items-center xl:grid-cols-3 md:gap-12 gap-8">
              <button
                className="rounded-3xl"
                onClick={() => setShowModalAddProject(true)}
              >
                <AddGlass />
              </button>
              {projects.map((project) => (
                <a href="/Project" key={project.id}>
                  <CardProject
                    key={project.id}
                    href="Project"
                    projectName={project.project_name}
                    projectImage={`/${project.project_image}`}
                    onEditClick={() => setShowModalEditProject(true)}
                    onDelete={() => handleDeleteProject(project.id)} // Pass onDelete callback
                  />
                </a>
              ))}
            </div>
          </div>
        </ProjectGlass>
      )}

      {projects.length === 0 && ( // Afficher le bouton AddGlass si aucun projet
        <div className="flex justify-center mt-32">
          <button
            className="transition hover:translate-y-1 hover:duration-700 hover:ease-in-out"
            onClick={() => setShowModalAddProject(true)}
          >
            <AddGlass />
          </button>
        </div>
      )}

      <Modal isVisible={showModalAddProject}>
        <ModalAddProject
          onCloseModal={() => setShowModalAddProject(false)}
          onProjectAdded={handleProjectAdded}
        />
      </Modal>
      <Modal isVisible={showModalEditProject}>
        <ModalEditProject
          onCloseModalEditProject={() => setShowModalEditProject(false)}
        />
      </Modal>
    </>
  );
}
