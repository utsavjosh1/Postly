import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
