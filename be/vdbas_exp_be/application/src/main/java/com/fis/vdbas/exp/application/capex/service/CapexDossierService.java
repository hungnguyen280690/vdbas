package com.fis.vdbas.exp.application.capex.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierDto;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierSearchDto;
import com.fis.vdbas.exp.application.capex.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDeleteDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierHeaderDto;
import com.fis.vdbas.exp.application.capex.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.capex.dto.WorkflowActionDto;
import com.fis.vdbas.exp.application.capex.mapper.CapexDossierMapper;
import com.fis.vdbas.exp.application.capex.mapper.ExpApprovalLogMapper;
import com.fis.vdbas.exp.application.capex.mapper.ExpArchiveMapper;
import com.fis.vdbas.exp.application.capex.mapper.ExpDocumentMapper;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.common.enums.DossierStateCode;
import com.fis.vdbas.exp.domain.approval.ExpApprovalLog;
import com.fis.vdbas.exp.domain.approval.ExpApprovalLogRepository;
import com.fis.vdbas.exp.domain.approval.ExpArchiveRepository;
import com.fis.vdbas.exp.domain.capex.CapexDossier;
import com.fis.vdbas.exp.domain.capex.CapexDossierRepository;
import com.fis.vdbas.exp.domain.document.ExpDocument;
import com.fis.vdbas.exp.domain.document.ExpDocumentLine;
import com.fis.vdbas.exp.domain.document.ExpDocumentLineRepository;
import com.fis.vdbas.exp.domain.document.ExpDocumentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CapexDossierService {

    private final CapexDossierRepository repository;
    private final CapexDossierMapper capexDossierMapper;
    private final ExpDocumentRepository documentRepository;
    private final ExpDocumentLineRepository documentLineRepository;
    private final ExpApprovalLogRepository approvalLogRepository;
    private final ExpArchiveRepository archiveRepository;
    private final ExpDocumentMapper expDocumentMapper;
    private final ExpApprovalLogMapper expApprovalLogMapper;
    private final ExpArchiveMapper expArchiveMapper;

    // ─── Queries ───────────────────────────────────────────────────────────────

    public PageResponseDto<DossierSummaryDto> search(CapexDossierSearchDto criteria) {
        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "createdAt";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<CapexDossier> page = repository.findAll(filter(criteria), pageable);

        List<UUID> dossierIds = page.getContent().stream().map(CapexDossier::getDossierId).toList();
        Map<UUID, Long> docCounts = buildDocCountMap(dossierIds);
        Map<UUID, BigDecimal> amountMap = buildAmountMap(dossierIds);

        List<DossierSummaryDto> summaries = page.getContent().stream().map(e -> {
            DossierSummaryDto dto = capexDossierMapper.toSummaryDto(e);
            dto.setDocumentCount(docCounts.getOrDefault(e.getDossierId(), 0L));
            dto.setTotalAmountVnd(amountMap.getOrDefault(e.getDossierId(), BigDecimal.ZERO));
            return dto;
        }).toList();

        return PageResponseDto.<DossierSummaryDto>builder()
                .content(summaries)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public DossierDetailDto get(UUID id) {
        CapexDossier entity = findActiveOrThrow(id);

        DossierDetailDto dto = capexDossierMapper.toDetailDto(entity);
        dto.setDocuments(buildDocumentDtos(id));
        dto.setAttachments(archiveRepository.findByDossierId(id).stream()
                .map(expArchiveMapper::toDto).toList());
        dto.setApprovalHistory(approvalLogRepository.findByDossierIdOrderByActionDateDesc(id).stream()
                .map(expApprovalLogMapper::toDto).toList());
        return dto;
    }

    public List<DocumentDetailDto> getDocuments(UUID id) {
        findActiveOrThrow(id);
        return buildDocumentDtos(id);
    }

    // ─── Commands ──────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = CacheConstants.CAPEX_DOSSIER_CACHE, allEntries = true)
    public DossierHeaderDto create(CapexDossierDto input) {
        CapexDossier entity = capexDossierMapper.toEntity(input);
        entity.setStateCode(DossierStateCode.DRAFT.name());
        entity.setDataSourceCode(input.getDataSourceCode() != null ? input.getDataSourceCode() : "MANUAL");
        entity.setSendDate(input.getSendDate() != null ? input.getSendDate() : LocalDate.now());
        entity.setWorkflowId(1L); // Set a dummy workflow ID
        if (entity.getTreasuryCode() == null) {
            entity.setTreasuryCode("0012");
        }
        entity = repository.save(entity);

        // Generate code after first save so we have the ID
        entity.setDossierCode(generateDossierCode(entity.getDossierId()));
        entity = repository.save(entity);

        return capexDossierMapper.toHeaderDto(entity);
    }

    @Transactional
    @CacheEvict(value = CacheConstants.CAPEX_DOSSIER_CACHE, allEntries = true)
    public DossierHeaderDto update(UUID id, CapexDossierDto input) {
        CapexDossier entity = findDraftOrThrow(id);
        capexDossierMapper.updateEntityFromDto(input, entity);
        return capexDossierMapper.toHeaderDto(repository.save(entity));
    }

    @Transactional
    @CacheEvict(value = CacheConstants.CAPEX_DOSSIER_CACHE, allEntries = true)
    public void delete(UUID id, DossierDeleteDto deleteRequest) {
        CapexDossier entity = findDraftOrThrow(id);

        if (Boolean.TRUE.equals(deleteRequest.getConfirmReviewed())) {
            entity.setDeleteReason(deleteRequest.getDeleteReason());
            entity.setDeleted(FLAG_TRUE);
            entity.setStateCode(DossierStateCode.DELETED.name());
            entity.setEndDate(LocalDateTime.now());
            repository.save(entity);
        } else {
            throw new InvalidOperationException(
                    Constants.ErrorCode.CAPEX_DOSSIER_INVALID_STATE,
                    Constants.MessageKey.CAPEX_DOSSIER_INVALID_STATE,
                    "Confirmation not provided");
        }
    }

    @Transactional
    @CacheEvict(value = CacheConstants.CAPEX_DOSSIER_CACHE, allEntries = true)
    public void submit(UUID id) {
        CapexDossier entity = findDraftOrThrow(id);
        entity.setStateCode(DossierStateCode.PENDING_CHECK.name());
        repository.save(entity);
        writeApprovalLog(id, "MAKER", DossierStateCode.PENDING_CHECK.name(), null);
    }

    @Transactional
    @CacheEvict(value = CacheConstants.CAPEX_DOSSIER_CACHE, allEntries = true)
    public void executeWorkflow(UUID id, WorkflowActionDto action) {
        CapexDossier entity = findActiveOrThrow(id);
        String currentState = entity.getStateCode();
        String nextState = resolveNextState(currentState, action.getAction());
        entity.setStateCode(nextState);
        repository.save(entity);
        writeApprovalLog(id, resolveRole(currentState), nextState, action.getReason());
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private Map<UUID, Long> buildDocCountMap(List<UUID> dossierIds) {
        if (dossierIds.isEmpty()) {
            return Map.of();
        }
        return documentRepository.countByDossierIdIn(dossierIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
    }

    private Map<UUID, BigDecimal> buildAmountMap(List<UUID> dossierIds) {
        if (dossierIds.isEmpty()) {
            return Map.of();
        }
        return documentLineRepository.sumAmountVndByDossierIdIn(dossierIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (BigDecimal) row[1]));
    }

    private List<DocumentDetailDto> buildDocumentDtos(UUID dossierId) {
        List<ExpDocument> documents = documentRepository.findByDossierId(dossierId);
        List<UUID> docIds = documents.stream().map(ExpDocument::getDocumentId).toList();

        Map<UUID, List<ExpDocumentLine>> linesByDocId = docIds.isEmpty() ? Map.of()
                : documentLineRepository.findByDocumentIdIn(docIds).stream()
                        .collect(Collectors.groupingBy(ExpDocumentLine::getDocumentId));

        return documents.stream().map(doc -> {
            DocumentDetailDto docDto = expDocumentMapper.toDto(doc);
            List<ExpDocumentLine> lines = linesByDocId.getOrDefault(doc.getDocumentId(), List.of());
            docDto.setPaymentRequestAmount(sumAmount(lines, false));
            docDto.setPaymentRequestAmountVnd(sumAmount(lines, true));
            docDto.setLines(lines.stream().map(expDocumentMapper::toLineDto).toList());
            return docDto;
        }).toList();
    }

    private BigDecimal sumAmount(List<ExpDocumentLine> lines, boolean vnd) {
        return lines.stream()
                .map(l -> vnd
                        ? (l.getPaymentRequestAmountVnd() != null ? l.getPaymentRequestAmountVnd() : BigDecimal.ZERO)
                        : (l.getPaymentRequestAmount() != null ? l.getPaymentRequestAmount() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void writeApprovalLog(UUID dossierId, String role, String stateCode, String reason) {
        ExpApprovalLog logEntry = new ExpApprovalLog();
        logEntry.setDossierId(dossierId);
        logEntry.setActionRole(role);
        logEntry.setStateCode(stateCode);
        logEntry.setReason(reason);
        logEntry.setActionDate(LocalDateTime.now());
        logEntry.setCreatedDate(LocalDateTime.now());
        logEntry.setActionUser("system");
        approvalLogRepository.save(logEntry);
    }

    private String resolveRole(String currentState) {
        return DossierStateCode.PENDING_CHECK.name().equals(currentState) ? "CHECKER" : "APPROVER";
    }

    private CapexDossier findDraftOrThrow(UUID id) {
        CapexDossier entity = findActiveOrThrow(id);
        if (!DossierStateCode.DRAFT.name().equals(entity.getStateCode())) {
            throw new InvalidOperationException(
                    Constants.ErrorCode.CAPEX_DOSSIER_INVALID_STATE,
                    Constants.MessageKey.CAPEX_DOSSIER_INVALID_STATE,
                    "Operation not allowed in state: " + entity.getStateCode(),
                    new Object[]{entity.getStateCode()});
        }
        return entity;
    }

    private CapexDossier findActiveOrThrow(UUID id) {
        return repository.findByDossierIdAndDeleted(id, FLAG_FALSE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.CAPEX_DOSSIER_NOT_FOUND,
                        Constants.MessageKey.CAPEX_DOSSIER_NOT_FOUND,
                        Constants.Resource.CAPEX_DOSSIER,
                        "dossierId",
                        id.toString()));
    }

    private String resolveNextState(String currentState, String action) {
        return switch (action) {
            case "CHECK" -> {
                if (!DossierStateCode.PENDING_CHECK.name().equals(currentState)) {
                    throw invalidWorkflow(action, currentState);
                }
                yield DossierStateCode.PENDING_APPROVE.name();
            }
            case "APPROVE" -> {
                if (!DossierStateCode.PENDING_APPROVE.name().equals(currentState)) {
                    throw invalidWorkflow(action, currentState);
                }
                yield DossierStateCode.APPROVED.name();
            }
            case "REJECT" -> switch (currentState) {
                case "PENDING_CHECK"   -> DossierStateCode.CHECK_REJECTED.name();
                case "PENDING_APPROVE" -> DossierStateCode.APPROVE_REJECTED.name();
                default -> throw invalidWorkflow(action, currentState);
            };
            case "RETURN" -> switch (currentState) {
                case "PENDING_CHECK"   -> DossierStateCode.CHECK_CANCELLED.name();
                case "PENDING_APPROVE" -> DossierStateCode.APPROVE_CANCELLED.name();
                default -> throw invalidWorkflow(action, currentState);
            };
            default -> throw new InvalidOperationException(
                    Constants.ErrorCode.CAPEX_DOSSIER_INVALID_WORKFLOW,
                    Constants.MessageKey.CAPEX_DOSSIER_INVALID_WORKFLOW,
                    "Unknown workflow action: " + action);
        };
    }

    private InvalidOperationException invalidWorkflow(String action, String currentState) {
        return new InvalidOperationException(
                Constants.ErrorCode.CAPEX_DOSSIER_INVALID_WORKFLOW,
                Constants.MessageKey.CAPEX_DOSSIER_INVALID_WORKFLOW,
                "Action '" + action + "' is not allowed in state: " + currentState,
                new Object[]{action, currentState});
    }

    private String generateDossierCode(UUID dossierId) {
        int year = LocalDate.now().getYear();
        String prefix = "EXP/CAPEX/" + year + "/";
        String maxCode = repository.findMaxDossierCodeByYearPrefix(prefix);
        int nextSeq = 1;
        if (maxCode != null && maxCode.startsWith(prefix)) {
            try {
                nextSeq = Integer.parseInt(maxCode.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {
                if (log.isDebugEnabled()) {
                    log.debug("Could not parse sequence from dossier code: {}", maxCode);
                }
            }
        }
        return prefix + String.format("%05d", nextSeq);
    }

    private Specification<CapexDossier> filter(CapexDossierSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getDossierCode() != null && !criteria.getDossierCode().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("dossierCode")),
                        "%" + criteria.getDossierCode().toLowerCase() + "%"));
            }

            if (criteria.getProjectCode() != null && !criteria.getProjectCode().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("projectCode")),
                        "%" + criteria.getProjectCode().toLowerCase() + "%"));
            }

            if (criteria.getStateCode() != null && !criteria.getStateCode().isBlank()) {
                predicates.add(cb.equal(root.get("stateCode"), criteria.getStateCode()));
            }

            if (criteria.getDataSourceCode() != null && !criteria.getDataSourceCode().isBlank()) {
                predicates.add(cb.equal(root.get("dataSourceCode"), criteria.getDataSourceCode()));
            }

            if (criteria.getCreatedBy() != null && !criteria.getCreatedBy().isBlank()) {
                predicates.add(cb.equal(root.get("createdBy"), criteria.getCreatedBy()));
            }

            if (criteria.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("sendDate"), criteria.getFromDate()));
            }

            if (criteria.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("sendDate"), criteria.getToDate()));
            }

            if (criteria.getDeleted() != null) {
                predicates.add(cb.equal(root.get("deleted"), capexDossierMapper.booleanToInteger(criteria.getDeleted())));
            } else {
                predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
