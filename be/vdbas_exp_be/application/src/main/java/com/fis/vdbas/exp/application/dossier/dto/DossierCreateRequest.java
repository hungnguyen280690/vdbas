package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Tạo mới & lưu hồ sơ → SAVED (schema {@code DossierCreateRequest}).
 * Các field LOV_DENORM (treasuryName, projectName...) backend tự fill — không nhận từ client.
 */
@Data
public class DossierCreateRequest {

    @NotNull(message = "{dossier.sendDate.required}")
    private LocalDate sendDate;

    @NotBlank(message = "{dossier.dataSourceCode.required}")
    @Size(max = 100, message = "{dossier.dataSourceCode.size}")
    private String dataSourceCode;

    @NotBlank(message = "{dossier.dossierTypeCode.required}")
    @Size(max = 100, message = "{dossier.dossierTypeCode.size}")
    private String dossierTypeCode;

    @NotBlank(message = "{dossier.organizationCode.required}")
    @Size(max = 100, message = "{dossier.organizationCode.size}")
    private String organizationCode;

    @Size(max = 100, message = "{dossier.projectCode.size}")
    private String projectCode;

    @Size(max = 100, message = "{dossier.projectSpecificCode.size}")
    private String projectSpecificCode;
}
