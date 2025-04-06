import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import RecentLectures from "@/components/dashboard/RecentLectures";
import QuickActions from "@/components/dashboard/QuickActions";
import UpcomingSchedule from "@/components/dashboard/UpcomingSchedule";

const StudentDashboard = () => {
  const { user } = useAuth();

  // Fetch student stats
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats/student/${user?.id}`],
    enabled: !!user,
  });

  const defaultStats = {
    totalCourses: 4,
    completedLectures: 16,
    hoursListened: 24.5,
    averageScore: 85,
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
            icon="fas fa-book-open"
            iconColor="text-primary"
            bgColor="bg-blue-100"
            label="Enrolled Courses"
            value={isLoading ? "..." : displayStats.totalCourses}
          />

          <StatCard
            icon="fas fa-headphones"
            iconColor="text-accent"
            bgColor="bg-indigo-100"
            label="Completed Lectures"
            value={isLoading ? "..." : displayStats.completedLectures}
          />

          <StatCard
            icon="fas fa-clock"
            iconColor="text-success"
            bgColor="bg-green-100"
            label="Hours Listened"
            value={isLoading ? "..." : displayStats.hoursListened}
          />

          <StatCard
            icon="fas fa-chart-line"
            iconColor="text-secondary"
            bgColor="bg-purple-100"
            label="Average Score"
            value={isLoading ? "..." : `${displayStats.averageScore}%`}
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

export default StudentDashboard;
