package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class DocumentDetailDto {
    private UUID documentId;
    private UUID dossierId;
    private String documentNumber;
    private LocalDate documentDate;
    private LocalDate accountingDate;
    private Long documentTemplateId;
    private String documentTypeCode;
    private Integer fiscalYear;
    private String paymentRequestNo;
    private LocalDate paymentRequestDate;
    private String treasuryCode;
    private String payingTreasuryCode;
    private String paymentTypeCode;
    private String capitalPlanTypeCode;
    private String currencyTypeCode;
    private String exchangeRateTypeCode;
    private LocalDate exchangeRateDate;
    private BigDecimal exchangeRate;
    private String projectItemCode;
    private String projectItemName;
    private String domesticAccount;
    private String domesticBank;
    private String foreignAccount;
    private String foreignBank;
    private Long guaranteeId;
    private String guaranteeNo;
    private BigDecimal guaranteeAmount;
    private BigDecimal guaranteeRemainAmount;
    private LocalDate guaranteeExpiryDate;
    private LocalDate guaranteeRevokedDate;
    private Integer completedWorkloadNo;
    private LocalDate completedWorkloadDate;
    private BigDecimal cumulativeWorkloadPayment;
    private BigDecimal cumulativePaidCapital;
    private BigDecimal advancePaymentAmount;
    private List<DocumentLineDto> lines;
}
