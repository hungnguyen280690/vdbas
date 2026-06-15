package com.fis.vdbas.exp.application.capex.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class DossierCreateRequestDto {
    @NotNull
    private LocalDate sendDate;
    @NotBlank
    private String projectCode;
    private String projectSpecificCode;
    @NotBlank
    private String projectManagementCode;
    @NotBlank
    private String treasuryCode;
    private String dataSourceCode = "MANUAL";
}
