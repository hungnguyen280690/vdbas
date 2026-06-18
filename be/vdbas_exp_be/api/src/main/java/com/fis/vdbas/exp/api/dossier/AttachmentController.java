package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.exp.application.dossier.dto.AttachmentInfoDto;
import com.fis.vdbas.exp.application.dossier.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Đính kèm hồ sơ — {@code /api/v1/exp/capex/dossiers/{dossierId}/attachments}.
 * <p>Chỉ liệt kê & xoá metadata. Upload (lưu/quét file) và Download (stream binary) là
 * OUT-OF-SCOPE — cần FileStorageService + virus scan; chưa hiện thực ở MVP.</p>
 */
@RestController
@RequestMapping("/api/v1/exp/capex/dossiers/{dossierId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService service;

    @GetMapping
    public List<AttachmentInfoDto> list(@PathVariable UUID dossierId) {
        return service.list(dossierId);
    }

    // TODO (out-of-scope): POST upload (multipart) — lưu file + virus scan + magic-byte (VAL-09/VAL-20)
    // TODO (out-of-scope): GET /{attachmentId} download — stream binary từ filePath + audit (BIZ-007)

    @DeleteMapping("/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID dossierId, @PathVariable UUID attachmentId) {
        service.delete(dossierId, attachmentId);
    }
}
