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
import MosqueServiceRequest from "./pages/MosqueServiceRequest";
import MyRequests from "./pages/MyRequests";

// صفحات المستخدمين
import Users from "./pages/Users";
import UserDetails from "./pages/UserDetails";

// صفحات المشاريع
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectManagement from "./pages/ProjectManagement";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";

// صفحات أخرى
import Partners from "./pages/Partners";
import Branding from "./pages/Branding";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";

// صفحات الموردين
import SupplierRegistration from "./pages/SupplierRegistration";
import SuppliersManagement from "./pages/SuppliersManagement";
import OrganizationSettings from "./pages/OrganizationSettings";
import ContractForm from "./pages/ContractForm";
import ContractPreview from "./pages/ContractPreview";
import FieldInspectionForm from "./pages/FieldInspectionForm";
import QuickResponseReportForm from "./pages/QuickResponseReportForm";
import BOQ from "./pages/BOQ";
import Quotations from "./pages/Quotations";
import FinancialApproval from "./pages/FinancialApproval";
import CategoriesManagement from "./pages/CategoriesManagement";
import ContractTemplates from "./pages/ContractTemplates";
import ContractsList from "./pages/ContractsList";

function Router() {
  return (
    <Switch>
      {/* الصفحات العامة */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/track" component={TrackRequest} />
      <Route path="/service-request" component={MosqueServiceRequest} />
      
      {/* لوحات التحكم */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/requester" component={RequesterDashboard} />
      <Route path="/requester/dashboard" component={RequesterDashboard} />
      <Route path="/my-requests" component={MyRequests} />
      
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
      <Route path="/requests/:requestId/field-inspection" component={FieldInspectionForm} />
      <Route path="/requests/:requestId/quick-response" component={QuickResponseReportForm} />
      <Route path="/requester/requests/:id" component={RequestDetails} />
      
      {/* المستخدمون */}
      <Route path="/users" component={Users} />
      <Route path="/users/:id" component={UserDetails} />
      
      {/* المشاريع */}
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetailsPage} />
      <Route path="/project-management" component={ProjectManagement} />
      
      {/* صفحات أخرى */}
      <Route path="/partners" component={Partners} />
      <Route path="/branding" component={Branding} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/reports" component={Reports} />
      
      {/* الموردين */}
      <Route path="/supplier/register" component={SupplierRegistration} />
      <Route path="/supplier/dashboard" component={RequesterDashboard} />
      <Route path="/suppliers" component={SuppliersManagement} />
      <Route path="/organization-settings" component={OrganizationSettings} />
      <Route path="/contracts" component={ContractsList} />
      <Route path="/contracts/new" component={ContractForm} />
      <Route path="/contracts/new/:projectId" component={ContractForm} />
      <Route path="/contracts/new/request/:requestId" component={ContractForm} />
      <Route path="/contracts/:id/preview" component={ContractPreview} />
      <Route path="/contracts/:id" component={ContractPreview} />
      <Route path="/contract-templates" component={ContractTemplates} />
      
      {/* التقييم المالي */}
      <Route path="/boq" component={BOQ} />
      <Route path="/quotations" component={Quotations} />
      <Route path="/financial-approval" component={FinancialApproval} />
      
      {/* إدارة التصنيفات */}
      <Route path="/categories" component={CategoriesManagement} />
      
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
