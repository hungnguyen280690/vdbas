package com.fis.vdbas.exp.application.capex.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierDeleteDto {

    @NotBlank(message = "{capex_dossier.deleteReason.required}")
    @Size(min = 10, max = 500, message = "{capex_dossier.deleteReason.size}")
    private String deleteReason;

    @NotNull(message = "{capex_dossier.confirmReviewed.required}")
    private Boolean confirmReviewed;
}
