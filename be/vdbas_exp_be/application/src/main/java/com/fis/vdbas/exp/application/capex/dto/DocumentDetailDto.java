package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class DocumentDetailDto {
    private UUID documentId;
    private String documentNumber;
    private LocalDate documentDate;
    private LocalDate accountingDate;
    private BigDecimal paymentRequestAmount;
    private BigDecimal paymentRequestAmountVnd;
    private String currencyCode;
    private List<DocumentLineDto> lines = new ArrayList<>();
}
