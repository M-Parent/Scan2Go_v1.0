export function BtnSecondary(props) {
  return (
    <button className=" hover:bg-sky-500 hover:text-white hover:shadow-md border-2 border-sky-500 px-2.5 py-1.5 text-dark">
      {props.name}
    </button>
  );
}
