package com.fis.vdbas.exp.application.capex.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.capex.dto.*;
import com.fis.vdbas.exp.application.capex.mapper.AttachmentMapper;
import com.fis.vdbas.exp.application.capex.mapper.DocumentMapper;
import com.fis.vdbas.exp.application.capex.mapper.DossierMapper;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.domain.capex.*;
import com.fis.vdbas.exp.domain.masterdata.ExpProject;
import com.fis.vdbas.exp.domain.masterdata.ExpProjectManagement;
import com.fis.vdbas.exp.domain.masterdata.ExpProjectManagementRepository;
import com.fis.vdbas.exp.domain.masterdata.ExpProjectRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CapexDossierService {

    private static final String UPLOAD_DIR =
            System.getProperty("java.io.tmpdir") + "/capex-attachments";

    private final ExpDossierRepository dossierRepository;
    private final ExpDocumentRepository documentRepository;
    private final ExpDocumentLineRepository documentLineRepository;
    private final ExpArchiveRepository archiveRepository;
    private final ExpApprovalLogRepository approvalLogRepository;
    private final ExpProjectRepository projectRepository;
    private final ExpProjectManagementRepository projectManagementRepository;
    private final DossierMapper dossierMapper;
    private final DocumentMapper documentMapper;
    private final AttachmentMapper attachmentMapper;

    public PageResponseDto<DossierSummaryDto> search(DossierSearchDto criteria) {
        Page<ExpDossier> page = dossierRepository.findAll(
                buildSpec(criteria),
                PageRequest.of(criteria.getPage(), criteria.getSize(),
                        Sort.by(Sort.Direction.DESC, "createdAt")));

        List<DossierSummaryDto> content = dossierMapper.toSummaryDtoList(page.getContent());
        content.forEach(dto -> {
            BigDecimal total = documentLineRepository
                    .sumPaymentRequestAmountVndByDossierId(dto.getDossierId());
            dto.setTotalAmountVnd(total != null ? total : BigDecimal.ZERO);
            dto.setDocumentCount(documentRepository.findByDossierId(dto.getDossierId()).size());
        });

        return PageResponseDto.<DossierSummaryDto>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Transactional
    public DossierHeaderDto create(DossierCreateRequestDto req) {
        ExpProject project = projectRepository.findById(req.getProjectCode())
                .orElseThrow(() -> notFound("projectCode", req.getProjectCode()));

        String pmName = projectManagementRepository
                .findById(req.getProjectManagementCode())
                .map(ExpProjectManagement::getProjectManagementName)
                .orElse(null);

        ExpDossier dossier = new ExpDossier();
        dossier.setDossierCode(generateDossierCode());
        dossier.setSendDate(req.getSendDate());
        dossier.setStateCode("DRAFT");
        dossier.setProjectCode(req.getProjectCode());
        dossier.setProjectName(project.getProjectName());
        dossier.setProjectSpecificCode(req.getProjectSpecificCode());
        dossier.setProjectManagementName(pmName);
        dossier.setTreasuryCode(req.getTreasuryCode());
        dossier.setDataSourceCode(req.getDataSourceCode() != null ? req.getDataSourceCode() : "MANUAL");
        dossier.setWorkflowId(1L);
        dossier.setStatus(1);
        dossier.setDossierVersion(1);

        dossier = dossierRepository.save(dossier);
        DossierHeaderDto dto = dossierMapper.toHeaderDto(dossier);
        dto.setProjectManagementCode(req.getProjectManagementCode());
        return dto;
    }

    public DossierDetailDto getDetailById(UUID id) {
        ExpDossier dossier = findOrThrow(id);
        DossierDetailDto dto = dossierMapper.toDetailDto(dossier);

        List<ExpDocument> docs = documentRepository.findByDossierId(id);
        List<DocumentDetailDto> docDtos = documentMapper.toDetailDtoList(docs);
        docDtos.forEach(doc -> doc.setLines(
                documentMapper.toLineDtoList(
                        documentLineRepository.findByDocumentId(doc.getDocumentId()))));
        dto.setDocuments(docDtos);

        List<AttachmentInfoDto> attachDtos = attachmentMapper.toDtoList(
                archiveRepository.findByDossierId(id));
        attachDtos.forEach(a -> a.setDownloadUrl(
                "/api/v1/capex-dossier/" + id + "/attachments/" + a.getArchiveId() + "/download"));
        dto.setAttachments(attachDtos);

        dto.setApprovalHistory(
                approvalLogRepository.findByDossierIdOrderByCreatedDateDesc(id)
                        .stream().map(this::toLogDto).toList());
        return dto;
    }

    @Transactional
    public DossierHeaderDto update(UUID id, DossierUpdateRequestDto req) {
        ExpDossier dossier = findOrThrow(id);
        assertDraft(dossier);
        if (!dossier.getDossierVersion().equals(req.getVersion())) {
            throw new jakarta.persistence.OptimisticLockException(
                    "Version conflict: expected " + dossier.getDossierVersion() + " but got " + req.getVersion());
        }
        if (req.getSendDate() != null) dossier.setSendDate(req.getSendDate());
        if (req.getProjectCode() != null) {
            ExpProject p = projectRepository.findById(req.getProjectCode()).orElseThrow();
            dossier.setProjectCode(req.getProjectCode());
            dossier.setProjectName(p.getProjectName());
        }
        if (req.getProjectSpecificCode() != null)
            dossier.setProjectSpecificCode(req.getProjectSpecificCode());
        if (req.getProjectManagementCode() != null) {
            String pmName = projectManagementRepository
                    .findById(req.getProjectManagementCode())
                    .map(ExpProjectManagement::getProjectManagementName).orElse(null);
            dossier.setProjectManagementName(pmName);
        }
        if (req.getTreasuryCode() != null) dossier.setTreasuryCode(req.getTreasuryCode());
        dossier.setDossierVersion(dossier.getDossierVersion() + 1);
        return dossierMapper.toHeaderDto(dossierRepository.save(dossier));
    }

    @Transactional
    public void delete(UUID id, DeleteRequestDto req) {
        if (!Boolean.TRUE.equals(req.getConfirmReviewed())) {
            throw new InvalidOperationException("CONFIRM_REQUIRED", null, "confirmReviewed must be true");
        }
        ExpDossier dossier = findOrThrow(id);
        assertDraft(dossier);
        dossier.setStateCode("DELETED");
        dossier.setStatus(0);
        dossierRepository.save(dossier);
    }

    @Transactional
    public DossierHeaderDto submit(UUID id) {
        ExpDossier dossier = findOrThrow(id);
        assertDraft(dossier);
        dossier.setStateCode("PENDING_CHECK");
        addLog(dossier, "Maker", "PENDING_CHECK", null);
        return dossierMapper.toHeaderDto(dossierRepository.save(dossier));
    }

    @Transactional
    public DossierHeaderDto workflow(UUID id, WorkflowActionRequestDto req) {
        ExpDossier dossier = findOrThrow(id);
        String from = dossier.getStateCode();
        String to;
        String role;

        switch (req.getAction()) {
            case "CHECK"   -> { assertState(from, "PENDING_CHECK");   to = "PENDING_APPROVE"; role = "Checker"; }
            case "APPROVE" -> { assertState(from, "PENDING_APPROVE"); to = "APPROVED";         role = "Approver";
                                dossier.setCompletedDate(LocalDate.now()); }
            case "REJECT"  -> {
                assertReason(req.getReason());
                if ("PENDING_CHECK".equals(from))   { to = "CHECK_REJECTED";   role = "Checker"; }
                else if ("PENDING_APPROVE".equals(from)) { to = "APPROVE_REJECTED"; role = "Approver"; }
                else throw new InvalidOperationException("INVALID_STATE", null, "Cannot REJECT from state: " + from);
            }
            case "RETURN"  -> {
                assertReason(req.getReason());
                if ("PENDING_CHECK".equals(from))   { to = "DRAFT";         role = "Checker"; }
                else if ("PENDING_APPROVE".equals(from)) { to = "PENDING_CHECK"; role = "Approver"; }
                else throw new InvalidOperationException("INVALID_STATE", null, "Cannot RETURN from state: " + from);
            }
            default -> throw new InvalidOperationException("UNKNOWN_ACTION", null, "Unknown action: " + req.getAction());
        }

        dossier.setStateCode(to);
        addLog(dossier, role, to, req.getReason());
        return dossierMapper.toHeaderDto(dossierRepository.save(dossier));
    }

    public List<DocumentDetailDto> getDocuments(UUID dossierId) {
        findOrThrow(dossierId);
        List<DocumentDetailDto> docs = documentMapper.toDetailDtoList(
                documentRepository.findByDossierId(dossierId));
        docs.forEach(d -> d.setLines(
                documentMapper.toLineDtoList(
                        documentLineRepository.findByDocumentId(d.getDocumentId()))));
        return docs;
    }

    @Transactional
    public AttachmentInfoDto uploadAttachment(UUID dossierId, MultipartFile file,
                                              String archiveType, String description,
                                              LocalDate archiveDate) {
        findOrThrow(dossierId);
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            String unique = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path target = Paths.get(UPLOAD_DIR, unique);
            Files.copy(file.getInputStream(), target);

            ExpArchive archive = new ExpArchive();
            archive.setDossierId(dossierId);
            archive.setFileName(file.getOriginalFilename());
            archive.setFilePath(target.toString());
            archive.setArchiveType(archiveType);
            archive.setDescription(description);
            archive.setArchiveDate(archiveDate);
            archive.setCreatedDate(LocalDateTime.now());
            archive = archiveRepository.save(archive);

            AttachmentInfoDto dto = attachmentMapper.toDto(archive);
            dto.setDownloadUrl("/api/v1/capex-dossier/" + dossierId
                    + "/attachments/" + archive.getArchiveId() + "/download");
            return dto;
        } catch (IOException e) {
            throw new RuntimeException("File upload failed", e);
        }
    }

    @Transactional
    public void deleteAttachment(UUID dossierId, UUID archiveId) {
        ExpDossier dossier = findOrThrow(dossierId);
        assertDraft(dossier);
        ExpArchive archive = archiveRepository.findById(archiveId)
                .orElseThrow(() -> notFound("archiveId", archiveId.toString()));
        archiveRepository.delete(archive);
    }

    public Resource downloadAttachment(UUID dossierId, UUID archiveId) {
        findOrThrow(dossierId);
        ExpArchive archive = archiveRepository.findById(archiveId)
                .orElseThrow(() -> notFound("archiveId", archiveId.toString()));
        return new FileSystemResource(archive.getFilePath());
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private ExpDossier findOrThrow(UUID id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> notFound("dossierId", id.toString()));
    }

    private ResourceNotFoundException notFound(String field, String value) {
        return new ResourceNotFoundException(
                Constants.ErrorCode.DOSSIER_NOT_FOUND,
                Constants.MessageKey.DOSSIER_NOT_FOUND,
                Constants.Resource.DOSSIER, field, value);
    }

    private void assertDraft(ExpDossier dossier) {
        if (!"DRAFT".equals(dossier.getStateCode())) {
            throw new InvalidOperationException("INVALID_STATE", null,
                    "Operation allowed only on DRAFT dossiers, current state: " + dossier.getStateCode());
        }
    }

    private void assertReason(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new InvalidOperationException("REASON_REQUIRED", null, "Reason is required for this action");
        }
        if (reason.trim().length() < 10) {
            throw new InvalidOperationException("REASON_TOO_SHORT", null,
                    "Reason must be at least 10 characters");
        }
    }

    private void assertState(String actual, String expected) {
        if (!expected.equals(actual)) {
            throw new InvalidOperationException("INVALID_STATE", null,
                    "Expected state " + expected + " but was " + actual);
        }
    }

    private String generateDossierCode() {
        long seq = dossierRepository.count() + 1;
        String code = String.format("EXP/CAPEX/%d/%05d", Year.now().getValue(), seq);
        while (dossierRepository.existsByDossierCode(code)) {
            seq++;
            code = String.format("EXP/CAPEX/%d/%05d", Year.now().getValue(), seq);
        }
        return code;
    }

    private void addLog(ExpDossier dossier, String role, String stateCode, String reason) {
        ExpApprovalLog log = new ExpApprovalLog();
        log.setDossierId(dossier.getDossierId());
        log.setActionRole(role);
        log.setStateCode(stateCode);
        log.setReason(reason);
        log.setActionDate(LocalDateTime.now());
        log.setCreatedDate(LocalDateTime.now());
        approvalLogRepository.save(log);
    }

    private ApprovalLogEntryDto toLogDto(ExpApprovalLog log) {
        ApprovalLogEntryDto dto = new ApprovalLogEntryDto();
        dto.setLogId(log.getApprovalLogId());
        dto.setActionUser(log.getActionUser());
        dto.setActionDate(log.getActionDate());
        dto.setActionRole(log.getActionRole());
        dto.setStateCode(log.getStateCode());
        dto.setReason(log.getReason());
        return dto;
    }

    private Specification<ExpDossier> buildSpec(DossierSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.notEqual(root.get("stateCode"), "DELETED"));
            if (criteria.getDossierCode() != null && !criteria.getDossierCode().isBlank())
                predicates.add(cb.like(cb.lower(root.get("dossierCode")),
                        "%" + criteria.getDossierCode().toLowerCase() + "%"));
            if (criteria.getProjectCode() != null && !criteria.getProjectCode().isBlank())
                predicates.add(cb.equal(root.get("projectCode"), criteria.getProjectCode()));
            if (criteria.getStateCode() != null && !criteria.getStateCode().isBlank())
                predicates.add(cb.equal(root.get("stateCode"), criteria.getStateCode()));
            if (criteria.getFromDate() != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("sendDate"), criteria.getFromDate()));
            if (criteria.getToDate() != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("sendDate"), criteria.getToDate()));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
