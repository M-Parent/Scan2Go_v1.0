import { NavLink } from "react-router-dom";

export function Nav() {
  return (
    <nav className="flex justify-center space-x-4 p-4">
      <LinkNav href="/" name="Home" />
      <LinkNav href="/Atoms" name="Test" />
      <LinkNav href="/Molecules" name="Molecules" />
      <LinkNav href="/Organisms" name="Organisms" />
    </nav>
  );
}

function LinkNav(props) {
  return (
    <NavLink
      to={props.href}
      className={({ isActive }) => {
        return (
          "font-bold px-3 py-2  text-slate-700 rounded-lg " +
          (isActive
            ? "bg-slate-200 text-slate-950"
            : "hover:bg-slate-200 hover:text-slate-950 ")
        );
      }}
    >
      {props.name}
    </NavLink>
  );
}
