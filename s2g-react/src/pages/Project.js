import { ModalAddSection } from "../component/molecules/modal/ModalAddSection";
import { ModalAddFile } from "../component/molecules/modal/ModalAddFile";
import { ModalEditSection } from "../component/molecules/modal/ModalEditSection";
import { ModalEditProject } from "../component/molecules/modal/ModalEditProject";
import { Modal } from "../component/molecules/modal/Modal";
import { useState, useEffect, useRef } from "react";
import { AddGlass } from "../component/molecules/glass/AddGlass";
import { SearchBarGlass } from "../component/molecules/glass/SearchBarGlass";
import { useParams, useNavigate } from "react-router-dom"; // Import useParams and useNavigate
import API_BASE_URL from "../api"; // Import your API URL

export function Project() {
  const { projectId } = useParams(); // Get project ID from URL
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const dropdownRef = useRef(null); // Ref for the dropdown container
  const dropdownRef2 = useRef({}); // Ref pour le deuxième dropdown

  const [projectToEdit, setProjectToEdit] = useState(null); // State for project to edit

  const [sections, setSections] = useState([]); // Store sections data
  const [sectionCollapse, setSectionCollapse] = useState({}); // Store collapse state for each section
  const [sectionCount, setSectionCount] = useState(0);

  const [showModalAddSection, setShowModalAddSection] = useState(false);
  const [showModalAddFile, setShowModalAddFile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState({});
  const [showModalEditProject, setShowModalEditProject] = useState(false);
  const [showModalEditSection, setShowModalEditSection] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState(null);

  const handleEditSection = (section) => {
    setSectionToEdit(section);
    setShowModalEditSection(true);
    setShowDropdown2((prevState) => ({
      ...prevState,
      [section.id]: false, // Close the dropdown for this section
    }));
  };

  const handleButtonClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleButtonClick2 = (sectionId) => {
    setShowDropdown2((prevState) => ({
      ...prevState,
      [sectionId]: !prevState[sectionId],
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef2.current) {
        // Check if dropdownRef2.current exists!
        Object.keys(showDropdown2).forEach((sectionId) => {
          const dropdownElement = dropdownRef2.current[sectionId];

          if (
            showDropdown2[sectionId] &&
            dropdownElement &&
            dropdownElement.contains(event.target)
          ) {
            return;
          }

          if (
            showDropdown2[sectionId] &&
            dropdownElement &&
            !dropdownElement.contains(event.target)
          ) {
            setShowDropdown2((prevState) => ({
              ...prevState,
              [sectionId]: false,
            }));
          }
        });
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown2]);

  const handleCloseModals = () => {
    setShowDropdown(false);
    setShowDropdown2(false);
    setShowModalEditProject(false);
    setShowModalAddSection(false);
    setShowModalAddFile(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown, showDropdown2]); // Add showDropdown to the dependency array

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects/${projectId}`
        );
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        } else {
          setError("Failed to fetch project.");
          console.error("Error fetching project:", response.status);
        }
      } catch (error) {
        setError("A network error occurred.");
        console.error("Connection error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]); // Fetch project on projectId change

  const handleEditProject = () => {
    setProjectToEdit(project); // Set the project to edit in state
    setShowModalEditProject(true);
    setShowDropdown(false); // Close the dropdown
  };

  useEffect(() => {
    const fetchSections = async () => {
      if (projectId) {
        // Only fetch if projectId is available
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/sections/${projectId}`
          );
          if (response.ok) {
            const data = await response.json();
            setSections(data);
            setSectionCount(data.length);
            // Initialize collapse state for each section
            const initialCollapse = {};
            data.forEach((section) => {
              initialCollapse[section.id] = false; // Initially collapsed
            });
            setSectionCollapse(initialCollapse);
          } else {
            console.error("Error fetching sections:", response.status);
            setError("Failed to fetch sections.");
          }
        } catch (error) {
          console.error("Connection error:", error);
          setError("A network error occurred.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSections();
  }, [projectId]);

  const handleSectionCollapse = (sectionId) => {
    setSectionCollapse((prevState) => ({
      ...prevState,
      [sectionId]: !prevState[sectionId], // Toggle collapse state
    }));
  };

  const handleProjectUpdated = async (updatedProject) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${updatedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedProject),
        }
      );

      if (response.ok) {
        setProject(updatedProject); // Update the project in the state
        setShowModalEditProject(false);
      } else {
        console.error("Error updating project:", response.status);
        const errorData = await response.json();
        alert(errorData.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("A network error occurred while updating the project.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  const handleBackClick = () => {
    navigate("/"); // Navigate back to Home
  };

  const handleDeleteProject = async (projectId) => {
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce projet ?"
    );
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          console.log("Projet supprimé avec succès");
          navigate("/"); // Redirigez vers la page d'accueil
        } else {
          console.error(
            "Erreur lors de la suppression du projet:",
            response.status
          );
          const errorData = await response.json();
          alert(errorData.error || "Échec de la suppression du projet");
        }
      } catch (error) {
        console.error("Erreur de connexion:", error);
        alert(
          "Une erreur réseau s'est produite lors de la suppression du projet."
        );
      }
    }
  };

  const handleDeleteSection = async (sectionId) => {
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cette section ?"
    );

    if (confirmDelete) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/sections/${sectionId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          console.log("Section deleted successfully");

          // 1. Filter the sections array:
          const updatedSections = sections.filter(
            (section) => section.id !== sectionId
          );

          // 2. Update BOTH sections and sectionCount:
          setSections(updatedSections);
          setSectionCount(updatedSections.length); // Crucial update!

          setShowDropdown2((prevState) => ({
            ...prevState,
            [sectionId]: false, // Close the dropdown for this section
          }));
        } else {
          console.error("Error deleting section:", response.status);
          const errorData = await response.json();
          alert(errorData.error || "Failed to delete section");
        }
      } catch (error) {
        console.error("Connection error:", error);
        alert("A network error occurred while deleting the section.");
      }
    }
  };

  return (
    <>
      {/* Nav back home + Title project */}
      <div className="flex p-6">
        <div className="me-auto">
          <button onClick={handleBackClick}>
            {" "}
            {/* Use a button for navigation */}
            <img
              className="Glassmorphgisme p-2"
              src="../img/Logo1picPNGZoom.png"
              width={48}
              alt="Logo Scan2Go"
            />
          </button>
        </div>
        <div className="flex me-auto pe-12 items-center">
          <p className="font-bungee text-4xl text-white">
            {project.project_name}
          </p>
        </div>
      </div>
      {/* Header */}

      <div className="md:flex justify-center border-b-white/40 border-b pb-5 lg:mx-48 mx-12">
        <div className="flex justify-center pb-5 md:pb-0">
          <img
            className="rounded-3xl md:w-56"
            src={`${API_BASE_URL}/${project.project_image}`}
            alt={project.project_name}
          />
        </div>
        <div className="flex flex-col justify-around text-white w-full ps-5">
          <div className="flex">
            <p className="me-auto">
              Total Section:{" "}
              <span className="font-bold ms-2">{sectionCount}</span>
            </p>
            <div className="relative">
              <button onClick={handleButtonClick}>
                <img
                  src="../img/icon/three-dots-vertical.svg"
                  alt="dots details icon"
                  onClick={(event) => {
                    // Add onClick to the image
                    event.stopPropagation(); // Stop event bubbling
                    handleButtonClick(); // Call your existing handler
                  }}
                />
              </button>
              {showDropdown && (
                <div
                  className="absolute top-7 right-3 Glassmorphgisme-noHover z-0 w-32"
                  ref={dropdownRef}
                >
                  <ul className="px-2 py-1 divide-y">
                    <div className="py-1 ">
                      <li
                        onClick={handleEditProject} // Call handleEditProject
                        className="cursor-pointer px-1.5 py-0.5 hover:bg-black/30 rounded-lg text-sm/6 "
                      >
                        Edit
                      </li>
                    </div>
                    <div className="py-1">
                      <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6">
                        Export File
                      </li>
                    </div>
                    <div className="py-1">
                      <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6">
                        Export QR code
                      </li>
                    </div>
                    <div className="py-1">
                      <li
                        onClick={() => handleDeleteProject(project.id)}
                        className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6 text-red-500"
                      >
                        Delete
                      </li>
                    </div>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="pb-2.5 ">
            Total Uploaded File: <span className="font-bold ms-2">5</span>
          </div>
          <div>
            Total Space use: <span className="font-bold ms-2">30 Mb</span>
          </div>
        </div>
      </div>
      {sections === 0 ? (
        <>
          {/* Search bar */}
          <div className="my-8">
            <SearchBarGlass />
          </div>
          {/* AddGlass default view */}
          <div className="flex justify-center mt-16 lg:mt-48 md:mt-32">
            <button
              className="transition hover:translate-y-1 hover:duration-700 hover:ease-in-out"
              onClick={() => setShowModalAddSection(true)}
            >
              <AddGlass />
            </button>
          </div>
          <Modal isVisible={showModalAddSection}>
            <ModalAddSection
              projectId={projectId}
              onCloseModalAddSection={handleCloseModals}
            />
          </Modal>

          {/* Modal Edit */}
          <Modal isVisible={showModalEditProject}>
            {projectToEdit && ( // Conditionally render the modal
              <ModalEditProject
                project={projectToEdit}
                onCloseModalEditProject={handleCloseModals}
                onProjectUpdated={handleProjectUpdated} // Pass the update handler
              />
            )}
          </Modal>
        </>
      ) : (
        <>
          {/* Search + Add */}
          <div className="lg:mx-48 mx-12 text-white sm:flex my-8">
            <div className="md:ms-auto ms-0 md:ps-24 ">
              <SearchBarGlass />
            </div>
            <div className="sm:ms-auto flex justify-center mt-5 sm:mt-0">
              <div>
                <button
                  onClick={() => setShowModalAddSection(true)}
                  className="flex Glassmorphgisme px-3 py-1.5 font-bungee me-auto"
                >
                  <img
                    src="../img/icon/plus-circle.svg"
                    alt="Plus icon"
                    width={24}
                  />
                  <div className="flex items-center ms-1.5">Add</div>
                </button>
              </div>
            </div>
          </div>
          {/* Section */}
          <div className="overflow-auto h-[450px] me-40 scrollbar-custom mt-10">
            {sections.map((section) => (
              <div
                className="relative lg:ms-52 lg:me-6 mx-12 text-white my-16 "
                key={section.id}
              >
                <div>
                  <div
                    className={`pb-3 duration-100 ${
                      sectionCollapse[section.id]
                    }`}
                  >
                    <button
                      className={`absolute top-[8px] left-[-24px] transition-transform duration-300 ${
                        sectionCollapse[section.id]
                          ? "rotate-0"
                          : "rotate-[-90deg]"
                      } `}
                      onClick={() => handleSectionCollapse(section.id)}
                    >
                      <img
                        src="../img//icon/chevron-down.svg"
                        alt="Chevron-down icon"
                        width={16}
                      />
                    </button>
                    <div className="flex justify-between">
                      <p className="text-2xl">{section.section_name} :</p>
                      <div className="flex ">
                        <div>
                          <button
                            className="Glassmorphgisme py-1.5 px-3"
                            onClick={() => setShowModalAddFile(true)}
                          >
                            <img
                              src="../img/icon/upload.svg"
                              alt="Logo upload file"
                              width={20}
                            />
                          </button>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => handleButtonClick2(section.id)}
                          >
                            <img
                              className="ps-3.5"
                              src="../img/icon/three-dots-vertical.svg"
                              alt="dots details icon"
                              onClick={(event) => {
                                // Add onClick to the image
                                event.stopPropagation(); // Stop event bubbling
                                handleButtonClick2(section.id); // Call your existing handler
                              }}
                            />
                          </button>
                          {showDropdown2[section.id] && (
                            <div
                              className="absolute top-7 right-3 Glassmorphgisme-noHover z-10 w-32"
                              ref={(el) =>
                                (dropdownRef2.current[section.id] = el)
                              }
                            >
                              <ul className="px-2 py-1 divide-y">
                                <div className="py-1 ">
                                  <li
                                    onClick={() => handleEditSection(section)}
                                    className="cursor-pointer px-1.5 py-0.5 hover:bg-black/30 rounded-lg text-sm/6 "
                                  >
                                    Edit
                                  </li>
                                </div>
                                <div className="py-1">
                                  <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6">
                                    Export File
                                  </li>
                                </div>
                                <div className="py-1">
                                  <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6">
                                    Export QR code
                                  </li>
                                </div>
                                <div className="py-1">
                                  <li
                                    onClick={() =>
                                      handleDeleteSection(section.id)
                                    }
                                    className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6 text-red-500"
                                  >
                                    Delete
                                  </li>
                                </div>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* table section */}
                  <div
                    className={`mt-1.5 mx-1 sm:me-12  transition-all  duration-300 ease-in-out  ${
                      sectionCollapse[section.id]
                        ? "translate-y-auto opacity-100 " // When collapsed, translate 0 and show
                        : "translate-y-[-20px] opacity-0 " // When not collapsed, translate -20px and hide
                    }`}
                  >
                    <div
                      className={`mx-1 sm:mx-5 relative w-full ${
                        sectionCollapse[section.id] ? "" : " hidden"
                      }`}
                    >
                      <div className=" overflow-x-auto">
                        <table className=" w-full ">
                          <thead className="text-xs uppercase border-b">
                            <tr>
                              <td className="px-6 py-3">Name</td>
                              <th scope="col" className="px-6 py-3 text-nowrap">
                                QR Code
                              </th>
                              <th scope="col" className="px-6 py-3">
                                Share
                              </th>
                              <th scope="col" className="px-6 py-3">
                                Tag
                              </th>
                              <th
                                scope="col"
                                className="flex justify-end pe-4 sm:pe-12 py-3"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:border hover:bg-white/20 duration-300 transition ease-in-out">
                              <td className="px-6 py-4 text-lg text-nowrap">
                                File Name
                              </td>
                              <th className="px-6 py-4">
                                <button>
                                  <img
                                    src="../img/icon/qr-code-scan.svg"
                                    alt="Qr Code File"
                                    width={24}
                                  />
                                </button>
                              </th>
                              <th className="px-6 py-4">
                                <button>
                                  <img
                                    src="../img/icon/share.svg"
                                    alt="Share File"
                                    width={24}
                                  />
                                </button>
                              </th>
                              <th className="sm:flex sm:justify-center py-4">
                                <div>
                                  <span className="Glassmorphgisme-noHover text-xs px-2 py-0.5 me-1.5">
                                    QGET
                                  </span>
                                </div>
                                <div>
                                  <span className="Glassmorphgisme-noHover text-xs px-2 me-1.5 py-0.5 text-nowrap">
                                    Comd Team
                                  </span>
                                </div>
                                <div>
                                  <span className="Glassmorphgisme-noHover text-xs px-2 py-0.5 text-nowrap">
                                    G6
                                  </span>
                                </div>
                              </th>
                              <th className="px-1 sm:px-6 sm:py-4">
                                <div className="flex justify-end ">
                                  <button>
                                    <img
                                      className="me-2"
                                      src="../img/icon/file-arrow-down.svg"
                                      alt="Download File"
                                      width={24}
                                    />
                                  </button>
                                  <button>
                                    <img
                                      className="me-2"
                                      src="../img/icon/pencil-square.svg"
                                      alt="Edit File"
                                      width={24}
                                    />
                                  </button>
                                  <button>
                                    <img
                                      src="../img/icon/trash.svg"
                                      alt="Delete File"
                                      width={24}
                                    />
                                  </button>
                                </div>
                              </th>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal */}
          <Modal isVisible={showModalAddSection}>
            <ModalAddSection
              projectId={projectId}
              onCloseModalAddSection={handleCloseModals}
            />
          </Modal>
          {/* Modal Add File */}
          <Modal isVisible={showModalAddFile}>
            <ModalAddFile onCloseModalAddFile={handleCloseModals} />
          </Modal>
          <Modal isVisible={showModalEditSection}>
            {sectionToEdit && (
              <ModalEditSection
                section={sectionToEdit} // Pass the section to edit
                onCloseModalEditSection={() => setShowModalEditSection(false)}
                // Add a prop for handling section updates, similar to handleProjectUpdated
                onSectionUpdated={(updatedSection) => {
                  // Implement logic to update the section in the sections state
                  const updatedSections = sections.map((s) =>
                    s.id === updatedSection.id ? updatedSection : s
                  );
                  setSections(updatedSections);
                  setShowModalEditSection(false);
                }}
              />
            )}
          </Modal>
          {/* Modal Edit */}
          <Modal isVisible={showModalEditProject}>
            {projectToEdit && ( // Conditionally render the modal
              <ModalEditProject
                project={projectToEdit}
                onCloseModalEditProject={handleCloseModals}
                onProjectUpdated={handleProjectUpdated} // Pass the update handler
              />
            )}
          </Modal>
        </>
      )}
    </>
  );
}
