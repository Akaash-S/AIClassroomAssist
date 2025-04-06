import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

const QuickActions = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
      </div>
      <div className="p-6 space-y-4">
        {isTeacher ? (
          <>
            <Link href="/record-lecture">
              <a className="flex items-center p-4 rounded-lg bg-primary text-white hover:bg-indigo-700 transition-colors">
                <i className="fas fa-microphone text-xl mr-3"></i>
                <span className="font-medium">Record New Lecture</span>
              </a>
            </Link>
            
            <Link href="/upload">
              <a className="flex items-center p-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                <i className="fas fa-upload text-xl mr-3"></i>
                <span className="font-medium">Upload Audio File</span>
              </a>
            </Link>
            
            <Link href="/assignments">
              <a className="flex items-center p-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                <i className="fas fa-clipboard-list text-xl mr-3"></i>
                <span className="font-medium">Create Assignment</span>
              </a>
            </Link>
            
            <Link href="/students">
              <a className="flex items-center p-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                <i className="fas fa-users text-xl mr-3"></i>
                <span className="font-medium">Manage Students</span>
              </a>
            </Link>
          </>
        ) : (
          <>
            <Link href="/lectures">
              <a className="flex items-center p-4 rounded-lg bg-primary text-white hover:bg-indigo-700 transition-colors">
                <i className="fas fa-book-open text-xl mr-3"></i>
                <span className="font-medium">Browse Lectures</span>
              </a>
            </Link>
            
            <Link href="/notes">
              <a className="flex items-center p-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                <i className="fas fa-sticky-note text-xl mr-3"></i>
                <span className="font-medium">My Notes</span>
              </a>
            </Link>
            
            <Link href="/tasks">
              <a className="flex items-center p-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                <i className="fas fa-tasks text-xl mr-3"></i>
                <span className="font-medium">Assigned Tasks</span>
              </a>
            </Link>
            
            <Link href="/progress">
              <a className="flex items-center p-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                <i className="fas fa-chart-line text-xl mr-3"></i>
                <span className="font-medium">View Progress</span>
              </a>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickActions;
