import { ModalInputText } from "./ModalInputText";
import { ModalInputFile } from "./ModalInputFile";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";

export function ModalEditProject({ onCloseModalEditProject }) {
  return (
    <form>
      {/* Title */}
      <ModalTitle
        title="EDIT PROJECT"
        onClose={() => onCloseModalEditProject()}
      />
      {/* Body */}
      <div className="pt-7 md:px-14 px-7">
        <ModalInputText
          label="Project Name:"
          for="Project-name"
          placeholder="Server, Network..."
        />
        <ModalInputFile label="Project Image:" for="Project-image" />
      </div>
      <ModalFooter name="Save" onClose={() => onCloseModalEditProject()} />
    </form>
  );
}
