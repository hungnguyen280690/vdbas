package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.exp.application.dossier.dto.OpexApproveRequest;
import com.fis.vdbas.exp.application.dossier.dto.RejectRequest;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.mapper.ApprovalLogMapper;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import com.fis.vdbas.exp.domain.dossier.ExpApprovalLog;
import com.fis.vdbas.exp.domain.dossier.ExpApprovalLogRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.dossier.ExpDossierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Kiểm chứng state machine OPEX 7 transition (GAP-03): MỖI transition có cả happy-path VÀ
 * negative (state nguồn không hợp lệ → {@link InvalidOperationException}).
 */
@ExtendWith(MockitoExtension.class)
class OpexDossierWorkflowServiceTest {

    @Mock private ExpDossierRepository repository;
    @Mock private ExpDocumentRepository documentRepository;
    @Mock private ExpApprovalLogRepository approvalLogRepository;
    @Mock private ApprovalLogMapper approvalLogMapper;
    @Mock private OpexDossierService opexDossierService;

    @InjectMocks private OpexDossierWorkflowService service;

    private ExpDossier dossier(DossierStatus status) {
        ExpDossier d = new ExpDossier();
        d.setId(UUID.randomUUID());
        d.setFStatus(status);
        d.setVersion(1);
        d.setDossierCode("EXP/OPEX/ABC");
        d.setAssignUser("SYSTEM");
        return d;
    }

    private void stub(ExpDossier d) {
        when(opexDossierService.getActiveOrThrow(d.getId())).thenReturn(d);
    }

    // ─── submit ───
    @Test
    void submit_fromDraft_movesToPendingChecker() {
        ExpDossier d = dossier(DossierStatus.DRAFT);
        stub(d);
        when(documentRepository.countByDossierIdAndStatus(d.getId(), 1)).thenReturn(1L);

        WorkflowActionResult r = service.submit(d.getId());

        assertThat(r.getFStatus()).isEqualTo(DossierStatus.PENDING_CHECKER);
        assertThat(d.getFStatus()).isEqualTo(DossierStatus.PENDING_CHECKER);
        verify(repository).save(d);
        verify(approvalLogRepository).save(org.mockito.ArgumentMatchers.any(ExpApprovalLog.class));
    }

    @Test
    void submit_fromRejectedByChecker_movesToPendingChecker() {
        ExpDossier d = dossier(DossierStatus.REJECTED_BY_CHECKER);
        stub(d);
        when(documentRepository.countByDossierIdAndStatus(d.getId(), 1)).thenReturn(2L);

        WorkflowActionResult r = service.submit(d.getId());

        assertThat(r.getFStatus()).isEqualTo(DossierStatus.PENDING_CHECKER);
    }

    @Test
    void submit_withoutDocument_throws() {
        ExpDossier d = dossier(DossierStatus.DRAFT);
        stub(d);
        when(documentRepository.countByDossierIdAndStatus(d.getId(), 1)).thenReturn(0L);

        assertThatThrownBy(() -> service.submit(d.getId()))
                .isInstanceOf(InvalidOperationException.class);
    }

    @Test
    void submit_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.APPROVED);
        stub(d);
        assertThatThrownBy(() -> service.submit(d.getId()))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── check ───
    @Test
    void check_fromPendingChecker_movesToChecked() {
        ExpDossier d = dossier(DossierStatus.PENDING_CHECKER);
        stub(d);
        WorkflowActionResult r = service.check(d.getId(), new OpexApproveRequest());
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.CHECKED);
        verify(repository).save(d);
    }

    @Test
    void check_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.DRAFT);
        stub(d);
        assertThatThrownBy(() -> service.check(d.getId(), null))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── check-reject ───
    @Test
    void checkReject_fromPendingChecker_movesToCheckRejected() {
        ExpDossier d = dossier(DossierStatus.PENDING_CHECKER);
        stub(d);
        WorkflowActionResult r = service.checkReject(d.getId(), reject());
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.CHECK_REJECTED);
    }

    @Test
    void checkReject_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.CHECKED);
        stub(d);
        assertThatThrownBy(() -> service.checkReject(d.getId(), reject()))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── check-return ───
    @Test
    void checkReturn_fromPendingChecker_movesToDraft() {
        ExpDossier d = dossier(DossierStatus.PENDING_CHECKER);
        stub(d);
        WorkflowActionResult r = service.checkReturn(d.getId(), reject());
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.DRAFT);
    }

    @Test
    void checkReturn_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.APPROVED);
        stub(d);
        assertThatThrownBy(() -> service.checkReturn(d.getId(), reject()))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── approve ───
    @Test
    void approve_fromChecked_movesToApproved() {
        ExpDossier d = dossier(DossierStatus.CHECKED);
        stub(d);
        WorkflowActionResult r = service.approve(d.getId(), new OpexApproveRequest());
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.APPROVED);
        assertThat(d.getCompletedDate()).isNotNull();
    }

    @Test
    void approve_fromApprovalPending_movesToApproved() {
        ExpDossier d = dossier(DossierStatus.APPROVAL_PENDING);
        stub(d);
        WorkflowActionResult r = service.approve(d.getId(), null);
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.APPROVED);
    }

    @Test
    void approve_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.DRAFT);
        stub(d);
        assertThatThrownBy(() -> service.approve(d.getId(), null))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── approve-reject ───
    @Test
    void approveReject_fromChecked_movesToApprovalRejected() {
        ExpDossier d = dossier(DossierStatus.CHECKED);
        stub(d);
        WorkflowActionResult r = service.approveReject(d.getId(), reject());
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.APPROVAL_REJECTED);
    }

    @Test
    void approveReject_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.APPROVAL_PENDING);
        stub(d);
        assertThatThrownBy(() -> service.approveReject(d.getId(), reject()))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── approve-cancel ───
    @Test
    void approveCancel_fromApprovalPending_movesToChecked() {
        ExpDossier d = dossier(DossierStatus.APPROVAL_PENDING);
        stub(d);
        WorkflowActionResult r = service.approveCancel(d.getId(), reject());
        assertThat(r.getFStatus()).isEqualTo(DossierStatus.CHECKED);
    }

    @Test
    void approveCancel_fromInvalidState_throws() {
        ExpDossier d = dossier(DossierStatus.CHECKED);
        stub(d);
        assertThatThrownBy(() -> service.approveCancel(d.getId(), reject()))
                .isInstanceOf(InvalidOperationException.class);
    }

    private RejectRequest reject() {
        RejectRequest r = new RejectRequest();
        r.setReason("Ly do tu choi hop le >=10");
        return r;
    }
}
