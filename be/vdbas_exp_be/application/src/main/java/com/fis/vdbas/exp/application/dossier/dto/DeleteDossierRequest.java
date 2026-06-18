package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Xoá mềm hồ sơ (schema {@code DeleteDossierRequest}) — VAL-16. */
@Data
public class DeleteDossierRequest {

    @NotBlank(message = "{dossier.deleteReason.required}")
    @Size(min = 10, max = 500, message = "{dossier.deleteReason.size}")
    private String deleteReason;

    @AssertTrue(message = "{dossier.confirmReviewed.required}")
    private Boolean confirmReviewed;
}
