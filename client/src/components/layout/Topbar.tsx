import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface TopbarProps {
  toggleSidebar: () => void;
}

const Topbar = ({ toggleSidebar }: TopbarProps) => {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  // Get page title from location
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/record-lecture":
        return "Record Lecture";
      case "/lectures":
        return "Lectures";
      case "/students":
        return "Students";
      case "/analytics":
        return "Analytics";
      case "/progress":
        return "My Progress";
      case "/notes":
        return "Notes";
      case "/settings":
        return "Settings";
      default:
        if (location.startsWith("/lectures/")) {
          return "Lecture Details";
        }
        return "EduAudio";
    }
  };

  const initialLetters = user.displayName
    .split(" ")
    .map(name => name[0])
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={toggleSidebar}
        >
          <i className="fas fa-bars text-xl"></i>
        </button>

        {/* Page title */}
        <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>

        {/* Right side buttons */}
        <div className="flex items-center space-x-4">
          <button type="button" className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-bell"></i>
          </button>
          <button type="button" className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-question-circle"></i>
          </button>
          {/* Profile dropdown (mobile only) */}
          <div className="relative md:hidden">
            <button
              type="button"
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                <span>{initialLetters}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
