package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Cập nhật hồ sơ (schema {@code DossierUpdateRequest}).
 * {@code version} bắt buộc cho optimistic-lock (VAL-15). Các field immutable
 * (dossierCode, createdBy...) không nhận từ client.
 */
@Data
public class DossierUpdateRequest {

    @NotNull(message = "{dossier.version.required}")
    private Integer version;

    private LocalDate sendDate;

    @Size(max = 100, message = "{dossier.projectCode.size}")
    private String projectCode;

    @Size(max = 100, message = "{dossier.projectSpecificCode.size}")
    private String projectSpecificCode;
}
