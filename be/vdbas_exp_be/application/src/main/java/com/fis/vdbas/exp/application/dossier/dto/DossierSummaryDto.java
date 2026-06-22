package com.fis.vdbas.exp.application.dossier.dto;

import com.fis.vdbas.exp.common.enums.DossierStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Tóm tắt hồ sơ trong danh sách (schema {@code DossierSummary}). */
@Data
public class DossierSummaryDto {

    private UUID id;
    private String dossierCode;
    private String treasuryCode;
    private String treasuryName;
    private String projectCode;
    private String projectName;
    private String dataSourceCode;
    private String dataSourceName;
    private LocalDate sendDate;
    private DossierStatus fStatus;
    private String fStatusName;
    private String createdBy;
    private LocalDateTime createdDate;
    private Integer documentCount;
    private Long totalBaseAmount;
}
