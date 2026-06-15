package com.fis.vdbas.exp.application.capex.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class DossierUpdateRequestDto {
    private LocalDate sendDate;
    private String projectCode;
    private String projectSpecificCode;
    private String projectManagementCode;
    private String treasuryCode;
    @NotNull
    private Integer version;
}
