import { BtnPrimaryRounded } from "../../atoms/BtnPrimaryRounded";

export function ModalFooter({ onClose, name }) {
  return (
    <div className="flex justify-end p-4 mt-8">
      <button className="me-4 hover:opacity-70" onClick={() => onClose()}>
        Cancel
      </button>
      <BtnPrimaryRounded name={name} />
    </div>
  );
}
