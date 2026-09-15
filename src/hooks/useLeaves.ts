import { LeaveRequest, LeaveType } from '../types';
import * as leaveService from '../lib/services/leave-service';

export function useLeaves(isLocalMode: boolean, loadData: () => Promise<void>) {
  const applyLeave = async (empId: string, leave: Omit<LeaveRequest, 'id'>) => {
    if (isLocalMode) {
      alert("Leave requests can only be submitted in online mode.");
      return;
    }
    await leaveService.submitLeaveRequest(empId, leave);
    await loadData();
  };

  const approveLeave = async (id: string, approverId: string, note?: string) => {
    if (isLocalMode) {
      alert("Leaves can only be approved in online mode.");
      return;
    }
    await leaveService.updateLeaveRequestStatus(id, approverId, 'Approved', note);
    await loadData();
  };

  const rejectLeave = async (id: string, approverId: string, note?: string) => {
    if (isLocalMode) {
      alert("Leaves can only be rejected in online mode.");
      return;
    }
    await leaveService.updateLeaveRequestStatus(id, approverId, 'Rejected', note);
    await loadData();
  };

  const updateBalances = async (empId: string, type: LeaveType, allotted: number, used: number) => {
    if (isLocalMode) {
      alert("Leave balances can only be updated in online mode.");
      return;
    }
    await leaveService.updateLeaveBalances(empId, type, allotted, used);
    await loadData();
  };

  return {
    applyLeave,
    approveLeave,
    rejectLeave,
    updateBalances
  };
}
