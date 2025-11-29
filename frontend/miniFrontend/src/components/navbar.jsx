import vista from "../assets/vista.png";
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full px-2 flex items-center bg-transparent z-50">
      <img src={vista} alt="Logo" className="h-20 cursor-pointer" />
    </nav>
  );
}

export default Navbar;
