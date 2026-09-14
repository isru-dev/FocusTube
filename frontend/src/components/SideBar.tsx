import { Link } from "react-router-dom";

export function SideBar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-800 text-white">
      <div className="p-4 text-lg font-bold">FOCUSTUBE</div>

      <nav className="p-4 cursor-pointer flex flex-col ">
        <Link to="/Feed" className="hover:text-gray-300 ">
          Feed
        </Link>
        <Link to="/AddChannel" className="hover:text-gray-300 ">
          Add a channel
        </Link>
      </nav>
    </aside>
  );
}