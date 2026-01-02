import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// الصفحات العامة
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// لوحات التحكم
import Dashboard from "./pages/Dashboard";
import RequesterDashboard from "./pages/RequesterDashboard";

// صفحات المساجد
import Mosques from "./pages/Mosques";
import MosqueDetails from "./pages/MosqueDetails";
import MosqueForm from "./pages/MosqueForm";
import MosquesMap from "./pages/MosquesMap";

// صفحات الطلبات
import Requests from "./pages/Requests";
import RequestDetails from "./pages/RequestDetails";
import RequestForm from "./pages/RequestForm";
import TrackRequest from "./pages/TrackRequest";

// صفحات المستخدمين
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";

// صفحات المشاريع
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";

// صفحات أخرى
import Partners from "./pages/Partners";
import Branding from "./pages/Branding";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      {/* الصفحات العامة */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/track" component={TrackRequest} />
      
      {/* لوحات التحكم */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/requester/dashboard" component={RequesterDashboard} />
      
      {/* المساجد */}
      <Route path="/mosques" component={Mosques} />
      <Route path="/mosques/map" component={MosquesMap} />
      <Route path="/mosques/new" component={MosqueForm} />
      <Route path="/mosques/:id" component={MosqueDetails} />
      <Route path="/mosques/:id/edit" component={MosqueForm} />
      
      {/* الطلبات */}
      <Route path="/requests" component={Requests} />
      <Route path="/requests/new" component={RequestForm} />
      <Route path="/requests/:id" component={RequestDetails} />
      <Route path="/requests/:id/edit" component={RequestForm} />
      
      {/* المستخدمون */}
      <Route path="/users" component={Users} />
      <Route path="/users/:id" component={UserDetails} />
      
      {/* المشاريع */}
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetails} />
      
      {/* صفحات أخرى */}
      <Route path="/partners" component={Partners} />
      <Route path="/branding" component={Branding} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/reports" component={Reports} />
      
      {/* صفحة 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
