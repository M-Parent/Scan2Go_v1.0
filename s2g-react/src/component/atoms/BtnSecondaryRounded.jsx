export function BtnSecondaryRounded(props) {
  return (
    <button className=" hover:bg-green-500 hover:shadow-md border-2 rounded-2xl px-2.5 py-1.5">
      {props.name}
    </button>
  );
}
