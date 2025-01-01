import { AddGlass } from "../component/molecules/glass/AddGlass";
import { LogoGlass } from "../component/molecules/glass/LogoGlass";
import { ProjectGlass } from "../component/molecules/glass/ProjectGlass";
import { useState } from "react";
import { Modal } from "../component/molecules/modal/Modal";
import { ModalAddProject } from "../component/molecules/modal/ModalAddProject";
import { ModalEditProject } from "../component/molecules/modal/ModalEditProject";
import { CardProject } from "../component/molecules/CardProject";

export function Home() {
  const project = 1;
  const [showModalAddProject, setShowModalAddProject] = useState(false);
  const [showModalEditProject, setShowModalEditProject] = useState(false);

  return (
    <>
      <LogoGlass alt="Logo of Scan2Go" />
      {project === 0 ? (
        <>
          <div className="flex justify-center mt-32">
            <button
              className="transition hover:translate-y-1 hover:duration-700 hover:ease-in-out"
              onClick={() => setShowModalAddProject(true)}
            >
              <AddGlass />
            </button>
          </div>
          {/* Modal Add 1 */}
          <Modal isVisible={showModalAddProject}>
            <ModalAddProject
              onCloseModal={() => setShowModalAddProject(false)}
            />
          </Modal>
        </>
      ) : (
        <>
          <div>
            <ProjectGlass>
              <div className="lg:flex lg:justify-around justify-center py-6 overflow-auto h-full scrollbar-custom">
                <div className="grid justify-center xl:grid-cols-3 md:gap-12 gap-8  ">
                  <button
                    className="rounded-3xl"
                    onClick={() => setShowModalAddProject(true)}
                  >
                    <AddGlass />
                  </button>
                  <CardProject
                    href="Project"
                    onEditClick={() => setShowModalEditProject(true)}
                  />
                  <CardProject
                    href="Project"
                    onEditClick={() => setShowModalEditProject(true)}
                  />
                  <CardProject />
                  <CardProject />
                  <CardProject />
                  <CardProject />
                  <CardProject />
                </div>
              </div>
            </ProjectGlass>
          </div>
          {/* Modal Add 2 */}
          <Modal isVisible={showModalAddProject}>
            <ModalAddProject
              onCloseModal={() => setShowModalAddProject(false)}
            />
          </Modal>
          {/* Modal Edit */}
          <Modal isVisible={showModalEditProject}>
            <ModalEditProject
              onCloseModalEditProject={() => setShowModalEditProject(false)}
            />
          </Modal>
        </>
      )}
    </>
  );
}
