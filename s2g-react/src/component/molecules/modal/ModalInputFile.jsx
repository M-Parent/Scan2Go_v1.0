export function ModalInputFile(props) {
  return (
    <div className="mt-3">
      <label className="block" for={props.for}>
        {props.label}
      </label>
      <div className="mt-2">
        <input
          className="block w-full rounded-xl bg-transparent  outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 file:px-2 file:py-1 file:bg-white/30 file:border-transparent file:text-white file: hover:file:bg-white/50 file:rounded-s-xl file:me-3"
          type="file"
          id={props.for}
          name={props.for}
        />
      </div>
    </div>
  );
}
