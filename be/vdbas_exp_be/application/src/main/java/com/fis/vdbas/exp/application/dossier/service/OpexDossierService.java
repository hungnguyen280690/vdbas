package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.dossier.dto.DeleteDossierRequest;
import com.fis.vdbas.exp.application.dossier.dto.DocumentSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.DossierSearchDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierDraftRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierListResponse;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierUpdateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexPaginationDto;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.mapper.DocumentMapper;
import com.fis.vdbas.exp.application.dossier.mapper.DossierMapper;
import com.fis.vdbas.exp.application.dossier.mapper.OpexDossierMapper;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import com.fis.vdbas.exp.domain.dossier.ExpDocument;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.dossier.ExpDossierRepository;
import com.fis.vdbas.exp.domain.lov.CommonOrganizationRepository;
import com.fis.vdbas.exp.domain.lov.CommonTreasuryRepository;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service CRUD hồ sơ OPEX — biến thể cô lập (GAP-01/D1).
 * <p>Tái dùng entity {@link ExpDossier}/repo dùng chung CAPEX nhưng KHÔNG đụng {@link DossierService}
 * (CAPEX). Điểm khác CAPEX: {@code dossierTypeCode='OPEX'}, {@code projectCode=null}, trạng thái
 * khởi tạo DRAFT, soft-delete set DELETED (GAP-07), trạng thái sửa được = {DRAFT, REJECTED_BY_CHECKER}.</p>
 * <p>Out-of-scope ({@code // TODO}): treasuryCode scope/createdBy từ JWT, DOSSIER_CODE theo sequence,
 * SLA scheduler, ghi EXP_AUDIT_LOG.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OpexDossierService {

    /** Trạng thái cho phép Sửa/Xoá hồ sơ OPEX (VAL-13). */
    private static final Set<DossierStatus> EDITABLE_STATES =
            EnumSet.of(DossierStatus.DRAFT, DossierStatus.REJECTED_BY_CHECKER);

    /** Khoá sắp xếp (UPPER_SNAKE từ contract) → property JPA của {@link ExpDossier}. */
    private static final Map<String, String> SORT_PROPERTY = Map.of(
            "DOSSIER_CODE", "dossierCode",
            "SEND_DATE", "sendDate",
            "CREATED_DATE", "createdDate",
            "F_STATUS", "fStatus");

    /** Whitelist camelCase field hợp lệ — FE gửi sort='field,dir' dạng camelCase. */
    private static final Set<String> VALID_SORT_FIELDS = Set.of(
            "dossierCode", "sendDate", "dataSourceCode", "fStatus", "createdDate", "createdBy");

    private static final String DEFAULT_SORT_PROPERTY = "createdDate";

    private final ExpDossierRepository repository;
    private final ExpDocumentRepository documentRepository;
    private final OpexDossierMapper opexMapper;
    private final DossierMapper dossierMapper;
    private final DocumentMapper documentMapper;
    private final CommonOrganizationRepository organizationRepository;
    private final CommonTreasuryRepository treasuryRepository;

    // ─── Queries ─────────────────────────────────────────────────────────────

    public OpexDossierListResponse search(DossierSearchDto criteria) {
        // Parse sort: FE gửi combined 'field,dir' (camelCase) vào param `sort`.
        // Fallback: legacy sortBy (UPPER_SNAKE) + sortDirection nếu `sort` vắng mặt.
        Sort.Direction direction;
        String sortBy;
        if (criteria.getSort() != null && !criteria.getSort().isBlank()) {
            String[] parts = criteria.getSort().split(",", 2);
            String field = parts[0].trim();
            String dir = parts.length > 1 ? parts[1].trim() : "asc";
            sortBy = VALID_SORT_FIELDS.contains(field) ? field : DEFAULT_SORT_PROPERTY;
            direction = "desc".equalsIgnoreCase(dir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        } else {
            direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            String sortKey = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                    ? criteria.getSortBy() : "CREATED_DATE";
            sortBy = SORT_PROPERTY.getOrDefault(sortKey, DEFAULT_SORT_PROPERTY);
        }
        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));

        Page<ExpDossier> page = repository.findAll(filter(criteria), pageable);

        List<DossierSummaryDto> items = new ArrayList<>();
        for (ExpDossier entity : page.getContent()) {
            DossierSummaryDto dto = dossierMapper.toSummaryDto(entity);
            dto.setFStatusName(DossierService.labelOf(entity.getFStatus()));
            dto.setDocumentCount((int) documentRepository.countByDossierIdAndStatus(entity.getId(), 1));
            dto.setTotalBaseAmount(documentRepository.sumBaseAmountByDossierId(entity.getId()));
            items.add(dto);
        }

        // statusCounts: đếm toàn bộ OPEX active theo trạng thái.
        Map<String, Long> statusCounts = new java.util.HashMap<>();
        for (Object[] row : repository.countByStatusForOpex()) {
            DossierStatus status = (DossierStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        OpexPaginationDto pagination = OpexPaginationDto.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();

        return OpexDossierListResponse.builder()
                .items(items)
                .pagination(pagination)
                .statusCounts(statusCounts)
                .build();
    }

    public DossierDetailDto getDetail(UUID id) {
        ExpDossier entity = getActiveOrThrow(id);
        DossierDetailDto dto = dossierMapper.toDetailDto(entity);
        dto.setFStatusName(DossierService.labelOf(entity.getFStatus()));

        List<ExpDocument> docs = documentRepository.findByDossierIdAndStatusOrderByCreatedAtAsc(id, 1);
        List<DocumentSummaryDto> docDtos = documentMapper.toSummaryDtoList(docs);
        int seq = 1;
        long total = 0L;
        for (int i = 0; i < docDtos.size(); i++) {
            docDtos.get(i).setSeqNo(seq++);
            if (docs.get(i).getBaseAmount() != null) {
                total += docs.get(i).getBaseAmount();
            }
        }
        dto.setDocuments(docDtos);
        dto.setTotalBaseAmount(total);
        return dto;
    }

    // ─── Mutations ───────────────────────────────────────────────────────────

    @Transactional
    public DossierMutationResult create(OpexDossierCreateRequest request) {
        ExpDossier entity = opexMapper.toEntity(request);
        applyCreateDefaults(entity);
        fillLovNames(entity);
        entity = repository.save(entity);
        // TODO (out-of-scope): ghi EXP_AUDIT_LOG action=INSERT
        return toMutationResult(entity);
    }

    @Transactional
    public DossierMutationResult saveDraft(OpexDossierDraftRequest request) {
        // Nháp OPEX tạo MỚI hồ sơ DRAFT (không dùng EXP_DOSSIER_DRAFT). Chỉ kiểm định dạng (VAL-02).
        ExpDossier entity = new ExpDossier();
        entity.setOrganizationCode(request.getOrganizationCode());
        entity.setTreasuryCode(request.getTreasuryCode());
        entity.setDataSourceCode(request.getDataSourceCode());
        entity.setSendDate(request.getSendDate() != null ? request.getSendDate() : LocalDate.now());
        applyCreateDefaults(entity);
        fillLovNames(entity);
        entity = repository.save(entity);
        return toMutationResult(entity);
    }

    /** Set giá trị backend-managed dùng chung cho create/draft OPEX. */
    private void applyCreateDefaults(ExpDossier entity) {
        entity.setDossierTypeCode(CacheConstants.OPEX_DOSSIER_TYPE_CODE);
        entity.setProjectCode(null); // CHK_DOSSIER_PROJECT: OPEX không có dự án
        entity.setWorkflowCode(CacheConstants.OPEX_WORKFLOW_CODE);
        entity.setStatus(1);
        entity.setFStatus(DossierStatus.DRAFT);
        entity.setVersion(0);
        // TODO (out-of-scope): assignUser từ JWT; tạm SYSTEM
        entity.setAssignUser("SYSTEM");
        // TODO (out-of-scope GAP-13): DOSSIER_CODE sinh theo sequence OPEX — tạm sinh mã OPEX duy nhất.
        entity.setDossierCode("EXP/OPEX/" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        // TODO (out-of-scope): SLA do scheduler tính
        entity.setSla(LocalDateTime.now());
    }

    @Transactional
    public DossierMutationResult update(UUID id, OpexDossierUpdateRequest request) {
        ExpDossier entity = getActiveOrThrow(id);
        assertEditable(entity);
        assertVersion(entity, request.getVersion());

        opexMapper.updateEntityFromDto(request, entity);
        fillLovNames(entity);
        // saveAndFlush để @Version tăng ngay (client dùng version mới cho thao tác kế tiếp).
        entity = repository.saveAndFlush(entity);
        // TODO (out-of-scope): ghi EXP_AUDIT_LOG oldValue→newValue
        return toMutationResult(entity);
    }

    @Transactional
    public WorkflowActionResult delete(UUID id, DeleteDossierRequest request) {
        ExpDossier entity = getActiveOrThrow(id);
        assertEditable(entity);
        repository.softDeleteOpex(id); // GAP-07: set F_STATUS=DELETED (không CANCELLED như CAPEX)
        // TODO (out-of-scope): ghi EXP_AUDIT_LOG action=DELETE với deleteReason
        log.info("Soft-deleted OPEX dossier {} (reason: {})", id, request.getDeleteReason());
        return WorkflowActionResult.builder()
                .dossierId(id)
                .fStatus(DossierStatus.DELETED)
                .fStatusName(DossierService.labelOf(DossierStatus.DELETED))
                .assignUser(entity.getAssignUser())
                .build();
    }

    // ─── Helpers (package-private — dùng lại bởi workflow/document service OPEX) ─

    ExpDossier getActiveOrThrow(UUID id) {
        return repository.findByIdAndStatus(id, 1)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.DOSSIER_NOT_FOUND,
                        Constants.MessageKey.DOSSIER_NOT_FOUND,
                        Constants.Resource.DOSSIER,
                        "id",
                        id.toString()));
    }

    void assertEditable(ExpDossier entity) {
        if (!EDITABLE_STATES.contains(entity.getFStatus())) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.DOSSIER_INVALID_STATE,
                    Constants.MessageKey.DOSSIER_INVALID_STATE,
                    "Dossier in state " + entity.getFStatus() + " cannot be modified",
                    new Object[] { String.valueOf(entity.getFStatus()) });
        }
    }

    void assertVersion(ExpDossier entity, Integer requestVersion) {
        if (requestVersion == null || !requestVersion.equals(entity.getVersion())) {
            throw new OptimisticLockException(
                    "Dossier " + entity.getId() + " was modified by another session");
        }
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private DossierMutationResult toMutationResult(ExpDossier entity) {
        return DossierMutationResult.builder()
                .id(entity.getId())
                .dossierCode(entity.getDossierCode())
                .fStatus(entity.getFStatus())
                .version(entity.getVersion())
                .build();
    }

    /** Fill tên LOV denormalize từ code (in-scope — LOV có sẵn); fallback = code khi không tìm thấy. */
    private void fillLovNames(ExpDossier entity) {
        if (entity.getOrganizationCode() != null) {
            organizationRepository.findById(entity.getOrganizationCode())
                    .ifPresent(o -> entity.setOrganizationName(o.getOrganizationName()));
            if (entity.getOrganizationName() == null) {
                entity.setOrganizationName(entity.getOrganizationCode());
            }
        }
        if (entity.getTreasuryCode() != null) {
            treasuryRepository.findById(entity.getTreasuryCode())
                    .ifPresent(t -> entity.setTreasuryName(t.getTreasuryName()));
            if (entity.getTreasuryName() == null) {
                entity.setTreasuryName(entity.getTreasuryCode());
            }
        }
    }

    private Specification<ExpDossier> filter(DossierSearchDto c) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 1));
            // Cô lập OPEX: chỉ liệt kê hồ sơ loại OPEX.
            predicates.add(cb.equal(root.get("dossierTypeCode"), CacheConstants.OPEX_DOSSIER_TYPE_CODE));

            if (c.getDossierCode() != null && !c.getDossierCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("dossierCode")),
                        c.getDossierCode().toLowerCase() + "%"));
            }
            if (c.getCreatedBy() != null && !c.getCreatedBy().isBlank()) {
                predicates.add(cb.equal(root.get("createdBy"), c.getCreatedBy()));
            }
            if (c.getFStatus() != null && !c.getFStatus().isEmpty()) {
                predicates.add(root.get("fStatus").in(c.getFStatus()));
            }
            if (c.getDataSourceCode() != null && !c.getDataSourceCode().isEmpty()) {
                predicates.add(root.get("dataSourceCode").in(c.getDataSourceCode()));
            }
            applyDateRangeFilter(c, root, cb, predicates);
            // TODO (out-of-scope): giới hạn theo TREASURY_CODE từ JWT claim
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Lọc khoảng ngày theo {@code dateField}: CREATED_DATE (LocalDateTime) hoặc SEND_DATE (mặc định). */
    private void applyDateRangeFilter(DossierSearchDto c,
                                      jakarta.persistence.criteria.Root<ExpDossier> root,
                                      jakarta.persistence.criteria.CriteriaBuilder cb,
                                      List<Predicate> predicates) {
        LocalDate fromDate = c.getFromDate();
        LocalDate toDate = c.getToDate();
        if (fromDate == null && toDate == null) {
            return;
        }
        String dateField = (c.getDateField() == null || c.getDateField().isBlank())
                ? "SEND_DATE" : c.getDateField().trim().toUpperCase();
        if ("CREATED_DATE".equals(dateField)) {
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.<LocalDateTime>get("createdDate"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThan(
                        root.<LocalDateTime>get("createdDate"), toDate.plusDays(1).atStartOfDay()));
            }
        } else {
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("sendDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDate>get("sendDate"), toDate));
            }
        }
    }
}
