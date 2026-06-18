package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Kiểm soát / Phê duyệt (schema {@code ApproveRequest}).
 * <p>DEC-03: {@code reason} bắt buộc cả khi approve (DB EXP_APPROVAL_LOG.REASON NOT NULL).</p>
 * <p>Field {@code digitalSign} (ký số) là out-of-scope — không hiện thực ở MVP.</p>
 */
@Data
public class ApproveRequest {

    @NotBlank(message = "{dossier.reason.required}")
    @Size(max = 500, message = "{dossier.reason.size}")
    private String reason;

    // TODO (out-of-scope): DigitalSignInfo digitalSign — luồng ký số chưa hiện thực (NOTE-03)
}
