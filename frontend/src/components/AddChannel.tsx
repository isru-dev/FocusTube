import { useState } from "react";
import { SideBar } from "./sidebar";

export function AddChannel() {
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  function handleUrl(e: React.FormEvent) {
    e.preventDefault();
    // Add your logic to handle adding by URL here
    console.log("Adding channel by URL:", url);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Add your logic to handle searching/adding by name here
    console.log("Searching channel by name:", searchQuery);
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content Area */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 max-w-6xl py-6 space-y-6">
        <div className="flex flex-col justify-center border p-4 bg-white rounded shadow-sm">
          <h1 className="text-lg font-semibold mb-2">ADD by name</h1>
          <form className="flex gap-2" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Channel name..."
              className="border px-3 py-1 rounded flex-1"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
              Search
            </button>
          </form>
        </div>

        <div className="border p-4 bg-white rounded shadow-sm">
          <h1 className="text-lg font-semibold mb-2">ADD by url</h1>
          <form className="flex flex-col gap-2" onSubmit={handleUrl}>
            <div>
              <label className="block text-sm font-medium mb-1">enter url</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="youtube.com/@mkbhd"
                className="border px-3 py-1 rounded w-full"
              />
            </div>
            <button type="submit" className="bg-green-500 text-white px-4 py-1 rounded self-start mt-2">
              Add URL
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}