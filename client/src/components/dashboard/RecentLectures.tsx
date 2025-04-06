import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { formatDuration } from "@/lib/audioPlayer";
import { Link } from "wouter";

interface Lecture {
  id: number;
  title: string;
  createdAt: string;
  duration: number;
  status: string;
}

const RecentLectures = () => {
  const { user } = useAuth();

  const { data: lectures, isLoading, error } = useQuery({
    queryKey: [user?.role === "teacher" ? `/api/lectures?teacherId=${user?.id}` : "/api/lectures"],
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Recent Lectures</h3>
        </div>
        <div className="p-6">
          <p>Loading recent lectures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Recent Lectures</h3>
        </div>
        <div className="p-6">
          <p className="text-red-500">Error loading lectures</p>
        </div>
      </div>
    );
  }

  const recentLectures = lectures?.slice(0, 4) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Recent Lectures</h3>
        <Link href="/lectures" className="text-sm text-primary hover:text-indigo-500">
          View all
        </Link>
      </div>
      <div className="divide-y divide-gray-200">
        {recentLectures.length === 0 ? (
          <div className="px-6 py-4 text-center text-gray-500">
            No lectures available
          </div>
        ) : (
          recentLectures.map((lecture: Lecture) => (
            <div key={lecture.id} className="px-6 py-4 flex items-center">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{lecture.title}</h4>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <i className="fas fa-calendar-alt mr-1"></i>
                    {formatDate(lecture.createdAt)}
                  </span>
                  <span className="flex items-center ml-4">
                    <i className="fas fa-clock mr-1"></i>
                    {formatDuration(lecture.duration || 0)}
                  </span>
                  <span
                    className={`ml-4 px-2 py-0.5 rounded-full text-xs ${
                      lecture.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {lecture.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div>
                <Link href={`/lectures/${lecture.id}`}>
                  <a className="text-gray-400 hover:text-primary">
                    <i className={`fas ${user?.role === "teacher" && lecture.status !== "published" ? "fa-edit" : "fa-play-circle"} text-xl`}></i>
                  </a>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentLectures;
