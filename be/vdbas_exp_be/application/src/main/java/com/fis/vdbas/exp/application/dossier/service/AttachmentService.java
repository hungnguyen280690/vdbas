package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.common.exception.ResourceNotFoundException;
import com.fis.vdbas.exp.application.dossier.dto.AttachmentInfoDto;
import com.fis.vdbas.exp.application.dossier.mapper.AttachmentMapper;
import com.fis.vdbas.exp.common.Constants;
import com.fis.vdbas.exp.domain.dossier.ExpDossierAttachment;
import com.fis.vdbas.exp.domain.dossier.ExpDossierAttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service đính kèm hồ sơ — chỉ thao tác metadata.
 * <p>Out-of-scope (cần hiện thực riêng): lưu/quét file vật lý khi upload, stream khi download
 * (xem AttachmentController). Service này hiện chỉ liệt kê & xoá metadata.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AttachmentService {

    private final ExpDossierAttachmentRepository repository;
    private final AttachmentMapper mapper;
    private final DossierService dossierService;

    public List<AttachmentInfoDto> list(UUID dossierId) {
        dossierService.getActiveOrThrow(dossierId);
        List<ExpDossierAttachment> list = repository.findByDossierIdOrderByCreatedAtAsc(dossierId);
        List<AttachmentInfoDto> dtos = mapper.toDtoList(list);
        for (int i = 0; i < dtos.size(); i++) {
            dtos.get(i).setFileSizeDisplay(humanReadable(list.get(i).getFileSize()));
        }
        return dtos;
    }

    @Transactional
    public void delete(UUID dossierId, UUID attachmentId) {
        dossierService.getActiveOrThrow(dossierId);
        ExpDossierAttachment att = repository.findByIdAndDossierId(attachmentId, dossierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.ErrorCode.ATTACHMENT_NOT_FOUND,
                        Constants.MessageKey.ATTACHMENT_NOT_FOUND,
                        Constants.Resource.ATTACHMENT,
                        "id",
                        attachmentId.toString()));
        repository.delete(att);
        // TODO (out-of-scope): xoá file vật lý tại filePath khỏi storage
    }

    private String humanReadable(Long bytes) {
        if (bytes == null) {
            return null;
        }
        if (bytes < 1024) {
            return bytes + " B";
        }
        double kb = bytes / 1024.0;
        if (kb < 1024) {
            return String.format("%.1f KB", kb);
        }
        return String.format("%.1f MB", kb / 1024.0);
    }
}
