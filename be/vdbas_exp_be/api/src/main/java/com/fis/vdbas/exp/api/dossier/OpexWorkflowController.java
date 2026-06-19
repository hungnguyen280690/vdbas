package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.OpexApproveRequest;
import com.fis.vdbas.exp.application.dossier.dto.RejectRequest;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.service.OpexDossierWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Luồng phê duyệt OPEX Maker–Checker–Approver — {@code /api/v1/exp/opex/dossiers/{dossierId}} (GAP-03).
 * <p>7 transition đúng contract + copy. Controller cô lập — KHÔNG đụng {@code WorkflowController} (CAPEX).</p>
 * <p>TODO (out-of-scope): enforce role + SoD (BIZ-001) từ JWT; notification; Idempotency-Key.</p>
 */
@RestController
@RequestMapping("/api/v1/exp/opex/dossiers/{dossierId}")
@RequiredArgsConstructor
public class OpexWorkflowController {

    private final OpexDossierWorkflowService service;

    /** submit: DRAFT/REJECTED_BY_CHECKER → PENDING_CHECKER (contract: không có request body). */
    @PostMapping("/submit")
    public WorkflowActionResult submit(@PathVariable UUID dossierId) {
        return service.submit(dossierId);
    }

    /** check: PENDING_CHECKER → CHECKED (body ApproveRequest tuỳ chọn). */
    @PostMapping("/check")
    public WorkflowActionResult check(@PathVariable UUID dossierId,
            @RequestBody(required = false) OpexApproveRequest body) {
        return service.check(dossierId, body);
    }

    /** check-reject: PENDING_CHECKER → CHECK_REJECTED (reason bắt buộc). */
    @PostMapping("/check-reject")
    public WorkflowActionResult checkReject(@PathVariable UUID dossierId,
            @Valid @RequestBody RejectRequest body) {
        return service.checkReject(dossierId, body);
    }

    /** check-return: PENDING_CHECKER → DRAFT (reason bắt buộc). */
    @PostMapping("/check-return")
    public WorkflowActionResult checkReturn(@PathVariable UUID dossierId,
            @Valid @RequestBody RejectRequest body) {
        return service.checkReturn(dossierId, body);
    }

    /** approve: CHECKED/APPROVAL_PENDING → APPROVED (body ApproveRequest tuỳ chọn). */
    @PostMapping("/approve")
    public WorkflowActionResult approve(@PathVariable UUID dossierId,
            @RequestBody(required = false) OpexApproveRequest body) {
        return service.approve(dossierId, body);
    }

    /** approve-reject: CHECKED → APPROVAL_REJECTED (reason bắt buộc). */
    @PostMapping("/approve-reject")
    public WorkflowActionResult approveReject(@PathVariable UUID dossierId,
            @Valid @RequestBody RejectRequest body) {
        return service.approveReject(dossierId, body);
    }

    /** approve-cancel: APPROVAL_PENDING → CHECKED (reason bắt buộc). */
    @PostMapping("/approve-cancel")
    public WorkflowActionResult approveCancel(@PathVariable UUID dossierId,
            @Valid @RequestBody RejectRequest body) {
        return service.approveCancel(dossierId, body);
    }

    /** copy: sao chép hồ sơ thành nháp mới (201). */
    @PostMapping("/copy")
    @ResponseStatus(HttpStatus.CREATED)
    public DossierMutationResult copy(@PathVariable UUID dossierId) {
        return service.copy(dossierId);
    }
}
