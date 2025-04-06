import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isTeacher = user.role === "teacher";
  const initialLetters = user.displayName
    .split(" ")
    .map(name => name[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  const NavItem = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div
          className={cn(
            "group flex items-center px-2 py-2 text-base font-medium rounded-md cursor-pointer",
            isActive
              ? "bg-gray-900 text-white"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          )}
        >
          <i className={`${icon} mr-3 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}></i>
          {label}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-gray-800 text-white z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center border-b border-gray-700">
          <i className="fas fa-graduation-cap text-indigo-400 text-2xl mr-3"></i>
          <h1 className="text-xl font-bold">EduAudio</h1>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg font-semibold">
              <span>{initialLetters}</span>
            </div>
            <div className="ml-3">
              <p className="font-medium">{user.displayName}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {/* Common navigation */}
            <NavItem href="/" icon="fas fa-home" label="Dashboard" />

            {isTeacher ? (
              <>
                <NavItem href="/record-lecture" icon="fas fa-microphone" label="Record Lecture" />
                <NavItem href="/lectures" icon="fas fa-book" label="My Lectures" />
                <NavItem href="/students" icon="fas fa-users" label="Students" />
                <NavItem href="/analytics" icon="fas fa-chart-bar" label="Analytics" />
              </>
            ) : (
              <>
                <NavItem href="/lectures" icon="fas fa-book" label="Lectures" />
                <NavItem href="/progress" icon="fas fa-tasks" label="My Progress" />
                <NavItem href="/notes" icon="fas fa-sticky-note" label="Notes" />
                <NavItem href="/calendar" icon="fas fa-calendar-alt" label="Calendar" />
                <NavItem href="/tasks" icon="fas fa-check-square" label="Tasks" />
              </>
            )}

            <div className="pt-4 mt-4 border-t border-gray-700">
              <NavItem href="/settings" icon="fas fa-cog" label="Settings" />
              <a
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
              >
                <i className="fas fa-sign-out-alt mr-3 text-gray-400"></i>
                Logout
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
