package com.fis.vdbas.exp.application.capex.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.capex.dto.*;
import com.fis.vdbas.exp.application.capex.mapper.AttachmentMapper;
import com.fis.vdbas.exp.application.capex.mapper.DocumentMapper;
import com.fis.vdbas.exp.application.capex.mapper.DossierMapper;
import com.fis.vdbas.exp.domain.capex.*;
import com.fis.vdbas.exp.domain.masterdata.ExpProject;
import com.fis.vdbas.exp.domain.masterdata.ExpProjectManagement;
import com.fis.vdbas.exp.domain.masterdata.ExpProjectManagementRepository;
import com.fis.vdbas.exp.domain.masterdata.ExpProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CapexDossierServiceTest {

    @Mock ExpDossierRepository dossierRepository;
    @Mock ExpDocumentRepository documentRepository;
    @Mock ExpDocumentLineRepository documentLineRepository;
    @Mock ExpArchiveRepository archiveRepository;
    @Mock ExpApprovalLogRepository approvalLogRepository;
    @Mock ExpProjectRepository projectRepository;
    @Mock ExpProjectManagementRepository projectManagementRepository;
    @Mock DossierMapper dossierMapper;
    @Mock DocumentMapper documentMapper;
    @Mock AttachmentMapper attachmentMapper;

    @InjectMocks
    CapexDossierService service;

    UUID dossierId;
    ExpDossier draftDossier;
    DossierHeaderDto headerDto;

    @BeforeEach
    void setUp() {
        dossierId = UUID.randomUUID();
        draftDossier = new ExpDossier();
        draftDossier.setDossierId(dossierId);
        draftDossier.setStateCode("DRAFT");
        draftDossier.setDossierVersion(1);
        draftDossier.setProjectCode("PRJ001");
        draftDossier.setTreasuryCode("0600");
        draftDossier.setDataSourceCode("MANUAL");
        draftDossier.setWorkflowId(1L);

        headerDto = new DossierHeaderDto();
        headerDto.setDossierId(dossierId);
        headerDto.setStateCode("DRAFT");
        headerDto.setDossierVersion(1);
    }

    // ── search ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("search")
    class Search {

        @Test
        @DisplayName("returns paginated summary list with computed totals")
        void search_returnsPaginatedResult() {
            DossierSummaryDto summary = new DossierSummaryDto();
            summary.setDossierId(dossierId);

            when(dossierRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(draftDossier)));
            when(dossierMapper.toSummaryDtoList(anyList()))
                    .thenReturn(List.of(summary));
            when(documentLineRepository.sumPaymentRequestAmountVndByDossierId(dossierId))
                    .thenReturn(BigDecimal.valueOf(1_000_000));
            when(documentRepository.findByDossierId(dossierId))
                    .thenReturn(Collections.emptyList());

            DossierSearchDto criteria = new DossierSearchDto();
            PageResponseDto<DossierSummaryDto> result = service.search(criteria);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTotalAmountVnd())
                    .isEqualByComparingTo(BigDecimal.valueOf(1_000_000));
            assertThat(result.getContent().get(0).getDocumentCount()).isZero();
        }

        @Test
        @DisplayName("null sum from DB is coerced to ZERO")
        void search_nullSumCoercedToZero() {
            DossierSummaryDto summary = new DossierSummaryDto();
            summary.setDossierId(dossierId);

            when(dossierRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(draftDossier)));
            when(dossierMapper.toSummaryDtoList(anyList())).thenReturn(List.of(summary));
            when(documentLineRepository.sumPaymentRequestAmountVndByDossierId(dossierId))
                    .thenReturn(null);
            when(documentRepository.findByDossierId(dossierId)).thenReturn(List.of());

            PageResponseDto<DossierSummaryDto> result = service.search(new DossierSearchDto());
            assertThat(result.getContent().get(0).getTotalAmountVnd())
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        @DisplayName("saves dossier with DRAFT state and returns header DTO")
        void create_savesAndReturnsDto() {
            DossierCreateRequestDto req = new DossierCreateRequestDto();
            req.setSendDate(LocalDate.now());
            req.setProjectCode("PRJ001");
            req.setProjectManagementCode("PM001");
            req.setTreasuryCode("0600");

            ExpProject project = new ExpProject();
            project.setProjectCode("PRJ001");
            project.setProjectName("Test Project");

            ExpProjectManagement pm = new ExpProjectManagement();
            pm.setProjectManagementCode("PM001");
            pm.setProjectManagementName("Ban QLDA 1");

            when(projectRepository.findById("PRJ001")).thenReturn(Optional.of(project));
            when(projectManagementRepository.findById("PM001")).thenReturn(Optional.of(pm));
            when(dossierRepository.count()).thenReturn(0L);
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(draftDossier)).thenReturn(headerDto);

            DossierHeaderDto result = service.create(req);

            assertThat(result.getStateCode()).isEqualTo("DRAFT");
            verify(dossierRepository).save(argThat(d ->
                    "DRAFT".equals(d.getStateCode())
                    && d.getDossierVersion() == 1
                    && d.getStatus() == 1));
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when project not found")
        void create_unknownProject_throws() {
            DossierCreateRequestDto req = new DossierCreateRequestDto();
            req.setProjectCode("UNKNOWN");
            req.setProjectManagementCode("PM001");
            req.setTreasuryCode("0600");
            req.setSendDate(LocalDate.now());

            when(projectRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.create(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update")
    class Update {

        @Test
        @DisplayName("increments version on successful update")
        void update_incrementsVersion() {
            DossierUpdateRequestDto req = new DossierUpdateRequestDto();
            req.setTreasuryCode("0700");
            req.setVersion(1);

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(any())).thenReturn(headerDto);

            service.update(dossierId, req);

            verify(dossierRepository).save(argThat(d -> d.getDossierVersion() == 2));
        }

        @Test
        @DisplayName("throws IllegalStateException on version conflict")
        void update_versionMismatch_throws() {
            DossierUpdateRequestDto req = new DossierUpdateRequestDto();
            req.setVersion(99);

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));

            assertThatThrownBy(() -> service.update(dossierId, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Version conflict");
        }

        @Test
        @DisplayName("throws when dossier is not DRAFT")
        void update_nonDraft_throws() {
            draftDossier.setStateCode("PENDING_CHECK");
            DossierUpdateRequestDto req = new DossierUpdateRequestDto();
            req.setVersion(1);

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));

            assertThatThrownBy(() -> service.update(dossierId, req))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("sets state DELETED and status 0")
        void delete_softDeletes() {
            DeleteRequestDto req = new DeleteRequestDto();
            req.setDeleteReason("Hồ sơ nhập sai thông tin cần xóa");
            req.setConfirmReviewed(true);

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);

            service.delete(dossierId, req);

            verify(dossierRepository).save(argThat(d ->
                    "DELETED".equals(d.getStateCode()) && d.getStatus() == 0));
        }

        @Test
        @DisplayName("throws when confirmReviewed is false")
        void delete_notConfirmed_throws() {
            DeleteRequestDto req = new DeleteRequestDto();
            req.setDeleteReason("reason long enough here");
            req.setConfirmReviewed(false);

            assertThatThrownBy(() -> service.delete(dossierId, req))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── submit ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("submit")
    class Submit {

        @Test
        @DisplayName("transitions DRAFT -> PENDING_CHECK and writes approval log")
        void submit_transitionsToPendingCheck() {
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(any())).thenReturn(headerDto);

            service.submit(dossierId);

            verify(dossierRepository).save(argThat(d -> "PENDING_CHECK".equals(d.getStateCode())));
            verify(approvalLogRepository).save(argThat(l ->
                    "PENDING_CHECK".equals(l.getStateCode())
                    && "Maker".equals(l.getActionRole())));
        }

        @Test
        @DisplayName("throws when dossier not in DRAFT state")
        void submit_nonDraft_throws() {
            draftDossier.setStateCode("PENDING_CHECK");
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));

            assertThatThrownBy(() -> service.submit(dossierId))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── workflow ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("workflow")
    class WorkflowAction {

        @Test
        @DisplayName("CHECK: PENDING_CHECK -> PENDING_APPROVE by Checker")
        void workflow_check() {
            draftDossier.setStateCode("PENDING_CHECK");
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("CHECK");

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(any())).thenReturn(headerDto);

            service.workflow(dossierId, req);

            verify(dossierRepository).save(argThat(d -> "PENDING_APPROVE".equals(d.getStateCode())));
            verify(approvalLogRepository).save(argThat(l -> "Checker".equals(l.getActionRole())));
        }

        @Test
        @DisplayName("APPROVE: PENDING_APPROVE -> APPROVED, sets completedDate")
        void workflow_approve() {
            draftDossier.setStateCode("PENDING_APPROVE");
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("APPROVE");

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(any())).thenReturn(headerDto);

            service.workflow(dossierId, req);

            verify(dossierRepository).save(argThat(d ->
                    "APPROVED".equals(d.getStateCode()) && d.getCompletedDate() != null));
        }

        @Test
        @DisplayName("REJECT from PENDING_CHECK -> CHECK_REJECTED")
        void workflow_rejectFromCheck() {
            draftDossier.setStateCode("PENDING_CHECK");
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("REJECT");
            req.setReason("Thiếu tài liệu chứng minh");

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(any())).thenReturn(headerDto);

            service.workflow(dossierId, req);

            verify(dossierRepository).save(argThat(d -> "CHECK_REJECTED".equals(d.getStateCode())));
        }

        @Test
        @DisplayName("RETURN from PENDING_CHECK -> DRAFT")
        void workflow_returnFromCheck() {
            draftDossier.setStateCode("PENDING_CHECK");
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("RETURN");
            req.setReason("Cần bổ sung thông tin");

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));
            when(dossierRepository.save(any())).thenReturn(draftDossier);
            when(dossierMapper.toHeaderDto(any())).thenReturn(headerDto);

            service.workflow(dossierId, req);

            verify(dossierRepository).save(argThat(d -> "DRAFT".equals(d.getStateCode())));
        }

        @Test
        @DisplayName("unknown action throws IllegalArgumentException")
        void workflow_unknownAction_throws() {
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("INVALID_ACTION");

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));

            assertThatThrownBy(() -> service.workflow(dossierId, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Unknown action");
        }

        @Test
        @DisplayName("CHECK from wrong state throws")
        void workflow_checkFromWrongState_throws() {
            draftDossier.setStateCode("DRAFT");
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("CHECK");

            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(draftDossier));

            assertThatThrownBy(() -> service.workflow(dossierId, req))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── not found ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDetailById throws ResourceNotFoundException for unknown id")
    void getDetailById_notFound_throws() {
        when(dossierRepository.findById(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDetailById(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
