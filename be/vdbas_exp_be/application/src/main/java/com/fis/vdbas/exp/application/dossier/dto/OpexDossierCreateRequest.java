package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Tạo mới hồ sơ OPEX (schema {@code DossierCreateRequest}) — GAP-04.
 * <p>required theo contract: {@code [organizationCode, treasuryCode, sendDate, dataSourceCode]}.
 * {@code dossierTypeCode} cố định "OPEX" (service set, immutable VAL-17). {@code dossierCode}
 * backend sinh (D4). Tên LOV (treasuryName/organizationName) backend tự fill — không nhận từ client.</p>
 */
@Data
public class OpexDossierCreateRequest {

    @NotBlank(message = "{dossier.organizationCode.required}")
    @Size(max = 100, message = "{dossier.organizationCode.size}")
    private String organizationCode;

    @NotBlank(message = "{dossier.treasuryCode.required}")
    @Size(max = 100, message = "{dossier.treasuryCode.size}")
    private String treasuryCode;

    @NotNull(message = "{dossier.sendDate.required}")
    private LocalDate sendDate;

    @NotBlank(message = "{dossier.dataSourceCode.required}")
    @Size(max = 100, message = "{dossier.dataSourceCode.size}")
    private String dataSourceCode;
}
