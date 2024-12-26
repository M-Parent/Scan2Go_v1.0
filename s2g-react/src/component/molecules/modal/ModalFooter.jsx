import { BtnPrimaryRounded } from "../../atoms/BtnPrimaryRounded";

export function ModalFooter({ onClose }) {
  return (
    <>
      <div className="flex justify-end p-4">
        <button className="me-4" onClick={() => onClose()}>
          Cancel
        </button>
        <BtnPrimaryRounded name="ADD" />
      </div>
    </>
  );
}
