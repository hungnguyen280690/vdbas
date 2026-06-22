package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.dossier.dto.DeleteDossierRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.DossierSearchDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierUpdateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierListResponse;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.mapper.DocumentMapper;
import com.fis.vdbas.exp.application.dossier.mapper.DossierMapper;
import com.fis.vdbas.exp.application.dossier.mapper.OpexDossierMapper;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.dossier.ExpDossierRepository;
import com.fis.vdbas.exp.domain.lov.CommonOrganizationRepository;
import com.fis.vdbas.exp.domain.lov.CommonTreasuryRepository;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpexDossierServiceTest {

    @Mock private ExpDossierRepository repository;
    @Mock private ExpDocumentRepository documentRepository;
    @Mock private OpexDossierMapper opexMapper;
    @Mock private DossierMapper dossierMapper;
    @Mock private DocumentMapper documentMapper;
    @Mock private CommonOrganizationRepository organizationRepository;
    @Mock private CommonTreasuryRepository treasuryRepository;

    @InjectMocks private OpexDossierService service;

    private ExpDossier dossier(DossierStatus status, int version) {
        ExpDossier d = new ExpDossier();
        d.setId(UUID.randomUUID());
        d.setFStatus(status);
        d.setVersion(version);
        d.setDossierCode("EXP/OPEX/ABC");
        d.setOrganizationCode("ORG01");
        d.setTreasuryCode("KB01");
        d.setAssignUser("SYSTEM");
        return d;
    }

    // ─── create ───
    @Test
    void create_savesNewDraftDossier() {
        OpexDossierCreateRequest req = new OpexDossierCreateRequest();
        req.setOrganizationCode("ORG01");
        req.setTreasuryCode("KB01");
        req.setSendDate(LocalDate.now());
        req.setDataSourceCode("THU_CONG");

        ExpDossier mapped = new ExpDossier();
        mapped.setOrganizationCode("ORG01");
        mapped.setTreasuryCode("KB01");
        when(opexMapper.toEntity(req)).thenReturn(mapped);
        when(repository.save(any(ExpDossier.class))).thenAnswer(inv -> {
            ExpDossier e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        DossierMutationResult result = service.create(req);

        assertThat(result.getFStatus()).isEqualTo(DossierStatus.DRAFT);
        assertThat(mapped.getDossierTypeCode()).isEqualTo("OPEX");
        assertThat(mapped.getProjectCode()).isNull();
        assertThat(mapped.getDossierCode()).startsWith("EXP/OPEX/");
        verify(repository).save(any(ExpDossier.class));
    }

    // ─── getDetail ───
    @Test
    void getDetail_notFound_throwsResourceNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndStatus(id, 1)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDetail(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── update ───
    @Test
    void update_ok_savesAndReturnsResult() {
        ExpDossier entity = dossier(DossierStatus.DRAFT, 2);
        when(repository.findByIdAndStatus(entity.getId(), 1)).thenReturn(Optional.of(entity));
        when(repository.saveAndFlush(entity)).thenReturn(entity);

        OpexDossierUpdateRequest req = new OpexDossierUpdateRequest();
        req.setVersion(2);
        req.setOrganizationCode("ORG02");
        req.setTreasuryCode("KB02");
        req.setSendDate(LocalDate.now());

        DossierMutationResult result = service.update(entity.getId(), req);

        assertThat(result.getId()).isEqualTo(entity.getId());
        verify(opexMapper).updateEntityFromDto(req, entity);
        verify(repository).saveAndFlush(entity);
    }

    @Test
    void update_notFound_throwsResourceNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndStatus(id, 1)).thenReturn(Optional.empty());
        OpexDossierUpdateRequest req = new OpexDossierUpdateRequest();
        req.setVersion(0);
        assertThatThrownBy(() -> service.update(id, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_versionConflict_throwsOptimisticLock() {
        ExpDossier entity = dossier(DossierStatus.DRAFT, 5);
        when(repository.findByIdAndStatus(entity.getId(), 1)).thenReturn(Optional.of(entity));
        OpexDossierUpdateRequest req = new OpexDossierUpdateRequest();
        req.setVersion(2); // lệch
        req.setOrganizationCode("ORG02");
        req.setTreasuryCode("KB02");
        req.setSendDate(LocalDate.now());

        assertThatThrownBy(() -> service.update(entity.getId(), req))
                .isInstanceOf(OptimisticLockException.class);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void update_nonEditableState_throwsInvalidOperation() {
        ExpDossier entity = dossier(DossierStatus.APPROVED, 1);
        when(repository.findByIdAndStatus(entity.getId(), 1)).thenReturn(Optional.of(entity));
        OpexDossierUpdateRequest req = new OpexDossierUpdateRequest();
        req.setVersion(1);
        req.setOrganizationCode("ORG02");
        req.setTreasuryCode("KB02");
        req.setSendDate(LocalDate.now());

        assertThatThrownBy(() -> service.update(entity.getId(), req))
                .isInstanceOf(InvalidOperationException.class);
    }

    // ─── delete ───
    @Test
    void delete_softDeletesWithStatusDeleted() {
        ExpDossier entity = dossier(DossierStatus.DRAFT, 0);
        when(repository.findByIdAndStatus(entity.getId(), 1)).thenReturn(Optional.of(entity));
        DeleteDossierRequest req = new DeleteDossierRequest();
        req.setDeleteReason("Xoa nham ho so nay");
        req.setConfirmReviewed(true);

        WorkflowActionResult result = service.delete(entity.getId(), req);

        assertThat(result.getFStatus()).isEqualTo(DossierStatus.DELETED);
        verify(repository).softDeleteOpex(entity.getId());
    }

    @Test
    void delete_nonEditableState_throwsInvalidOperation() {
        ExpDossier entity = dossier(DossierStatus.PENDING_CHECKER, 0);
        when(repository.findByIdAndStatus(entity.getId(), 1)).thenReturn(Optional.of(entity));
        DeleteDossierRequest req = new DeleteDossierRequest();
        req.setDeleteReason("Xoa nham ho so nay");
        req.setConfirmReviewed(true);

        assertThatThrownBy(() -> service.delete(entity.getId(), req))
                .isInstanceOf(InvalidOperationException.class);
        verify(repository, never()).softDeleteOpex(any());
    }

    // ─── search ───
    @Test
    void search_returnsPageResponse() {
        DossierSearchDto criteria = new DossierSearchDto();
        criteria.setPage(0);
        criteria.setSize(20);
        Page<ExpDossier> page = new PageImpl<>(Collections.emptyList());
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        OpexDossierListResponse result = service.search(criteria);

        assertThat(result).isNotNull();
        assertThat(result.getItems()).isEmpty();
        assertThat(result.getPagination().getTotalElements()).isZero();
    }
}
