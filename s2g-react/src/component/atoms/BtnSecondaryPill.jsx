export function BtnSecondaryPill(props) {
  return (
    <button className=" hover:bg-red-500 hover:text-white hover:shadow-md border-2 border-red-500 rounded-full px-2.5 py-1.5 text-dark">
      {props.name}
    </button>
  );
}
