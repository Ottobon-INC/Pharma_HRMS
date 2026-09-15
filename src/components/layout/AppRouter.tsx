import React from 'react';
import { Employee, Language, Task, PunchType, LeaveBalance, PinType } from '../../types';

// Lazy Loaded Modules
const DashboardSnapshot = React.lazy(() => import('../DashboardSnapshot'));
const AttendanceModule = React.lazy(() => import('../AttendanceModule'));
const FieldDutyModule = React.lazy(() => import('../FieldDutyModule'));
const LeaveModule = React.lazy(() => import('../LeaveModule'));
const AdminDashboard = React.lazy(() => import('../AdminDashboard'));
const EmployeeDirectory = React.lazy(() => import('../EmployeeDirectory'));
const AdminAttendance = React.lazy(() => import('../AdminAttendance'));
const FieldOpsModule = React.lazy(() => import('../FieldOpsModule'));
const AdminLeaveApprovals = React.lazy(() => import('../AdminLeaveApprovals'));
const AdminOfficeLocations = React.lazy(() => import('../AdminOfficeLocations'));
const MessagingModule = React.lazy(() => import('../MessagingModule').then(m => ({ default: m.MessagingModule })));
const AdminSettings = React.lazy(() => import('../AdminSettings'));
const TaskModule = React.lazy(() => import('../TaskModule'));
const AdminTaskManager = React.lazy(() => import('../AdminTaskManager'));
const ExecutiveOverview = React.lazy(() => import('../ExecutiveOverview'));
const OrgHierarchyView = React.lazy(() => import('../OrgHierarchyView'));
const CallPhotoCaptureView = React.lazy(() => import('../fieldops/CallPhotoCaptureView').then(m => ({ default: m.CallPhotoCaptureView })));
const DoctorVisitPlanner = React.lazy(() => import('../DoctorVisitPlanner'));
const TeamHub = React.lazy(() => import('../TeamHub'));


interface AppRouterProps {
 activeTab: string;
 language: Language;
 currentUser: Employee;
 employees: Employee[];
 allEmployees?: Employee[];
 isLocalMode: boolean;
 tasks: Task[];
 noDataText: string;
 setActiveTab: (tab: string) => void;
 // Actions
 onToggleCheckIn: (userId: string, isCheckedIn: boolean, photoData?: string, punchType?: PunchType, punchNote?: string) => Promise<any>;
 onAddPin: (employeeId: string, label: string, pinType?: PinType, photoUrl?: string) => Promise<any>;
 onApplyLeave: (empId: string, req: any) => Promise<void>;
 onApproveLeave: (reqId: string, note?: string) => Promise<void>;
 onRejectLeave: (reqId: string, note?: string) => Promise<void>;
 onAddEmployee: (emp: any) => Promise<void>;
 onUpdateEmployee: (id: string, fields: Partial<Employee>) => Promise<void>;
 onDeleteEmployee: (id: string) => Promise<void>;
 onUpdateBalances: (empId: string, balances: LeaveBalance) => Promise<void>;
 onUpdateAttendance: (employeeId: string, date: string, status: any, checkInTime?: string, checkOutTime?: string, sessionNumber?: number) => Promise<void>;
 onForceCloseSession: (employeeId: string, date: string, sessionNumber?: number) => Promise<void>;
 onCreateTask: (task: any) => Promise<any>;
 onUpdateTask: (id: string, updates: any) => Promise<any>;
 onDeleteTask: (id: string) => Promise<any>;
 onUpdateTaskStatus: (id: string, status: any) => Promise<any>;
 onApproveTask?: (taskId: string, approverId: string, note?: string) => Promise<any>;
 onRejectTask?: (taskId: string, approverId: string, note: string) => Promise<any>;
 onReassignTask?: (taskId: string, newAssigneeId: string, newAssigneeName?: string) => Promise<any>;
 onOpenProfile?: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
 activeTab,
 language,
 currentUser,
 employees,
 allEmployees,
 isLocalMode,
 tasks,
 noDataText,
 setActiveTab,
 onOpenProfile,
 onToggleCheckIn,
 onAddPin,
 onApplyLeave,
 onApproveLeave,
 onRejectLeave,
 onAddEmployee,
 onUpdateEmployee,
 onDeleteEmployee,
 onUpdateBalances,
 onUpdateAttendance,
 onForceCloseSession,
 onCreateTask,
 onUpdateTask,
 onDeleteTask,
 onUpdateTaskStatus,
 onApproveTask,
 onRejectTask,
 onReassignTask
}) => {
 switch (activeTab) {
  // --- EMPLOYEE MODULES ---
  case 'dashboard':
   return (
    <DashboardSnapshot
     language={language}
     currentUser={currentUser}
     isCheckedIn={currentUser.isCheckedIn}
     logs={currentUser.checkInLogs}
     attendanceRecords={currentUser.attendanceRecords}
     leaveBalance={currentUser.leaveBalance}
     setActiveTab={setActiveTab}
     onToggleCheckIn={(photoData?: string, punchType?: PunchType, punchNote?: string) =>
      onToggleCheckIn(currentUser.id, currentUser.isCheckedIn, photoData, punchType, punchNote)
     }
     pins={currentUser.locationPins || []}
     onAddPin={onAddPin}
    />
   );
  case 'attendance':
   return (
    <AttendanceModule
     language={language}
     attendanceRecords={currentUser.attendanceRecords}
    />
   );
  case 'fieldDuty':
   return (
    <FieldDutyModule
     language={language}
     employeeId={currentUser.id}
     isLocalMode={isLocalMode}
    />
   );
  case 'callCapture':
   return (
    <CallPhotoCaptureView
     language={language}
     employeeId={currentUser.id}
     isLocalMode={isLocalMode}
     currentUser={currentUser}
     employees={employees}
    />
   );

  case 'leave':
   return (
    <LeaveModule
     language={language}
     leaveBalance={currentUser.leaveBalance}
     monthlyQuota={currentUser.monthlyQuota!}
     leaveRequests={currentUser.leaveRequests}
     gender={currentUser.gender}
     onApplyLeave={(type, fromDate, toDate, reason) =>
      onApplyLeave(currentUser.id, { type, fromDate, toDate, reason, status: 'pending', submittedAt: new Date().toISOString() })
     }
     onApproveLeave={(reqId) => onApproveLeave(reqId, currentUser.id)}
     onRejectLeave={(reqId) => onRejectLeave(reqId, currentUser.id)}
    />
   );

  // --- ADMIN MODULES ---
  case 'adminDashboard':
   return (
     <AdminDashboard
      language={language}
      employees={employees}
      currentUser={currentUser}
      setActiveTab={setActiveTab}
     />
   );
  case 'directory':
   return (
    <EmployeeDirectory
     language={language}
     employees={employees}
     onAddEmployee={onAddEmployee}
     onUpdateEmployee={onUpdateEmployee}
     onDeleteEmployee={onDeleteEmployee}
     onApproveEmployeeLeave={(_empId, reqId) => onApproveLeave(reqId, currentUser.id)}
     onRejectEmployeeLeave={(_empId, reqId) => onRejectLeave(reqId, currentUser.id)}
     onApplyEmployeeLeave={(empId, type, fromDate, toDate, reason) =>
      onApplyLeave(empId, { type, fromDate, toDate, reason, status: 'pending', submittedAt: new Date().toISOString() })
     }
     onUpdateLeaveBalances={onUpdateBalances}
    />
   );
  case 'attendanceOverview':
   return (
    <AdminAttendance
     language={language}
     employees={employees}
     onUpdateAttendance={onUpdateAttendance}
     onForceCloseSession={onForceCloseSession}
    />
   );
  case 'fieldOps':
   return (
    <FieldOpsModule
     language={language}
     isLocalMode={isLocalMode}
     employees={employees}
     adminId={currentUser.id}
    />
   );

  case 'leaveApprovals':
   return (
    <AdminLeaveApprovals
     language={language}
     currentUser={currentUser}
     employees={employees}
     onApproveLeave={(_empId, reqId, _approverId, note) => onApproveLeave(reqId, note)}
     onRejectLeave={(_empId, reqId, _approverId, note) => onRejectLeave(reqId, note)}
    />
   );
  case 'doctorPlanner':
   return (
    <DoctorVisitPlanner
     language={language}
     currentUser={currentUser}
     employees={employees}
    />
   );
  case 'officeLocations':
   return (
    <AdminOfficeLocations language={language} />
   );
  case 'messages':
   return (
    <MessagingModule currentUser={currentUser} employees={employees} />
   );
  case 'adminSettings':
   return (
    <AdminSettings language={language} onOpenProfile={onOpenProfile} />
   );
  case 'tasks':
   return (
    <TaskModule
     language={language}
     currentUser={currentUser}
     employees={employees}
     tasks={tasks}
     onUpdateStatus={onUpdateTaskStatus}
    />
   );
  case 'adminTasks':
   return (
    <AdminTaskManager
     language={language}
     currentUser={currentUser}
     employees={employees}
     tasks={tasks}
     onCreateTask={onCreateTask}
     onUpdateTask={onUpdateTask}
     onDeleteTask={onDeleteTask}
     onUpdateStatus={onUpdateTaskStatus}
    />
   );
  case 'executiveOverview':
   return (
    <ExecutiveOverview
     language={language}
     currentUser={currentUser}
     employees={allEmployees || employees}
     tasks={tasks}
     setActiveTab={setActiveTab}
    />
   );
  case 'orgChart':
   return (
    <OrgHierarchyView
     language={language}
     currentUser={currentUser}
     employees={allEmployees || employees}
    />
   );
  case 'teamHub':
   return (
    <TeamHub
     language={language}
     currentUser={currentUser}
     employees={allEmployees || employees}
     tasks={tasks}
     onApproveTask={onApproveTask}
     onRejectTask={onRejectTask}
     onReassignTask={onReassignTask}
     onCreateTask={onCreateTask}
     onSelectTab={setActiveTab}
    />
   );

  default:
   return (
    <div className="py-12 text-center text-slate-500 font-medium">
     {noDataText}
    </div>
   );
 }
};

export default AppRouter;
