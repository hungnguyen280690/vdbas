package com.fis.vdbas.exp.application.dossier.dto;

import com.fis.vdbas.exp.common.enums.DossierStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Chi tiết đầy đủ hồ sơ (schema {@code DossierDetail}). */
@Data
public class DossierDetailDto {

    private UUID id;
    private String dossierCode;
    private Integer version;

    private String treasuryCode;
    private String treasuryName;

    private LocalDate sendDate;
    private String dataSourceCode;
    private String dataSourceName;
    private DossierStatus fStatus;
    private String fStatusName;

    private String dossierTypeCode;
    private String dossierTypeName;
    private String organizationCode;
    private String organizationName;
    private String projectCode;
    private String projectName;
    private String projectSpecificCode;
    private String projectSpecificName;

    private String assignUser;
    private LocalDateTime sla;
    private LocalDate completedDate;

    private String createdBy;
    private LocalDateTime createdDate;
    private String updatedBy;
    private LocalDateTime updatedDate;

    private List<DocumentSummaryDto> documents;
    private Long totalBaseAmount;
}
