package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.dossier.dto.DeleteDossierRequest;
import com.fis.vdbas.exp.application.dossier.dto.DocumentSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.DossierSearchDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierUpdateRequest;
import com.fis.vdbas.exp.application.dossier.mapper.DocumentMapper;
import com.fis.vdbas.exp.application.dossier.mapper.DossierMapper;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.common.enums.ActionRole;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import com.fis.vdbas.exp.domain.dossier.ExpApprovalLog;
import com.fis.vdbas.exp.domain.dossier.ExpDocument;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.dossier.ExpDossierRepository;
import com.fis.vdbas.exp.domain.lov.CommonOrganizationRepository;
import com.fis.vdbas.exp.domain.lov.CommonTreasuryRepository;
import com.fis.vdbas.exp.domain.lov.ExpProjectRepository;
import com.fis.vdbas.exp.domain.lov.ExpProjectSpecificRepository;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
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
 * Service quản lý CRUD hồ sơ CAPEX.
 * <p>Các giá trị từ JWT (treasuryCode, treasuryName, createdBy...) là out-of-scope — tạm dùng
 * placeholder, đánh dấu {@code // TODO}. DOSSIER_CODE sinh theo sequence cũng out-of-scope.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DossierService {

    /** Trạng thái cho phép Sửa/Xoá (VAL-13). */
    private static final Set<DossierStatus> EDITABLE_STATES = EnumSet.of(DossierStatus.DRAFT, DossierStatus.SAVED);

    /** Khoá sắp xếp theo contract (UPPER_SNAKE) → tên property JPA của {@link ExpDossier}. */
    private static final Map<String, String> SORT_PROPERTY = Map.of(
            "DOSSIER_CODE", "dossierCode",
            "PROJECT_CODE", "projectCode",
            "SEND_DATE", "sendDate",
            "CREATED_DATE", "createdDate",
            "F_STATUS", "fStatus");

    /** Property mặc định khi sortBy trống hoặc không khớp khoá nào — tránh PropertyReferenceException. */
    private static final String DEFAULT_SORT_PROPERTY = "createdDate";

    private final ExpDossierRepository repository;
    private final ExpDocumentRepository documentRepository;
    private final DossierMapper mapper;
    private final DocumentMapper documentMapper;

    // LOV repos để fill tên denormalize (in-scope: dữ liệu có sẵn)
    private final ExpProjectRepository projectRepository;
    private final ExpProjectSpecificRepository projectSpecificRepository;
    private final CommonOrganizationRepository organizationRepository;
    private final CommonTreasuryRepository treasuryRepository;

    // ─── Queries ─────────────────────────────────────────────────────────────

    public PageResponseDto<DossierSummaryDto> search(DossierSearchDto criteria) {
        Sort.Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        String sortKey = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "CREATED_DATE";
        String sortBy = SORT_PROPERTY.getOrDefault(sortKey, DEFAULT_SORT_PROPERTY);
        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));

        Page<ExpDossier> page = repository.findAll(filter(criteria), pageable);

        List<DossierSummaryDto> content = new ArrayList<>();
        for (ExpDossier entity : page.getContent()) {
            DossierSummaryDto dto = mapper.toSummaryDto(entity);
            dto.setFStatusName(labelOf(entity.getFStatus()));
            dto.setDocumentCount((int) documentRepository.countByDossierIdAndStatus(entity.getId(), 1));
            dto.setTotalBaseAmount(documentRepository.sumBaseAmountByDossierId(entity.getId()));
            content.add(dto);
        }

        return PageResponseDto.<DossierSummaryDto>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public DossierDetailDto getDetail(UUID id) {
        ExpDossier entity = getActiveOrThrow(id);
        DossierDetailDto dto = mapper.toDetailDto(entity);
        dto.setFStatusName(labelOf(entity.getFStatus()));

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
    public DossierMutationResult create(DossierCreateRequest request) {
        ExpDossier entity = mapper.toEntity(request);
        applyCreateDefaults(entity, DossierStatus.SAVED);
        fillLovNames(entity);

        entity = repository.save(entity);
        // TODO (out-of-scope): ghi EXP_AUDIT_LOG action=INSERT
        return toMutationResult(entity);
    }

    /** Set các giá trị backend-managed dùng chung cho create. */
    private void applyCreateDefaults(ExpDossier entity, DossierStatus fStatus) {
        // DEC-06: workflow hardcode cho MVP
        entity.setWorkflowCode(CacheConstants.CAPEX_WORKFLOW_CODE);
        entity.setStatus(1);
        entity.setFStatus(fStatus);
        entity.setVersion(0);

        // TODO (out-of-scope): treasuryCode/treasuryName lấy từ JWT claim. Tạm lấy kho bạc đầu tiên
        // trong LOV để thoả FK_DOSSIER_TREASURY (DB enforce FK tới COMMON_TREASURY).
        treasuryRepository.findAll().stream().findFirst().ifPresentOrElse(
                t -> {
                    entity.setTreasuryCode(t.getTreasuryCode());
                    entity.setTreasuryName(t.getTreasuryName());
                },
                () -> {
                    entity.setTreasuryCode("UNKNOWN");
                    entity.setTreasuryName("UNKNOWN");
                });
        entity.setAssignUser("SYSTEM");

        // TODO (out-of-scope): DOSSIER_CODE sinh theo sequence (NOTE — generator riêng)
        entity.setDossierCode("EXP/CAPEX/TEMP/" + UUID.randomUUID().toString().substring(0, 8));

        // TODO (out-of-scope): SLA do scheduler tính — tạm set thời điểm hiện tại
        entity.setSla(LocalDateTime.now());
    }

    @Transactional
    public DossierMutationResult update(UUID id, DossierUpdateRequest request) {
        ExpDossier entity = getActiveOrThrow(id);
        assertEditable(entity);
        assertVersion(entity, request.getVersion());

        mapper.updateEntityFromDto(request, entity);
        fillLovNames(entity);
        // saveAndFlush để @Version tăng ngay (flush trước commit) → response mang version mới,
        // client dùng cho lần cập nhật/submit kế tiếp.
        entity = repository.saveAndFlush(entity);
        // TODO (out-of-scope): ghi EXP_AUDIT_LOG oldValue→newValue
        return toMutationResult(entity);
    }

    @Transactional
    public void delete(UUID id, DeleteDossierRequest request) {
        ExpDossier entity = getActiveOrThrow(id);
        assertEditable(entity);
        repository.softDelete(id);
        // TODO (out-of-scope): ghi EXP_AUDIT_LOG action=DELETE với deleteReason
        log.info("Soft-deleted dossier {} (reason: {})", id, request.getDeleteReason());
    }

    // ─── Helpers (package-private dùng lại bởi workflow/document service) ───────

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

    static String labelOf(DossierStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            // ── CAPEX ──
            case DRAFT -> "Lưu nháp";
            case SAVED -> "Đã lưu";
            case VALIDATED -> "Đã kiểm tra";
            case SUBMITTED -> "Đã gửi kiểm soát";
            case APPROVED -> "Đã phê duyệt";
            case REJECTED -> "Đã từ chối";
            case COMPLETED -> "Đã hoàn thành";
            case CANCELLED -> "Đã huỷ";
            // ── OPEX (GAP-02) ──
            case PENDING_CHECKER -> "Chờ kiểm soát";
            case CHECKED -> "Đã kiểm soát";
            case APPROVAL_PENDING -> "Chờ phê duyệt";
            case APPROVAL_REJECTED -> "Phê duyệt từ chối";
            case CHECK_REJECTED -> "Kiểm soát từ chối";
            case CHECK_CANCELLED -> "Kiểm soát huỷ";
            case APPROVAL_CANCELLED -> "Phê duyệt huỷ";
            case REJECTED_BY_CHECKER -> "Bị kiểm soát trả lại";
            case DELETED -> "Đã xoá";
        };
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

    /** Fill các tên LOV denormalize từ code (in-scope — dữ liệu LOV có sẵn). */
    private void fillLovNames(ExpDossier entity) {
        if (entity.getProjectCode() != null) {
            projectRepository.findById(entity.getProjectCode())
                    .ifPresent(p -> entity.setProjectName(p.getProjectName()));
        }
        if (entity.getProjectSpecificCode() != null) {
            projectSpecificRepository.findById(entity.getProjectSpecificCode())
                    .ifPresent(s -> entity.setProjectSpecificName(s.getProjectSpecificName()));
        }
        if (entity.getOrganizationCode() != null) {
            organizationRepository.findById(entity.getOrganizationCode())
                    .ifPresent(o -> entity.setOrganizationName(o.getOrganizationName()));
        }
        // Fallback tên khi LOV không tìm thấy
        if (entity.getProjectCode() != null && entity.getProjectName() == null) {
            entity.setProjectName(entity.getProjectCode());
        }
        if (entity.getOrganizationCode() != null && entity.getOrganizationName() == null) {
            entity.setOrganizationName(entity.getOrganizationCode());
        }
    }

    private Specification<ExpDossier> filter(DossierSearchDto c) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 1));

            if (c.getDossierCode() != null && !c.getDossierCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("dossierCode")),
                        c.getDossierCode().toLowerCase() + "%"));
            }
            if (c.getProjectCode() != null && !c.getProjectCode().isBlank()) {
                predicates.add(cb.equal(root.get("projectCode"), c.getProjectCode()));
            }
            if (c.getCreatedBy() != null && !c.getCreatedBy().isBlank()) {
                predicates.add(cb.equal(root.get("createdBy"), c.getCreatedBy()));
            }
            if (c.getSearch() != null && !c.getSearch().isBlank()) {
                String like = "%" + c.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("createdBy")), like),
                        cb.like(cb.lower(root.get("projectName")), like)));
            }
            if (c.getFStatus() != null && !c.getFStatus().isEmpty()) {
                predicates.add(root.get("fStatus").in(c.getFStatus()));
            }
            if (c.getDataSourceCode() != null && !c.getDataSourceCode().isEmpty()) {
                predicates.add(root.get("dataSourceCode").in(c.getDataSourceCode()));
            }
            // Lọc khoảng ngày theo loại ngày người dùng chọn (dateField).
            applyDateRangeFilter(c, root, query, cb, predicates);
            // TODO (out-of-scope): giới hạn theo TREASURY_CODE từ JWT claim
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Lọc khoảng ngày [fromDate, toDate] theo loại ngày {@code dateField}:
     * <ul>
     *   <li>{@code SEND_DATE} (mặc định) → cột {@code SEND_DATE} (LocalDate) trên EXP_DOSSIER.</li>
     *   <li>{@code CREATED_DATE} → cột {@code CREATED_DATE} (LocalDateTime) trên EXP_DOSSIER.</li>
     *   <li>{@code CHECKED_DATE} → ACTION_DATE của bước CHECKER trong EXP_APPROVAL_LOG.</li>
     *   <li>{@code APPROVED_DATE} → ACTION_DATE của bước APPROVER trong EXP_APPROVAL_LOG.</li>
     * </ul>
     */
    private void applyDateRangeFilter(DossierSearchDto c,
                                      Root<ExpDossier> root,
                                      CriteriaQuery<?> query,
                                      CriteriaBuilder cb,
                                      List<Predicate> predicates) {
        LocalDate fromDate = c.getFromDate();
        LocalDate toDate = c.getToDate();
        if (fromDate == null && toDate == null) {
            return;
        }
        String dateField = (c.getDateField() == null || c.getDateField().isBlank())
                ? "SEND_DATE" : c.getDateField().trim().toUpperCase();
        switch (dateField) {
            case "CREATED_DATE" -> {
                // LocalDateTime → so khớp trọn ngày: [from 00:00, (to+1) 00:00).
                if (fromDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(
                            root.<LocalDateTime>get("createdDate"), fromDate.atStartOfDay()));
                }
                if (toDate != null) {
                    predicates.add(cb.lessThan(
                            root.<LocalDateTime>get("createdDate"), toDate.plusDays(1).atStartOfDay()));
                }
            }
            case "CHECKED_DATE" -> predicates.add(
                    approvalDateInRange(root, query, cb, ActionRole.CHECKER, fromDate, toDate));
            case "APPROVED_DATE" -> predicates.add(
                    approvalDateInRange(root, query, cb, ActionRole.APPROVER, fromDate, toDate));
            default -> {
                // SEND_DATE (LocalDate).
                if (fromDate != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("sendDate"), fromDate));
                }
                if (toDate != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.<LocalDate>get("sendDate"), toDate));
                }
            }
        }
    }

    /**
     * EXISTS một bước phê duyệt của {@code role} trên hồ sơ có {@code ACTION_DATE}
     * rơi vào khoảng [fromDate, toDate] (so khớp trọn ngày).
     */
    private Predicate approvalDateInRange(Root<ExpDossier> root,
                                          CriteriaQuery<?> query,
                                          CriteriaBuilder cb,
                                          ActionRole role,
                                          LocalDate fromDate,
                                          LocalDate toDate) {
        Subquery<UUID> sub = query.subquery(UUID.class);
        Root<ExpApprovalLog> logRoot = sub.from(ExpApprovalLog.class);
        sub.select(logRoot.get("dossierId"));
        List<Predicate> subPredicates = new ArrayList<>();
        subPredicates.add(cb.equal(logRoot.get("dossierId"), root.get("id")));
        subPredicates.add(cb.equal(logRoot.get("actionRole"), role));
        if (fromDate != null) {
            subPredicates.add(cb.greaterThanOrEqualTo(
                    logRoot.<LocalDateTime>get("actionDate"), fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            subPredicates.add(cb.lessThan(
                    logRoot.<LocalDateTime>get("actionDate"), toDate.plusDays(1).atStartOfDay()));
        }
        sub.where(subPredicates.toArray(new Predicate[0]));
        return cb.exists(sub);
    }
}
