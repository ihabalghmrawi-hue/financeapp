import { approvalAlertService } from '../alerts/approval-alerts'
import { workflowAlertService } from '../alerts/workflow-alerts'
import { slaAlertService } from '../alerts/sla-alerts'
import { escalationAlertService } from '../alerts/escalation-alerts'

class WorkflowBridge {
  async onWorkflowEvent(event: {
    type: string
    companyId: string
    userId: string
    workflowId: string
    workflowName: string
    stepName?: string
    assignee?: string
    slaMinutes?: number
    errorMessage?: string
    result?: string
    remainingMinutes?: number
    escalationLevel?: number
    previousAssignee?: string
    reason?: string
  }): Promise<void> {
    switch (event.type) {
      case 'step_assigned':
        await workflowAlertService.notifyStepAssigned(event.companyId, event.userId, {
          workflowId: event.workflowId,
          workflowName: event.workflowName,
          stepName: event.stepName ?? '',
          dueDate: event.slaMinutes ? new Date(Date.now() + event.slaMinutes * 60000).toISOString() : undefined,
        })
        break

      case 'workflow_failed':
        await workflowAlertService.notifyWorkflowFailed(event.companyId, event.userId, {
          workflowId: event.workflowId,
          workflowName: event.workflowName,
          stepName: event.stepName ?? '',
          errorMessage: event.errorMessage,
        })
        break

      case 'workflow_completed':
        await workflowAlertService.notifyWorkflowCompleted(event.companyId, event.userId, {
          workflowId: event.workflowId,
          workflowName: event.workflowName,
          result: event.result,
        })
        break

      case 'sla_warning':
        if (event.remainingMinutes !== null && event.slaMinutes !== null) {
          await slaAlertService.notifySLAWarning(event.companyId, event.userId, {
            entityType: 'workflow',
            entityId: event.workflowId,
            entityName: event.workflowName,
            slaMinutes: event.slaMinutes,
            remainingMinutes: event.remainingMinutes,
          })
        }
        break

      case 'sla_breach':
        if (event.slaMinutes !== null) {
          await slaAlertService.notifySLABreach(event.companyId, event.userId, {
            entityType: 'workflow',
            entityId: event.workflowId,
            entityName: event.workflowName,
            slaMinutes: event.slaMinutes,
            elapsedMinutes: event.slaMinutes + (event.remainingMinutes ?? 0),
            assignee: event.assignee,
          })
        }
        break

      case 'escalated':
        if (event.escalationLevel !== null && event.previousAssignee && event.reason) {
          await escalationAlertService.notifyEscalation(event.companyId, event.userId, {
            escalationId: event.workflowId,
            entityType: 'workflow',
            entityId: event.workflowId,
            entityName: event.workflowName,
            level: event.escalationLevel,
            previousAssignee: event.previousAssignee,
            reason: event.reason,
            slaMinutes: event.slaMinutes,
          })
        }
        break
    }
  }

  async onApprovalEvent(event: {
    type: 'created' | 'completed' | 'reminder'
    companyId: string
    userId: string
    approvalId: string
    title: string
    requesterName?: string
    amount?: number
    currency?: string
    slaMinutes?: number
    decision?: 'approved' | 'rejected' | 'conditional'
    decidedBy?: string
    comments?: string
    remainingMinutes?: number
  }): Promise<void> {
    switch (event.type) {
      case 'created':
        await approvalAlertService.notifyApprovalRequired(event.companyId, event.userId, {
          approvalId: event.approvalId,
          title: event.title,
          requesterName: event.requesterName ?? '',
          amount: event.amount,
          currency: event.currency,
          slaMinutes: event.slaMinutes,
        })
        break

      case 'completed':
        if (event.decision) {
          await approvalAlertService.notifyApprovalCompleted(event.companyId, event.userId, {
            approvalId: event.approvalId,
            title: event.title,
            decision: event.decision,
            decidedBy: event.decidedBy ?? '',
            comments: event.comments,
          })
        }
        break

      case 'reminder':
        if (event.remainingMinutes !== null && event.slaMinutes !== null) {
          await approvalAlertService.notifyApprovalReminder(event.companyId, event.userId, {
            approvalId: event.approvalId,
            title: event.title,
            remainingMinutes: event.remainingMinutes,
            slaMinutes: event.slaMinutes,
          })
        }
        break
    }
  }
}

export const workflowBridge = new WorkflowBridge()
