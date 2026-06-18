package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Lưu nháp (schema {@code DossierDraftRequest}).
 * <p>Nháp luôn gắn với một hồ sơ đã tồn tại ({@code dossierId} bắt buộc — FK
 * EXP_DOSSIER_DRAFT.DOSSIER_ID). Các trường còn lại chỉ validate định dạng, không bắt buộc đủ.</p>
 */
@Data
public class DossierDraftRequest {

    @NotNull(message = "{dossier.id.required}")
    private UUID dossierId;

    private LocalDate sendDate;

    @Size(max = 100, message = "{dossier.dossierTypeCode.size}")
    private String dossierTypeCode;

    @Size(max = 100, message = "{dossier.dataSourceCode.size}")
    private String dataSourceCode;

    @Size(max = 100, message = "{dossier.organizationCode.size}")
    private String organizationCode;

    @Size(max = 100, message = "{dossier.projectCode.size}")
    private String projectCode;

    @Size(max = 100, message = "{dossier.projectSpecificCode.size}")
    private String projectSpecificCode;
}
