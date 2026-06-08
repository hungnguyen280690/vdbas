package com.fis.vdbas.exp.application.capex.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.capex.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierDto;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierSearchDto;
import com.fis.vdbas.exp.application.capex.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierHeaderDto;
import com.fis.vdbas.exp.application.capex.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.capex.dto.WorkflowActionDto;
import com.fis.vdbas.exp.application.capex.mapper.CapexDossierMapper;
import com.fis.vdbas.exp.application.capex.mapper.ExpApprovalLogMapper;
import com.fis.vdbas.exp.application.capex.mapper.ExpArchiveMapper;
import com.fis.vdbas.exp.application.capex.mapper.ExpDocumentMapper;
import com.fis.vdbas.exp.domain.approval.ExpApprovalLog;
import com.fis.vdbas.exp.domain.approval.ExpApprovalLogRepository;
import com.fis.vdbas.exp.domain.approval.ExpArchiveRepository;
import com.fis.vdbas.exp.domain.capex.CapexDossier;
import com.fis.vdbas.exp.domain.capex.CapexDossierRepository;
import com.fis.vdbas.exp.domain.document.ExpDocument;
import com.fis.vdbas.exp.domain.document.ExpDocumentLineRepository;
import com.fis.vdbas.exp.domain.document.ExpDocumentRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CapexDossierServiceTest {

    @Mock CapexDossierRepository repository;
    @Mock CapexDossierMapper capexDossierMapper;
    @Mock ExpDocumentRepository documentRepository;
    @Mock ExpDocumentLineRepository documentLineRepository;
    @Mock ExpApprovalLogRepository approvalLogRepository;
    @Mock ExpArchiveRepository archiveRepository;
    @Mock ExpDocumentMapper expDocumentMapper;
    @Mock ExpApprovalLogMapper expApprovalLogMapper;
    @Mock ExpArchiveMapper expArchiveMapper;

    @InjectMocks CapexDossierService service;

    private UUID dossierId;
    private CapexDossier entity;

    @BeforeEach
    void setUp() {
        dossierId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        entity = new CapexDossier();
        entity.setDossierId(dossierId);
        entity.setDossierCode("EXP/CAPEX/2026/00001");
        entity.setStateCode("DRAFT");
        entity.setProjectName("Dự án Test");
    }

    // ─── search() ────────────────────────────────────────────────────────────

    @Test
    void search_returnsSummaryDtoWithComputedDocumentCountAndAmount() {
        CapexDossierSearchDto criteria = new CapexDossierSearchDto();
        DossierSummaryDto summaryDto = new DossierSummaryDto();
        summaryDto.setDossierId(dossierId);

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(entity)));
        when(capexDossierMapper.toSummaryDto(entity)).thenReturn(summaryDto);
        when(documentRepository.countByDossierIdIn(anyList()))
                .thenReturn(List.<Object[]>of(new Object[]{dossierId, 3L}));
        when(documentLineRepository.sumAmountVndByDossierIdIn(anyList()))
                .thenReturn(List.<Object[]>of(new Object[]{dossierId, BigDecimal.valueOf(5_000_000L)}));

        PageResponseDto<DossierSummaryDto> result = service.search(criteria);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getDocumentCount()).isEqualTo(3L);
        assertThat(result.getContent().get(0).getTotalAmountVnd())
                .isEqualByComparingTo(BigDecimal.valueOf(5_000_000L));
    }

    @Test
    void search_emptyPage_returnsEmptyContent() {
        CapexDossierSearchDto criteria = new CapexDossierSearchDto();

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        PageResponseDto<DossierSummaryDto> result = service.search(criteria);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    // ─── get() ───────────────────────────────────────────────────────────────

    @Test
    void get_returnsDossierDetailWithDocumentsAndApprovalHistory() {
        UUID docId = UUID.randomUUID();
        ExpDocument doc = new ExpDocument();
        doc.setDocumentId(docId);
        doc.setDossierId(dossierId);

        DocumentDetailDto docDto = new DocumentDetailDto();
        docDto.setDocumentId(docId);

        ExpApprovalLog logEntry = new ExpApprovalLog();
        logEntry.setApprovalLogId(UUID.randomUUID());
        logEntry.setDossierId(dossierId);

        ApprovalLogEntryDto logDto = new ApprovalLogEntryDto();
        logDto.setLogId(logEntry.getApprovalLogId());

        DossierDetailDto detailDto = new DossierDetailDto();
        detailDto.setDossierId(dossierId);

        when(repository.findByDossierIdAndDeleted(dossierId, FLAG_FALSE))
                .thenReturn(Optional.of(entity));
        when(capexDossierMapper.toDetailDto(entity)).thenReturn(detailDto);
        when(documentRepository.findByDossierId(dossierId)).thenReturn(List.of(doc));
        when(documentLineRepository.findByDocumentIdIn(List.of(docId))).thenReturn(List.of());
        when(expDocumentMapper.toDto(doc)).thenReturn(docDto);
        when(archiveRepository.findByDossierId(dossierId)).thenReturn(List.of());
        when(approvalLogRepository.findByDossierIdOrderByActionDateDesc(dossierId))
                .thenReturn(List.of(logEntry));
        when(expApprovalLogMapper.toDto(logEntry)).thenReturn(logDto);

        DossierDetailDto result = service.get(dossierId);

        assertThat(result.getDossierId()).isEqualTo(dossierId);
        assertThat(result.getDocuments()).hasSize(1);
        assertThat(result.getDocuments().get(0).getDocumentId()).isEqualTo(docId);
        assertThat(result.getApprovalHistory()).hasSize(1);
        assertThat(result.getAttachments()).isEmpty();
    }

    @Test
    void get_dossierNotFound_throwsResourceNotFoundException() {
        when(repository.findByDossierIdAndDeleted(dossierId, FLAG_FALSE))
                .thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> service.get(dossierId));
    }

    // ─── commands ──────────────────────────────────────────────────────────────

    @Test
    void create_returnsDossierHeaderDto() {
        CapexDossierDto input = new CapexDossierDto();
        input.setProjectCode("7004686");
        input.setProjectManagementCode("1059227");

        DossierHeaderDto headerDto = new DossierHeaderDto();
        headerDto.setDossierId(dossierId);
        headerDto.setStateCode("DRAFT");

        when(repository.save(any(CapexDossier.class))).thenAnswer(inv -> {
            CapexDossier saved = inv.getArgument(0);
            saved.setDossierId(dossierId);
            return saved;
        });
        when(capexDossierMapper.toEntity(input)).thenReturn(entity);
        when(capexDossierMapper.toHeaderDto(any())).thenReturn(headerDto);
        when(repository.findMaxDossierCodeByYearPrefix(any())).thenReturn(null);

        DossierHeaderDto result = service.create(input);

        assertThat(result.getStateCode()).isEqualTo("DRAFT");
        assertThat(result.getDossierId()).isEqualTo(dossierId);
    }

    @Test
    void submit_transitionsToPendingCheckAndWritesApprovalLog() {
        entity.setStateCode("DRAFT");
        when(repository.findByDossierIdAndDeleted(dossierId, FLAG_FALSE))
                .thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.submit(dossierId);

        assertThat(entity.getStateCode()).isEqualTo("PENDING_CHECK");
        ArgumentCaptor<ExpApprovalLog> logCaptor = ArgumentCaptor.forClass(ExpApprovalLog.class);
        verify(approvalLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getStateCode()).isEqualTo("PENDING_CHECK");
        assertThat(logCaptor.getValue().getActionRole()).isEqualTo("MAKER");
        assertThat(logCaptor.getValue().getDossierId()).isEqualTo(dossierId);
    }

    @Test
    void executeWorkflow_checkAction_transitionsToPendingApproveAndWritesLog() {
        entity.setStateCode("PENDING_CHECK");
        WorkflowActionDto action = new WorkflowActionDto();
        action.setAction("CHECK");

        when(repository.findByDossierIdAndDeleted(dossierId, FLAG_FALSE))
                .thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.executeWorkflow(dossierId, action);

        assertThat(entity.getStateCode()).isEqualTo("PENDING_APPROVE");
        ArgumentCaptor<ExpApprovalLog> logCaptor = ArgumentCaptor.forClass(ExpApprovalLog.class);
        verify(approvalLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getStateCode()).isEqualTo("PENDING_APPROVE");
        assertThat(logCaptor.getValue().getActionRole()).isEqualTo("CHECKER");
    }
}
