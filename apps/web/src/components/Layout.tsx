import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-200 ">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
