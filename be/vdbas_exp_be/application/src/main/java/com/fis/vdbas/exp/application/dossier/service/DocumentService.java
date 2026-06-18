package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.dossier.dto.AddDocumentRequest;
import com.fis.vdbas.exp.application.dossier.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DocumentSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.UpdateDocumentRequest;
import com.fis.vdbas.exp.application.dossier.mapper.DocumentMapper;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.domain.dossier.ExpDocument;
import com.fis.vdbas.exp.domain.dossier.ExpDocumentRepository;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Service quản lý chứng từ trong hồ sơ (§B1.2). */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DocumentService {

    private final ExpDocumentRepository repository;
    private final DocumentMapper mapper;
    private final DossierService dossierService;

    /** Danh sách chứng từ + STT runtime (NOTE-01). */
    public List<DocumentSummaryDto> list(UUID dossierId) {
        dossierService.getActiveOrThrow(dossierId);
        List<ExpDocument> docs = repository.findByDossierIdAndStatusOrderByCreatedAtAsc(dossierId, 1);
        List<DocumentSummaryDto> dtos = mapper.toSummaryDtoList(docs);
        int seq = 1;
        for (DocumentSummaryDto dto : dtos) {
            dto.setSeqNo(seq++);
        }
        return dtos;
    }

    public DocumentDetailDto get(UUID dossierId, UUID documentId) {
        return mapper.toDetailDto(getOrThrow(dossierId, documentId));
    }

    @Transactional
    public DocumentDetailDto add(UUID dossierId, AddDocumentRequest request) {
        ExpDossier dossier = dossierService.getActiveOrThrow(dossierId);
        dossierService.assertEditable(dossier);

        ExpDocument entity = mapper.toEntity(request);
        entity.setDossierId(dossierId);
        entity.setStatus(1);
        // TREASURY_CODE/NAME NOT NULL + FK_DOCUMENT_TREASURY — kế thừa từ hồ sơ cha.
        entity.setTreasuryCode(dossier.getTreasuryCode());
        entity.setTreasuryName(dossier.getTreasuryName());
        // ORIGINAL_AMOUNT NOT NULL — mặc định bằng baseAmount khi client không gửi.
        if (entity.getOriginalAmount() == null) {
            entity.setOriginalAmount(entity.getBaseAmount());
        }
        // TODO: nếu documentName trống → auto-fill theo loại chứng từ (LOV) — tạm dùng documentNo
        if (entity.getDocumentName() == null || entity.getDocumentName().isBlank()) {
            entity.setDocumentName(entity.getDocumentNo());
        }
        entity = repository.save(entity);
        return mapper.toDetailDto(entity);
    }

    @Transactional
    public DocumentDetailDto update(UUID dossierId, UUID documentId, UpdateDocumentRequest request) {
        ExpDossier dossier = dossierService.getActiveOrThrow(dossierId);
        dossierService.assertEditable(dossier);

        ExpDocument entity = getOrThrow(dossierId, documentId);
        mapper.updateEntityFromDto(request, entity);
        entity = repository.save(entity);
        return mapper.toDetailDto(entity);
    }

    @Transactional
    public void remove(UUID dossierId, UUID documentId) {
        ExpDossier dossier = dossierService.getActiveOrThrow(dossierId);
        dossierService.assertEditable(dossier);
        getOrThrow(dossierId, documentId);
        repository.softDelete(documentId);
    }

    private ExpDocument getOrThrow(UUID dossierId, UUID documentId) {
        return repository.findByIdAndDossierId(documentId, dossierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.DOCUMENT_NOT_FOUND,
                        Constants.MessageKey.DOCUMENT_NOT_FOUND,
                        Constants.Resource.DOCUMENT,
                        "id",
                        documentId.toString()));
    }
}
