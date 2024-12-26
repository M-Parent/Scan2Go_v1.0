export function ModalTitle({ onClose, title }) {
  return (
    <div className="flex justify-between border-b px-4 py-3">
      <p className="font-bungee">{title}</p>
      <button onClick={() => onClose()}>
        <img src="../img/icon/x-lg.svg" alt="X icon" />
      </button>
    </div>
  );
}
