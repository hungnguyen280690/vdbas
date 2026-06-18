package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.exp.application.dossier.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.application.dossier.dto.ApproveRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.RejectRequest;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.mapper.ApprovalLogMapper;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.common.enums.ActionRole;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import com.fis.vdbas.exp.domain.dossier.ExpApprovalLog;
import com.fis.vdbas.exp.domain.dossier.ExpApprovalLogRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.dossier.ExpDossierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service luồng phê duyệt Maker–Checker–Approver.
 * <p>Out-of-scope (chỉ {@code // TODO}): trích role/displayName từ JWT, kiểm tra SoD (BIZ-001),
 * notification, sinh HASH_INFO, ký số. Tạm dùng placeholder user/role.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DossierWorkflowService {

    private final ExpDossierRepository repository;
    private final ExpDocumentRepository documentRepository;
    private final ExpApprovalLogRepository approvalLogRepository;
    private final ApprovalLogMapper approvalLogMapper;
    private final DossierService dossierService;

    // ─── Gửi kiểm soát: SAVED/VALIDATED → SUBMITTED ────────────────────────────
    @Transactional
    public WorkflowActionResult submit(UUID id, Integer version) {
        ExpDossier dossier = dossierService.getActiveOrThrow(id);
        dossierService.assertVersion(dossier, version);

        if (dossier.getFStatus() != DossierStatus.SAVED && dossier.getFStatus() != DossierStatus.VALIDATED) {
            throw invalidState(dossier);
        }
        // BIZ-012: phải có ≥ 1 chứng từ hợp lệ
        if (documentRepository.countByDossierIdAndStatus(id, 1) == 0) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.DOSSIER_NO_DOCUMENT,
                    Constants.MessageKey.DOSSIER_NO_DOCUMENT,
                    "Dossier has no document to submit");
        }

        dossier.setFStatus(DossierStatus.SUBMITTED);
        // TODO (out-of-scope): sinh HASH_INFO; assign Checker theo workflow CAPEX_STANDARD; notify Checker
        dossier.setAssignUser(nextAssignee(CacheConstants.CAPEX_WORKFLOW_CODE));
        dossier.setVersion(dossier.getVersion() + 1);
        repository.save(dossier);

        writeApprovalLog(id, ActionRole.MAKER, DossierStatus.SUBMITTED, "Gửi kiểm soát", null);
        return toResult(dossier);
    }

    // ─── Kiểm soát / Phê duyệt ────────────────────────────────────────────────
    @Transactional
    public WorkflowActionResult approve(UUID id, ApproveRequest request) {
        ExpDossier dossier = dossierService.getActiveOrThrow(id);
        // TODO (out-of-scope): xác định actor role từ JWT + kiểm tra SoD (BIZ-001)
        switch (dossier.getFStatus()) {
            case SUBMITTED -> {
                // Checker duyệt → APPROVED (đã kiểm soát)
                dossier.setFStatus(DossierStatus.APPROVED);
                dossier.setAssignUser(nextAssignee(CacheConstants.CAPEX_WORKFLOW_CODE));
                writeApprovalLog(id, ActionRole.CHECKER, DossierStatus.APPROVED, request.getReason(), null);
            }
            case APPROVED -> {
                // Approver duyệt → COMPLETED
                dossier.setFStatus(DossierStatus.COMPLETED);
                dossier.setCompletedDate(java.time.LocalDate.now());
                writeApprovalLog(id, ActionRole.APPROVER, DossierStatus.COMPLETED, request.getReason(), null);
            }
            default -> throw invalidState(dossier);
        }
        dossier.setVersion(dossier.getVersion() + 1);
        repository.save(dossier);
        // TODO (out-of-scope): notify; ghi EXP_DIGITAL_SIGNED nếu có ký số (NOTE-03)
        return toResult(dossier);
    }

    // ─── Từ chối ──────────────────────────────────────────────────────────────
    @Transactional
    public WorkflowActionResult reject(UUID id, RejectRequest request) {
        ExpDossier dossier = dossierService.getActiveOrThrow(id);
        if (dossier.getFStatus() != DossierStatus.SUBMITTED && dossier.getFStatus() != DossierStatus.APPROVED) {
            throw invalidState(dossier);
        }
        ActionRole role = dossier.getFStatus() == DossierStatus.SUBMITTED ? ActionRole.CHECKER : ActionRole.APPROVER;
        dossier.setFStatus(DossierStatus.REJECTED);
        dossier.setVersion(dossier.getVersion() + 1);
        // TODO (out-of-scope): assign lại Maker/Checker theo workflow; notify
        repository.save(dossier);

        writeApprovalLog(id, role, DossierStatus.REJECTED, request.getReason(), null);
        return toResult(dossier);
    }

    // ─── Sao chép hồ sơ → DRAFT ────────────────────────────────────────────────
    @Transactional
    public DossierMutationResult copy(UUID id) {
        ExpDossier src = dossierService.getActiveOrThrow(id);
        ExpDossier copy = new ExpDossier();
        copy.setTreasuryCode(src.getTreasuryCode());
        copy.setTreasuryName(src.getTreasuryName());
        copy.setSendDate(src.getSendDate());
        copy.setDataSourceCode(src.getDataSourceCode());
        copy.setProjectCode(src.getProjectCode());
        copy.setProjectName(src.getProjectName());
        copy.setProjectSpecificCode(src.getProjectSpecificCode());
        copy.setProjectSpecificName(src.getProjectSpecificName());
        copy.setOrganizationCode(src.getOrganizationCode());
        copy.setOrganizationName(src.getOrganizationName());
        copy.setWorkflowCode(CacheConstants.CAPEX_WORKFLOW_CODE);
        copy.setStatus(1);
        copy.setFStatus(DossierStatus.DRAFT);
        copy.setVersion(0);
        copy.setAssignUser("SYSTEM"); // TODO (out-of-scope): từ JWT
        copy.setSla(LocalDateTime.now()); // TODO (out-of-scope): scheduler
        // TODO (out-of-scope): sinh DOSSIER_CODE mới theo sequence
        copy.setDossierCode("EXP/CAPEX/TEMP/" + UUID.randomUUID().toString().substring(0, 8));
        copy = repository.save(copy);
        // TODO: sao chép luôn danh sách chứng từ của hồ sơ gốc
        return DossierMutationResult.builder()
                .id(copy.getId())
                .dossierCode(copy.getDossierCode())
                .fStatus(copy.getFStatus())
                .version(copy.getVersion())
                .build();
    }

    // ─── Lịch sử phê duyệt ──────────────────────────────────────────────────────
    public List<ApprovalLogEntryDto> getApprovalLog(UUID id) {
        dossierService.getActiveOrThrow(id);
        List<ExpApprovalLog> logs = approvalLogRepository.findByDossierIdOrderByActionDateAsc(id);
        List<ApprovalLogEntryDto> dtos = approvalLogMapper.toDtoList(logs);
        dtos.forEach(d -> d.setStateLabel(DossierService.labelOf(d.getStateCode())));
        return dtos;
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private void writeApprovalLog(UUID dossierId, ActionRole role, DossierStatus state, String reason, UUID parentId) {
        ExpApprovalLog logEntry = new ExpApprovalLog();
        logEntry.setDossierId(dossierId);
        // DOSSIER_CODE NOT NULL — lấy từ hồ sơ (cùng transaction nên là entity managed).
        logEntry.setDossierCode(repository.findById(dossierId)
                .map(ExpDossier::getDossierCode).orElse(null));
        // TODO (out-of-scope DEC-07): actionUser/actionUserName lấy từ JWT claim
        logEntry.setActionUser("SYSTEM");
        logEntry.setActionUserName("SYSTEM");
        logEntry.setActionRole(role);
        logEntry.setActionDate(LocalDateTime.now());
        logEntry.setReason(reason != null ? reason : "");
        logEntry.setStateCode(state.name());
        logEntry.setParentId(parentId);
        approvalLogRepository.save(logEntry);
    }

    private String nextAssignee(String workflowCode) {
        // TODO (out-of-scope): tra workflow để xác định user/role bước kế tiếp
        return "SYSTEM";
    }

    private InvalidOperationException invalidState(ExpDossier dossier) {
        return new InvalidOperationException(
                Constants.ErrorCode.DOSSIER_INVALID_STATE,
                Constants.MessageKey.DOSSIER_INVALID_STATE,
                "Invalid state transition from " + dossier.getFStatus(),
                new Object[] { String.valueOf(dossier.getFStatus()) });
    }

    private WorkflowActionResult toResult(ExpDossier dossier) {
        return WorkflowActionResult.builder()
                .dossierId(dossier.getId())
                .fStatus(dossier.getFStatus())
                .fStatusName(DossierService.labelOf(dossier.getFStatus()))
                .assignUser(dossier.getAssignUser())
                .build();
    }
}
