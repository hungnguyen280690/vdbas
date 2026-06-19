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
 * Đính kèm hồ sơ OPEX — {@code /api/v1/exp/opex/dossiers/{dossierId}/attachments}.
 * <p>MVP: chỉ liệt kê & xoá metadata (tái dùng {@link AttachmentService} — thao tác theo dossierId).
 * Upload (lưu/quét file) + Download (stream binary) + attachment cấp chứng từ = OUT-OF-SCOPE MVP+1.</p>
 */
@RestController
@RequestMapping("/api/v1/exp/opex/dossiers/{dossierId}/attachments")
@RequiredArgsConstructor
public class OpexAttachmentController {

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
