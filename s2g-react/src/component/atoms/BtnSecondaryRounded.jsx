export function BtnSecondaryRounded(props) {
  return (
    <button className=" hover:bg-green-500 hover:text-white hover:shadow-md border-2 border-green-500 rounded px-2.5 py-1.5 text-dark">
      {props.name}
    </button>
  );
}
