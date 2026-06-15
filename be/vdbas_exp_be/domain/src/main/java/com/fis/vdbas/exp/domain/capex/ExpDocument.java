package com.fis.vdbas.exp.domain.capex;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "EXP_DOCUMENT")
@Getter
@Setter
@NoArgsConstructor
public class ExpDocument {

    @Id
    @GeneratedValue
    @Column(name = "DOCUMENT_ID", columnDefinition = "RAW(16)", nullable = false, updatable = false)
    private UUID documentId;

    @Column(name = "DOSSIER_ID", columnDefinition = "RAW(16)", nullable = false)
    private UUID dossierId;

    @Column(name = "DOCUMENT_NUMBER", length = 100)
    private String documentNumber;

    @Column(name = "DOCUMENT_DATE")
    private LocalDate documentDate;

    @Column(name = "ACCOUNTING_DATE")
    private LocalDate accountingDate;

    @Column(name = "DOCUMENT_TEMPLATE_ID")
    private Long documentTemplateId;

    @Column(name = "DOCUMENT_TYPE_CODE", length = 100)
    private String documentTypeCode;

    @Column(name = "FISCAL_YEAR")
    private Integer fiscalYear;

    @Column(name = "PAYMENT_REQUEST_NO", length = 100)
    private String paymentRequestNo;

    @Column(name = "PAYMENT_REQUEST_DATE")
    private LocalDate paymentRequestDate;

    @Column(name = "TREASURY_CODE", length = 100)
    private String treasuryCode;

    @Column(name = "PAYING_TREASURY_CODE", length = 100)
    private String payingTreasuryCode;

    @Column(name = "PAYMENT_TYPE_CODE", length = 100)
    private String paymentTypeCode;

    @Column(name = "CAPITAL_PLAN_TYPE_CODE", length = 100)
    private String capitalPlanTypeCode;

    @Column(name = "CURRENCY_TYPE_CODE", length = 100)
    private String currencyTypeCode;

    @Column(name = "EXCHANGE_RATE_TYPE_CODE", length = 100)
    private String exchangeRateTypeCode;

    @Column(name = "EXCHANGE_RATE_DATE")
    private LocalDate exchangeRateDate;

    @Column(name = "EXCHANGE_RATE", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "PROJECT_ITEM_CODE", length = 100)
    private String projectItemCode;

    @Column(name = "PROJECT_ITEM_NAME", length = 500)
    private String projectItemName;

    @Column(name = "DOMESTIC_ACCOUNT", length = 100)
    private String domesticAccount;

    @Column(name = "DOMESTIC_BANK", length = 500)
    private String domesticBank;

    @Column(name = "FOREIGN_ACCOUNT", length = 100)
    private String foreignAccount;

    @Column(name = "FOREIGN_BANK", length = 500)
    private String foreignBank;

    @Column(name = "GUARANTEE_ID")
    private Long guaranteeId;

    @Column(name = "GUARANTEE_NO", length = 100)
    private String guaranteeNo;

    @Column(name = "GUARANTEE_AMOUNT", precision = 19, scale = 2)
    private BigDecimal guaranteeAmount;

    @Column(name = "GUARANTEE_REMAIN_AMOUNT", precision = 19, scale = 2)
    private BigDecimal guaranteeRemainAmount;

    @Column(name = "GUARANTEE_EXPIRY_DATE")
    private LocalDate guaranteeExpiryDate;

    @Column(name = "GUARANTEE_REVOKED_DATE")
    private LocalDate guaranteeRevokedDate;

    @Column(name = "COMPLETED_WORKLOAD_NO")
    private Integer completedWorkloadNo;

    @Column(name = "COMPLETED_WORKLOAD_DATE")
    private LocalDate completedWorkloadDate;

    @Column(name = "CUMULATIVE_WORKLOAD_PAYMENT", precision = 19, scale = 2)
    private BigDecimal cumulativeWorkloadPayment;

    @Column(name = "CUMULATIVE_PAID_CAPITAL", precision = 19, scale = 2)
    private BigDecimal cumulativePaidCapital;

    @Column(name = "ADVANCE_PAYMENT_AMOUNT", precision = 19, scale = 2)
    private BigDecimal advancePaymentAmount;
}
