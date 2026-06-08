package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class DocumentLineDto {
    private UUID lineId;
    private String investmentSourceCode;
    private String allocationCriteriaCode;
    private BigDecimal amount;
    private BigDecimal amountVnd;
    private GlSegmentsDto glSegments;
}
