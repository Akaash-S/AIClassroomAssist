import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import TeacherDashboard from "@/pages/dashboard/TeacherDashboard";
import StudentDashboard from "@/pages/dashboard/index";
import Lectures from "@/pages/lectures/index";
import LectureDetails from "@/pages/lectures/[id]";
import RecordLecture from "@/pages/record-lecture/index";
import Progress from "@/pages/progress/index";
import Notes from "@/pages/notes/index";
import Students from "@/pages/students/index";
import StudentDetails from "@/pages/students/[id]";
import Analytics from "@/pages/analytics/index";
import Settings from "@/pages/settings/index";
import Calendar from "@/pages/calendar/index";
import Tasks from "@/pages/tasks/index";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

function ProtectedRoute({ component: Component, requiredRole = null }: { component: React.ComponentType, requiredRole?: string | null }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    } else if (!loading && user && requiredRole && user.role !== requiredRole) {
      setLocation("/");
    }
  }, [user, loading, setLocation, requiredRole]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        {() => {
          if (user?.role === "teacher") {
            return <ProtectedRoute component={TeacherDashboard} requiredRole="teacher" />;
          } else if (user?.role === "student") {
            return <ProtectedRoute component={StudentDashboard} requiredRole="student" />;
          } else if (!user) {
            return <Login />;
          }
          return <NotFound />;
        }}
      </Route>

      {/* Common routes for both teachers and students */}
      <Route path="/lectures">
        {() => <ProtectedRoute component={Lectures} />}
      </Route>
      
      <Route path="/lectures/:id">
        {(params) => <ProtectedRoute component={() => <LectureDetails />} />}
      </Route>
      
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      
      {/* Teacher-specific routes */}
      <Route path="/record-lecture">
        {() => <ProtectedRoute component={RecordLecture} requiredRole="teacher" />}
      </Route>
      
      <Route path="/students">
        {() => <ProtectedRoute component={Students} requiredRole="teacher" />}
      </Route>
      
      <Route path="/students/:id">
        {() => <ProtectedRoute component={StudentDetails} requiredRole="teacher" />}
      </Route>
      
      <Route path="/analytics">
        {() => <ProtectedRoute component={Analytics} requiredRole="teacher" />}
      </Route>
      
      {/* Student-specific routes */}
      <Route path="/progress">
        {() => <ProtectedRoute component={Progress} requiredRole="student" />}
      </Route>
      
      <Route path="/notes">
        {() => <ProtectedRoute component={Notes} requiredRole="student" />}
      </Route>
      
      <Route path="/calendar">
        {() => <ProtectedRoute component={Calendar} requiredRole="student" />}
      </Route>
      
      <Route path="/tasks">
        {() => <ProtectedRoute component={Tasks} requiredRole="student" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
