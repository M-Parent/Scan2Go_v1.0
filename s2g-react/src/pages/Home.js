import { AddGlass } from "../component/molecules/glass/AddGlass";
import { LogoGlass } from "../component/molecules/glass/LogoGlass";
import { ProjectGlass } from "../component/molecules/glass/ProjectGlass";
import { Fragment, useState } from "react";
import { Modal } from "../component/molecules/modal/Modal";
import { ModalFooter } from "../component/molecules/modal/ModalFooter";
import { ModalTitle } from "../component/molecules/modal/ModalTitle";
import { ModalInput } from "../component/molecules/modal/ModalInput";

export function Home() {
  const project = 0;
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Fragment>
        <LogoGlass alt="Logo of Scan2Go" />
        {project === 0 ? (
          <>
            <div className="flex justify-center mt-20">
              <button
                className="transition hover:translate-y-1 hover:duration-700 hover:ease-in-out"
                onClick={() => setShowModal(true)}
              >
                <AddGlass />
              </button>
            </div>
            <Modal isVisible={showModal}>
              {/* Title */}
              <ModalTitle
                title="ADD PROJECT"
                onClose={() => setShowModal(false)}
              />
              {/* Body */}
              <form>
                <div className="pt-7 px-14">
                  <ModalInput
                    label="Project Name:"
                    for="Project-name"
                    type="text"
                    placeholder="Server, Network..."
                  />
                  <ModalInput
                    label="Project Image:"
                    for="Project-image"
                    type="file"
                    placeholder="Extention: .jpg, .png, .svg"
                  />
                </div>
                {/* Footer */}
                <ModalFooter onClose={() => setShowModal(false)} />
              </form>
            </Modal>
          </>
        ) : (
          <>
            <div className="">
              <ProjectGlass />
              <div className="flex justify-center">
                <div className="">
                  <div className="fixed">
                    <button>
                      <AddGlass />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Fragment>
    </>
  );
}
