package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Từ chối kiểm soát / phê duyệt (schema {@code RejectRequest}) — BIZ-006: lý do ≥ 10 ký tự. */
@Data
public class RejectRequest {

    @NotBlank(message = "{dossier.reason.required}")
    @Size(min = 10, max = 500, message = "{dossier.rejectReason.size}")
    private String reason;
}
