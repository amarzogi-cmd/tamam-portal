import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// الصفحات العامة
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";

// لوحات التحكم
import Dashboard from "./pages/Dashboard";
import RequesterDashboard from "./pages/RequesterDashboard";

// صفحات المساجد
import Mosques from "./pages/Mosques";
import MosqueDetails from "./pages/MosqueDetails";
import MosqueForm from "./pages/MosqueForm";
import MosquesMap from "./pages/MosquesMap";
import MyMosques from "./pages/MyMosques";
import RequesterMosqueForm from "./pages/RequesterMosqueForm";

// صفحات الطلبات
import Requests from "./pages/Requests";
import RequestDetails from "./pages/RequestDetailsNew";
import RequestForm from "./pages/RequestForm";
import TrackRequest from "./pages/TrackRequest";
import MosqueServiceRequest from "./pages/MosqueServiceRequest";
import MyRequests from "./pages/MyRequests";

// صفحات المستخدمين
import UsersManagement from "./pages/UsersManagement";
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
import FieldVisitSchedule from "./pages/FieldVisitSchedule";
import FieldVisitsCalendar from "./pages/FieldVisitsCalendar";
import QuickResponseReportForm from "./pages/QuickResponseReportForm";
import BOQ from "./pages/BOQ";
import Quotations from "./pages/Quotations";
import FinancialApproval from "./pages/FinancialApproval";
import CategoriesManagement from "./pages/CategoriesManagement";
import ContractTemplates from "./pages/ContractTemplates";
import ContractsList from "./pages/ContractsList";
import DisbursementRequests from "./pages/DisbursementRequests";
import Handovers from "./pages/Handovers";
import NewDisbursementRequest from "./pages/NewDisbursementRequest";
import NewDisbursementOrder from "./pages/NewDisbursementOrder";
import DisbursementOrderPrint from "./pages/DisbursementOrderPrint";
import DisbursementRequestPrint from "./pages/DisbursementRequestPrint";
import ProgressReports from "./pages/ProgressReports";
import DisbursementOrders from "./pages/DisbursementOrders";
import DisbursementOrderDetails from "./pages/DisbursementOrderDetails";
import FinancialDashboard from "./pages/FinancialDashboard";
import FinancialReport from "./pages/FinancialReport";
import StageSettings from "./pages/StageSettings";
import ActionSettings from "./pages/ActionSettings";
import Roles from "./pages/Roles";
import RoleEdit from "./pages/RoleEdit";
import UserPermissions from "./pages/UserPermissions";
import PermissionsAuditLog from "./pages/PermissionsAuditLog";
import AdminGuard from "./components/AdminGuard";
import DebugUser from "./pages/DebugUser";

// مكون لحماية المسارات الإدارية
const AdminRoute = ({ component: Component }: { component: React.ComponentType }) => (
  <AdminGuard>
    <Component />
  </AdminGuard>
);

function Router() {
  return (
    <Switch>
      {/* الصفحات العامة */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/register" component={Register} />
      <Route path="/track" component={TrackRequest} />
      <Route path="/service-request" component={MosqueServiceRequest} />
      <Route path="/debug-user" component={DebugUser} />
      
      {/* لوحات التحكم */}
      <Route path="/dashboard">{() => <AdminRoute component={Dashboard} />}</Route>
      <Route path="/requester" component={RequesterDashboard} />
      <Route path="/requester/dashboard" component={RequesterDashboard} />
      <Route path="/my-requests" component={MyRequests} />
      
      {/* المساجد - الصفحات الإدارية */}
      <Route path="/mosques">{() => <AdminRoute component={Mosques} />}</Route>
      <Route path="/mosques/map">{() => <AdminRoute component={MosquesMap} />}</Route>
      <Route path="/mosques/new" component={MosqueForm} />
      <Route path="/requester/mosques/new" component={RequesterMosqueForm} />
      <Route path="/mosques/:id" component={MosqueDetails} />
      <Route path="/mosques/:id/edit" component={MosqueForm} />
      <Route path="/my-mosques" component={MyMosques} />
      
      {/* الطلبات - الصفحات الإدارية */}
      <Route path="/requests">{() => <AdminRoute component={Requests} />}</Route>
      <Route path="/requests/new">{() => <AdminRoute component={RequestForm} />}</Route>
      <Route path="/requests/:id" component={RequestDetails} />
      {/* <Route path="/requests/:id/old" component={RequestDetailsOld} /> */}
      <Route path="/requests/:id/edit">{() => <AdminRoute component={RequestForm} />}</Route>
      <Route path="/requests/:requestId/field-inspection">{() => <AdminRoute component={FieldInspectionForm} />}</Route>
      <Route path="/requests/:requestId/quick-response">{() => <AdminRoute component={QuickResponseReportForm} />}</Route>
      <Route path="/field-visits/calendar">{() => <AdminRoute component={FieldVisitsCalendar} />}</Route>
      <Route path="/field-visits/schedule/:requestId">{() => <AdminRoute component={FieldVisitSchedule} />}</Route>
      <Route path="/field-visits/report/:requestId">{() => <AdminRoute component={FieldInspectionForm} />}</Route>
      <Route path="/requester/requests/:id" component={RequestDetails} />
      {/* <Route path="/requester/requests/:id/old" component={RequestDetailsOld} /> */}
      
      {/* المستخدمون - إدارية */}
      <Route path="/users">{() => <AdminRoute component={UsersManagement} />}</Route>
      <Route path="/users/:id">{() => <AdminRoute component={UserDetails} />}</Route>
      
      {/* المشاريع - إدارية */}
      <Route path="/projects">{() => <AdminRoute component={Projects} />}</Route>
      <Route path="/projects/:id">{() => <AdminRoute component={ProjectDetailsPage} />}</Route>
      <Route path="/project-management">{() => <AdminRoute component={ProjectManagement} />}</Route>
      
      {/* صفحات أخرى - إدارية */}
      <Route path="/partners">{() => <AdminRoute component={Partners} />}</Route>
      <Route path="/branding">{() => <AdminRoute component={Branding} />}</Route>
      <Route path="/settings">{() => <AdminRoute component={Settings} />}</Route>
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/reports">{() => <AdminRoute component={Reports} />}</Route>
      
      {/* الموردين - إدارية */}
      <Route path="/supplier/register" component={SupplierRegistration} />
      <Route path="/supplier/dashboard" component={RequesterDashboard} />
      <Route path="/suppliers">{() => <AdminRoute component={SuppliersManagement} />}</Route>
      <Route path="/organization-settings">{() => <AdminRoute component={OrganizationSettings} />}</Route>
      <Route path="/contracts">{() => <AdminRoute component={ContractsList} />}</Route>
      <Route path="/contracts/new">{() => <AdminRoute component={ContractForm} />}</Route>
      <Route path="/contracts/new/:projectId">{() => <AdminRoute component={ContractForm} />}</Route>
      <Route path="/contracts/new/request/:requestId">{() => <AdminRoute component={ContractForm} />}</Route>
      <Route path="/contracts/:id/preview">{() => <AdminRoute component={ContractPreview} />}</Route>
      <Route path="/contracts/:id">{() => <AdminRoute component={ContractPreview} />}</Route>
      <Route path="/contract-templates">{() => <AdminRoute component={ContractTemplates} />}</Route>
      
      {/* التقييم المالي - إدارية */}
      {/* تم تعطيل /boq المستقل - جداول الكميات متاحة من داخل صفحة الطلب */}
      {/* <Route path="/boq">{() => <AdminRoute component={BOQ} />}</Route> */}
      <Route path="/boq/:requestId">{() => <AdminRoute component={BOQ} />}</Route>
      <Route path="/quotations">{() => <AdminRoute component={Quotations} />}</Route>
      <Route path="/financial-approval">{() => <AdminRoute component={FinancialApproval} />}</Route>
      
      {/* إدارة التصنيفات - إدارية */}
      <Route path="/categories">{() => <AdminRoute component={CategoriesManagement} />}</Route>
      
      {/* طلبات الصرف - إدارية */}
      <Route path="/financial-dashboard">{() => <AdminRoute component={FinancialDashboard} />}</Route>
      <Route path="/disbursements">{() => <AdminRoute component={DisbursementRequests} />}</Route>
      <Route path="/disbursement-requests">{() => <AdminRoute component={DisbursementRequests} />}</Route>
      <Route path="/disbursements/new">{() => <AdminRoute component={NewDisbursementRequest} />}</Route>
      <Route path="/disbursements/new/:projectId">{() => <AdminRoute component={NewDisbursementRequest} />}</Route>
      <Route path="/disbursements/new/contract/:contractId">{() => <AdminRoute component={NewDisbursementRequest} />}</Route>
      
      {/* أوامر الصرف - إدارية */}
      <Route path="/disbursement-orders">{() => <AdminRoute component={DisbursementOrders} />}</Route>
      <Route path="/disbursement-orders/new/:requestId">{() => <AdminRoute component={NewDisbursementOrder} />}</Route>
      <Route path="/disbursement-orders/:id/print">{() => <AdminRoute component={DisbursementOrderPrint} />}</Route>
      <Route path="/disbursement-orders/:id">{() => <AdminRoute component={DisbursementOrderDetails} />}</Route>
      <Route path="/disbursements/orders/new/:requestId">{() => <AdminRoute component={NewDisbursementOrder} />}</Route>
      <Route path="/disbursements/orders/:id/print">{() => <AdminRoute component={DisbursementOrderPrint} />}</Route>
      <Route path="/disbursements/requests/:id/print">{() => <AdminRoute component={DisbursementRequestPrint} />}</Route>
      
      {/* تقارير الإنجاز - إدارية */}
      <Route path="/progress-reports">{() => <AdminRoute component={ProgressReports} />}</Route>
      
      {/* الاستلامات - إدارية */}
      <Route path="/handovers">{() => <AdminRoute component={Handovers} />}</Route>
      
      {/* التقرير المالي - إدارية */}
      <Route path="/financial-report">{() => <AdminRoute component={FinancialReport} />}</Route>
      
      {/* إعدادات المراحل - إدارية */}
      <Route path="/stage-settings">{() => <AdminRoute component={StageSettings} />}</Route>
      <Route path="/action-settings">{() => <AdminRoute component={ActionSettings} />}</Route>
      
      {/* إدارة الأدوار والصلاحيات - إدارية */}
      <Route path="/roles">{() => <AdminRoute component={Roles} />}</Route>
      <Route path="/roles/:id">{() => <AdminRoute component={RoleEdit} />}</Route>
      <Route path="/users/:id/permissions">{() => <AdminRoute component={UserPermissions} />}</Route>
      <Route path="/permissions-audit">{() => <AdminRoute component={PermissionsAuditLog} />}</Route>
      
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
