import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import RecentLectures from "@/components/dashboard/RecentLectures";
import QuickActions from "@/components/dashboard/QuickActions";
import UpcomingSchedule from "@/components/dashboard/UpcomingSchedule";

const TeacherDashboard = () => {
  const { user } = useAuth();

  // Fetch teacher stats
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats/teacher/${user?.id}`],
    enabled: !!user,
  });

  const defaultStats = {
    totalLectures: 24,
    totalHours: 36.5,
    totalStudents: 128,
    totalCourses: 4,
  };

  const displayStats = stats || defaultStats;

  return (
    <div>
      {/* Dashboard Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome back, {user?.displayName.split(' ')[0]}!
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="fas fa-microphone"
            iconColor="text-primary"
            bgColor="bg-blue-100"
            label="Total Lectures"
            value={isLoading ? "..." : displayStats.totalLectures}
          />

          <StatCard
            icon="fas fa-clock"
            iconColor="text-accent"
            bgColor="bg-indigo-100"
            label="Total Hours"
            value={isLoading ? "..." : displayStats.totalHours}
          />

          <StatCard
            icon="fas fa-users"
            iconColor="text-success"
            bgColor="bg-green-100"
            label="Students"
            value={isLoading ? "..." : displayStats.totalStudents}
          />

          <StatCard
            icon="fas fa-book-open"
            iconColor="text-secondary"
            bgColor="bg-purple-100"
            label="Courses"
            value={isLoading ? "..." : displayStats.totalCourses}
          />
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentLectures />
        </div>

        <div>
          <QuickActions />
          <UpcomingSchedule />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
