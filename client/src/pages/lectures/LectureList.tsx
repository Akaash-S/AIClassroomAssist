import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/audioPlayer";

interface Lecture {
  id: number;
  title: string;
  createdAt: string;
  duration: number;
  status: string;
  audioUrl: string;
}

const LectureList = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const { data: lectures, isLoading, error } = useQuery({
    queryKey: [isTeacher ? `/api/lectures?teacherId=${user?.id}` : "/api/lectures"],
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isTeacher ? "My Lectures" : "Available Lectures"}
        </h1>
        {isTeacher && (
          <Link href="/record-lecture">
            <Button className="inline-flex items-center">
              <i className="fas fa-plus mr-2"></i>
              Record New Lecture
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">Loading lectures...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Failed to load lectures</div>
        ) : lectures?.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {isTeacher
              ? "You haven't created any lectures yet. Start by recording your first lecture!"
              : "No lectures available at the moment."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lectures.map((lecture: Lecture) => (
                  <tr key={lecture.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lecture.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(lecture.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDuration(lecture.duration || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lecture.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {lecture.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/lectures/${lecture.id}`}>
                        <span className="text-primary hover:text-indigo-700 mr-4 cursor-pointer">
                          View
                        </span>
                      </Link>
                      {isTeacher && (
                        <>
                          <a href="#" className="text-gray-600 hover:text-gray-900 mr-4">
                            Edit
                          </a>
                          <a href="#" className="text-red-600 hover:text-red-900">
                            Delete
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureList;
