export function ModalInputSection(props) {
  return (
    <div className="mt-3">
      <input
        className="block w-full rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        type="text"
        id={props.for}
        name={props.for}
        placeholder={props.placeholder}
      />
    </div>
  );
}
