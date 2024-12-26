import Modal from "../../organisms/Modal";
import { ModalTitle } from "../modal/ModalTitle";
import { ModalFooter } from "../modal/ModalFooter";
import { ModalInput } from "../modal/ModalInput";
import { useState } from "react";

const ModalAddProject = () => {
  return (
    <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
      <ModalTitle />
      {/* Body */}
      <form className="">
        <div className="flex justify-center mt-10">
          <ModalInput label="Project Name:" type="text" />
        </div>
        <ModalFooter />
      </form>
    </Modal>
  );
};
export default ModalAddProject;
