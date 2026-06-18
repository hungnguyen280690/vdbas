package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.exp.application.dossier.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.application.dossier.dto.ApproveRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.RejectRequest;
import com.fis.vdbas.exp.application.dossier.dto.SubmitRequest;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.service.DossierWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Luồng phê duyệt Maker–Checker–Approver — {@code /api/v1/exp/capex/dossiers/{dossierId}}.
 * <p>TODO (out-of-scope): enforce role + SoD (BIZ-001) từ JWT; notification; X-Idempotency-Key.</p>
 */
@RestController
@RequestMapping("/api/v1/exp/capex/dossiers/{dossierId}")
@RequiredArgsConstructor
public class WorkflowController {

    private final DossierWorkflowService service;

    @PostMapping("/submit")
    public WorkflowActionResult submit(@PathVariable UUID dossierId, @Valid @RequestBody SubmitRequest body) {
        return service.submit(dossierId, body.getVersion());
    }

    @PostMapping("/approve")
    public WorkflowActionResult approve(@PathVariable UUID dossierId, @Valid @RequestBody ApproveRequest body) {
        return service.approve(dossierId, body);
    }

    @PostMapping("/reject")
    public WorkflowActionResult reject(@PathVariable UUID dossierId, @Valid @RequestBody RejectRequest body) {
        return service.reject(dossierId, body);
    }

    @PostMapping("/copy")
    @ResponseStatus(HttpStatus.CREATED)
    public DossierMutationResult copy(@PathVariable UUID dossierId) {
        return service.copy(dossierId);
    }

    @GetMapping("/approval-log")
    public List<ApprovalLogEntryDto> approvalLog(@PathVariable UUID dossierId) {
        return service.getApprovalLog(dossierId);
    }
}
