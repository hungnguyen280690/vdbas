package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Cập nhật hồ sơ OPEX (schema {@code DossierUpdateRequest}) — GAP-04.
 * <p>required theo contract: {@code [version, organizationCode, treasuryCode, sendDate]}.
 * {@code dataSourceCode}/{@code dossierTypeCode} immutable (VAL-17) — không nhận ở đây.
 * {@code version} bắt buộc cho optimistic-lock (VAL-15).</p>
 */
@Data
public class OpexDossierUpdateRequest {

    @NotNull(message = "{dossier.version.required}")
    private Integer version;

    @NotBlank(message = "{dossier.organizationCode.required}")
    @Size(max = 100, message = "{dossier.organizationCode.size}")
    private String organizationCode;

    @NotBlank(message = "{dossier.treasuryCode.required}")
    @Size(max = 100, message = "{dossier.treasuryCode.size}")
    private String treasuryCode;

    @NotNull(message = "{dossier.sendDate.required}")
    private LocalDate sendDate;
}
