package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DossierSummaryDto {
    private UUID dossierId;
    private String dossierCode;
    private LocalDateTime sendDate;
    private String stateCode;
    private String projectCode;
    private String projectName;
    private String treasuryCode;
    private String dataSourceCode;
    private String createdBy;
    private LocalDateTime createdDate;
    private BigDecimal totalAmountVnd;
    private Integer documentCount;
}
