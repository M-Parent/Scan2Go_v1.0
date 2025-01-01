import { ModalInputText } from "./ModalInputText";
import { ModalInputFile } from "./ModalInputFile";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";

export function ModalAddProject({ onCloseModal, onCloseModal2 }) {
  return (
    <form>
      {/* Title */}
      <ModalTitle
        title="ADD PROJECT"
        onClose={() => {
          if (onCloseModal) {
            onCloseModal();
          } else if (onCloseModal2) {
            onCloseModal2();
          }
        }}
      />
      <div className="pt-7 md:px-14 px-7">
        <ModalInputText
          label="Project Name:"
          for="Project-name"
          placeholder="Server, Network..."
        />
        <ModalInputFile label="Project Image:" for="Project-image" />
      </div>
      {/* Footer */}
      <ModalFooter
        name="ADD"
        onClose={() => {
          if (onCloseModal) {
            onCloseModal();
          } else if (onCloseModal2) {
            onCloseModal2();
          }
        }}
      />
    </form>
  );
}
