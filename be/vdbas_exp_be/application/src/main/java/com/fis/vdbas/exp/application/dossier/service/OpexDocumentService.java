package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.dossier.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DocumentSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.OpexAddDocumentRequest;
import com.fis.vdbas.exp.application.dossier.mapper.DocumentMapper;
import com.fis.vdbas.exp.application.dossier.mapper.OpexDocumentMapper;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.domain.dossier.ExpDocument;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.lov.ExpDocumentTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service chứng từ trong hồ sơ OPEX (§B1.2) — biến thể cô lập.
 * <p>Khác CAPEX {@code DocumentService}: {@code DOCUMENT_NO} backend sinh
 * ({@code [dossierCode]-[documentTypeCode]-[####]}, GAP-14), {@code DOCUMENT_NAME} auto-fill từ
 * LOV.03, {@code originalAmount} bắt buộc (GAP-09 — đã enforce ở DTO).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OpexDocumentService {

    private final ExpDocumentRepository repository;
    private final OpexDocumentMapper opexMapper;
    private final DocumentMapper documentMapper;
    private final OpexDossierService opexDossierService;
    private final ExpDocumentTypeRepository documentTypeRepository;

    public List<DocumentSummaryDto> list(UUID dossierId) {
        opexDossierService.getActiveOrThrow(dossierId);
        List<ExpDocument> docs = repository.findByDossierIdAndStatusOrderByCreatedAtAsc(dossierId, 1);
        List<DocumentSummaryDto> dtos = documentMapper.toSummaryDtoList(docs);
        int seq = 1;
        for (DocumentSummaryDto dto : dtos) {
            dto.setSeqNo(seq++);
        }
        return dtos;
    }

    public DocumentDetailDto get(UUID dossierId, UUID documentId) {
        opexDossierService.getActiveOrThrow(dossierId);
        return documentMapper.toDetailDto(getOrThrow(dossierId, documentId));
    }

    @Transactional
    public DocumentDetailDto add(UUID dossierId, OpexAddDocumentRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(dossierId);
        opexDossierService.assertEditable(dossier);

        ExpDocument entity = opexMapper.toEntity(request);
        entity.setDossierId(dossierId);
        entity.setStatus(1);
        // TREASURY_NAME NOT NULL — auto-fill từ hồ sơ cha (cùng kho bạc).
        entity.setTreasuryName(dossier.getTreasuryName());
        // DOCUMENT_NAME auto-fill từ loại chứng từ (LOV.03); fallback = code.
        entity.setDocumentName(documentTypeName(request.getDocumentTypeCode()));
        // DOCUMENT_NO backend sinh: [dossierCode]-[documentTypeCode]-[#### từ 0001] (GAP-14).
        entity.setDocumentNo(generateDocumentNo(dossier, request.getDocumentTypeCode(), dossierId));
        entity = repository.save(entity);
        return documentMapper.toDetailDto(entity);
    }

    @Transactional
    public DocumentDetailDto update(UUID dossierId, UUID documentId, OpexAddDocumentRequest request) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(dossierId);
        opexDossierService.assertEditable(dossier);

        ExpDocument entity = getOrThrow(dossierId, documentId);
        opexMapper.updateEntityFromDto(request, entity);
        entity.setDocumentName(documentTypeName(request.getDocumentTypeCode()));
        entity = repository.save(entity);
        return documentMapper.toDetailDto(entity);
    }

    @Transactional
    public void remove(UUID dossierId, UUID documentId) {
        ExpDossier dossier = opexDossierService.getActiveOrThrow(dossierId);
        opexDossierService.assertEditable(dossier);
        getOrThrow(dossierId, documentId);
        repository.softDelete(documentId);
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private ExpDocument getOrThrow(UUID dossierId, UUID documentId) {
        return repository.findByIdAndDossierId(documentId, dossierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.DOCUMENT_NOT_FOUND,
                        Constants.MessageKey.DOCUMENT_NOT_FOUND,
                        Constants.Resource.DOCUMENT,
                        "id",
                        documentId.toString()));
    }

    private String documentTypeName(String documentTypeCode) {
        return documentTypeRepository.findById(documentTypeCode)
                .map(t -> t.getDocumentTypeName())
                .orElse(documentTypeCode);
    }

    /** Sinh DOCUMENT_NO {@code [dossierCode]-[documentTypeCode]-[####]} dựa trên số chứng từ hiện có. */
    private String generateDocumentNo(ExpDossier dossier, String documentTypeCode, UUID dossierId) {
        long next = repository.countByDossierIdAndStatus(dossierId, 1) + 1;
        return String.format("%s-%s-%04d", dossier.getDossierCode(), documentTypeCode, next);
    }
}
