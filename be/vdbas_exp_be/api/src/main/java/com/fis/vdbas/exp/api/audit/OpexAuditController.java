package com.fis.vdbas.exp.api.audit;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.audit.dto.AuditLogEntryDto;
import com.fis.vdbas.exp.application.audit.service.AuditLogService;
import com.fis.vdbas.exp.application.dossier.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.application.dossier.service.OpexDossierWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Lịch sử phê duyệt + thay đổi của hồ sơ OPEX — {@code /api/v1/exp/opex/dossiers/{dossierId}}.
 * <p>Tái dùng {@link AuditLogService} (audit-log) và {@link OpexDossierWorkflowService} (approval-log).</p>
 */
@RestController
@RequestMapping("/api/v1/exp/opex/dossiers/{dossierId}")
@RequiredArgsConstructor
public class OpexAuditController {

    private final OpexDossierWorkflowService workflowService;
    private final AuditLogService auditLogService;

    /** GET lịch sử phê duyệt (EXP_APPROVAL_LOG). */
    @GetMapping("/approval-log")
    public List<ApprovalLogEntryDto> approvalLog(@PathVariable UUID dossierId) {
        return workflowService.getApprovalLog(dossierId);
    }

    /** GET lịch sử thay đổi field (EXP_AUDIT_LOG, BIZ-007). */
    @GetMapping("/audit-log")
    public PageResponseDto<AuditLogEntryDto> auditLog(
            @PathVariable UUID dossierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return auditLogService.getDossierAuditLog(dossierId, page, size);
    }
}
