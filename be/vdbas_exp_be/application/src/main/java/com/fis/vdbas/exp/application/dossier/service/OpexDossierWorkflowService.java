package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.exp.application.dossier.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.OpexApproveRequest;
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
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Luồng phê duyệt OPEX Maker–Checker–Approver — 7 transition đúng contract (GAP-03/D3).
 * <p>Biến thể cô lập: KHÔNG sửa {@link DossierWorkflowService} (CAPEX, switch gộp 3 bước).</p>
 * <pre>
 *   submit        : DRAFT | REJECTED_BY_CHECKER → PENDING_CHECKER   (MAKER)
 *   check         : PENDING_CHECKER             → CHECKED            (CHECKER)
 *   check-reject  : PENDING_CHECKER             → CHECK_REJECTED     (CHECKER)
 *   check-return  : PENDING_CHECKER             → DRAFT              (CHECKER)
 *   approve       : CHECKED | APPROVAL_PENDING  → APPROVED           (APPROVER)
 *   approve-reject: CHECKED                     → APPROVAL_REJECTED  (APPROVER)
 *   approve-cancel: APPROVAL_PENDING            → CHECKED            (APPROVER)
 * </pre>
 * <p>Out-of-scope ({@code // TODO}): role/displayName + SoD (BIZ-001) từ JWT, notification,
 * HASH_INFO khi submit, ký số.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OpexDossierWorkflowService {

    private static final Set<DossierStatus> SUBMIT_FROM =
            EnumSet.of(DossierStatus.DRAFT, DossierStatus.REJECTED_BY_CHECKER);
    private static final Set<DossierStatus> APPROVE_FROM =
            EnumSet.of(DossierStatus.CHECKED, DossierStatus.APPROVAL_PENDING);

    private final ExpDossierRepository repository;
    private final ExpDocumentRepository documentRepository;
    private final ExpApprovalLogRepository approvalLogRepository;
    private final ApprovalLogMapper approvalLogMapper;
    private final OpexDossierService opexDossierService;

    // ─── Maker: gửi kiểm soát ─────────────────────────────────────────────────
    @Transactional
    public WorkflowActionResult submit(UUID id) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, SUBMIT_FROM);
        // BIZ-012: phải có ≥ 1 chứng từ hợp lệ
        if (documentRepository.countByDossierIdAndStatus(id, 1) == 0) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.DOSSIER_NO_DOCUMENT,
                    Constants.MessageKey.DOSSIER_NO_DOCUMENT,
                    "Dossier has no document to submit");
        }
        // TODO (out-of-scope): sinh HASH_INFO; assign Checker theo workflow; notify Checker
        transitionTo(dossier, DossierStatus.PENDING_CHECKER);
        writeApprovalLog(dossier, ActionRole.MAKER, DossierStatus.PENDING_CHECKER, "Gửi kiểm soát");
        return toResult(dossier);
    }

    // ─── Checker ──────────────────────────────────────────────────────────────
    @Transactional
    public WorkflowActionResult check(UUID id, OpexApproveRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, EnumSet.of(DossierStatus.PENDING_CHECKER));
        // TODO (out-of-scope): SoD (BIZ-001) — checker phải khác Maker; assign Approver
        transitionTo(dossier, DossierStatus.CHECKED);
        writeApprovalLog(dossier, ActionRole.CHECKER, DossierStatus.CHECKED, reasonOf(request));
        return toResult(dossier);
    }

    @Transactional
    public WorkflowActionResult checkReject(UUID id, RejectRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, EnumSet.of(DossierStatus.PENDING_CHECKER));
        transitionTo(dossier, DossierStatus.CHECK_REJECTED);
        writeApprovalLog(dossier, ActionRole.CHECKER, DossierStatus.CHECK_REJECTED, request.getReason());
        return toResult(dossier);
    }

    @Transactional
    public WorkflowActionResult checkReturn(UUID id, RejectRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, EnumSet.of(DossierStatus.PENDING_CHECKER));
        transitionTo(dossier, DossierStatus.DRAFT);
        writeApprovalLog(dossier, ActionRole.CHECKER, DossierStatus.DRAFT, request.getReason());
        return toResult(dossier);
    }

    // ─── Approver ───────────────────────────────────────────────────────────────
    @Transactional
    public WorkflowActionResult approve(UUID id, OpexApproveRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, APPROVE_FROM);
        // TODO (out-of-scope): SoD (BIZ-001); downstream accounting/payment; ký số
        transitionTo(dossier, DossierStatus.APPROVED);
        dossier.setCompletedDate(java.time.LocalDate.now());
        repository.save(dossier);
        writeApprovalLog(dossier, ActionRole.APPROVER, DossierStatus.APPROVED, reasonOf(request));
        return toResult(dossier);
    }

    @Transactional
    public WorkflowActionResult approveReject(UUID id, RejectRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, EnumSet.of(DossierStatus.CHECKED));
        transitionTo(dossier, DossierStatus.APPROVAL_REJECTED);
        writeApprovalLog(dossier, ActionRole.APPROVER, DossierStatus.APPROVAL_REJECTED, request.getReason());
        return toResult(dossier);
    }

    @Transactional
    public WorkflowActionResult approveCancel(UUID id, RejectRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(id);
        assertState(dossier, EnumSet.of(DossierStatus.APPROVAL_PENDING));
        transitionTo(dossier, DossierStatus.CHECKED);
        writeApprovalLog(dossier, ActionRole.APPROVER, DossierStatus.CHECKED, request.getReason());
        return toResult(dossier);
    }

    // ─── Sao chép hồ sơ → DRAFT ─────────────────────────────────────────────────
    @Transactional
    public DossierMutationResult copy(UUID id) {
        ExpDossier src = opexDossierService.getActiveOrThrow(id);
        ExpDossier copy = new ExpDossier();
        copy.setTreasuryCode(src.getTreasuryCode());
        copy.setTreasuryName(src.getTreasuryName());
        copy.setSendDate(src.getSendDate());
        copy.setDataSourceCode(src.getDataSourceCode());
        copy.setOrganizationCode(src.getOrganizationCode());
        copy.setOrganizationName(src.getOrganizationName());
        copy.setDossierTypeCode(CacheConstants.OPEX_DOSSIER_TYPE_CODE);
        copy.setWorkflowCode(CacheConstants.OPEX_WORKFLOW_CODE);
        copy.setStatus(1);
        copy.setFStatus(DossierStatus.DRAFT);
        copy.setVersion(0);
        copy.setAssignUser("SYSTEM"); // TODO (out-of-scope): từ JWT
        copy.setSla(LocalDateTime.now()); // TODO (out-of-scope): scheduler
        // TODO (out-of-scope GAP-13): DOSSIER_CODE mới theo sequence OPEX
        copy.setDossierCode("EXP/OPEX/" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        copy = repository.save(copy);
        // TODO (GAP-17): sao chép luôn danh sách chứng từ con của hồ sơ gốc
        return DossierMutationResult.builder()
                .id(copy.getId())
                .dossierCode(copy.getDossierCode())
                .fStatus(copy.getFStatus())
                .version(copy.getVersion())
                .build();
    }

    // ─── Lịch sử phê duyệt ──────────────────────────────────────────────────────
    public List<ApprovalLogEntryDto> getApprovalLog(UUID id) {
        opexDossierService.getActiveOrThrow(id);
        List<ExpApprovalLog> logs = approvalLogRepository.findByDossierIdOrderByActionDateAsc(id);
        List<ApprovalLogEntryDto> dtos = approvalLogMapper.toDtoList(logs);
        dtos.forEach(d -> d.setStateLabel(DossierService.labelOf(d.getStateCode())));
        return dtos;
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private void assertState(ExpDossier dossier, Set<DossierStatus> allowed) {
        if (!allowed.contains(dossier.getFStatus())) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.DOSSIER_INVALID_STATE,
                    Constants.MessageKey.DOSSIER_INVALID_STATE,
                    "Invalid OPEX state transition from " + dossier.getFStatus(),
                    new Object[] { String.valueOf(dossier.getFStatus()) });
        }
    }

    private void transitionTo(ExpDossier dossier, DossierStatus target) {
        dossier.setFStatus(target);
        dossier.setVersion(dossier.getVersion() + 1);
        repository.save(dossier);
    }

    private void writeApprovalLog(ExpDossier dossier, ActionRole role, DossierStatus state, String reason) {
        ExpApprovalLog logEntry = new ExpApprovalLog();
        logEntry.setDossierId(dossier.getId());
        logEntry.setDossierCode(dossier.getDossierCode());
        // TODO (out-of-scope DEC-07): actionUser/actionUserName lấy từ JWT claim
        logEntry.setActionUser("SYSTEM");
        logEntry.setActionUserName("SYSTEM");
        logEntry.setActionRole(role);
        logEntry.setActionDate(LocalDateTime.now());
        logEntry.setReason(reason != null ? reason : "");
        logEntry.setStateCode(state.name());
        approvalLogRepository.save(logEntry);
    }

    private String reasonOf(OpexApproveRequest request) {
        return request != null ? request.getReason() : null;
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
