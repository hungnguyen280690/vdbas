package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DossierHeaderDto {
    private UUID dossierId;
    private String dossierCode;
    private LocalDate sendDate;
    private String stateCode;
    private String projectCode;
    private String projectName;
    private String projectSpecificCode;
    private String projectSpecificName;
    private String projectManagementCode;
    private String projectManagementName;
    private String dataSourceCode;
    private String treasuryCode;
    private String treasuryName;
    private String createdBy;
    private LocalDateTime createdDate;
    private String updatedBy;
    private LocalDateTime updatedDate;
    private Integer version;
}
