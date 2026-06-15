package com.fis.vdbas.exp.domain.capex;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "EXP_DOCUMENT_LINE")
@Getter
@Setter
@NoArgsConstructor
public class ExpDocumentLine {

    @Id
    @GeneratedValue
    @Column(name = "DOCUMENT_LINE_ID", columnDefinition = "RAW(16)", nullable = false, updatable = false)
    private UUID documentLineId;

    @Column(name = "DOCUMENT_ID", columnDefinition = "RAW(16)", nullable = false)
    private UUID documentId;

    @Column(name = "CAPITAL_YEAR")
    private Integer capitalYear;

    @Column(name = "EXTENDED")
    private Integer extended;

    @Column(name = "INVESTMENT_SOURCE_CODE", length = 100)
    private String investmentSourceCode;

    @Column(name = "ALLOCATION_CRITERIA_CODE", length = 100)
    private String allocationCriteriaCode;

    @Column(name = "PAYMENT_REQUEST_AMOUNT", precision = 19, scale = 2)
    private BigDecimal paymentRequestAmount;

    @Column(name = "PAYMENT_REQUEST_AMOUNT_VND", precision = 19, scale = 0)
    private BigDecimal paymentRequestAmountVnd;

    @Column(name = "APPROVED_AMOUNT", precision = 19, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "APPROVED_AMOUNT_VND", precision = 19, scale = 0)
    private BigDecimal approvedAmountVnd;

    @Column(name = "ADVANCE_DEDUCTION_AMOUNT", precision = 19, scale = 2)
    private BigDecimal advanceDeductionAmount;

    @Column(name = "ADVANCE_DEDUCTION_AMOUNT_VND", precision = 19, scale = 0)
    private BigDecimal advanceDeductionAmountVnd;

    @Column(name = "WARRANTY_AMOUNT", precision = 19, scale = 2)
    private BigDecimal warrantyAmount;

    @Column(name = "WARRANTY_AMOUNT_VND", precision = 19, scale = 0)
    private BigDecimal warrantyAmountVnd;

    @Column(name = "PENDING_SETTLEMENT_AMOUNT", precision = 19, scale = 2)
    private BigDecimal pendingSettlementAmount;

    @Column(name = "PENDING_SETTLEMENT_AMOUNT_VND", precision = 19, scale = 0)
    private BigDecimal pendingSettlementAmountVnd;

    @Column(name = "VALUE_ADDED_TAX_AMOUNT", precision = 19, scale = 2)
    private BigDecimal valueAddedTaxAmount;

    @Column(name = "TRANSFER_BENEFICIARY_AMOUNT", precision = 19, scale = 2)
    private BigDecimal transferBeneficiaryAmount;

    @Column(name = "TRANSFER_BENEFICIARY_AMOUNT_VN", precision = 19, scale = 0)
    private BigDecimal transferBeneficiaryAmountVnd;

    @Column(name = "BENEFICIARY_NAME", length = 500)
    private String beneficiaryName;

    @Column(name = "BENEFICIARY_ACCOUNT", length = 100)
    private String beneficiaryAccount;

    @Column(name = "BENEFICIARY_BANK_NAME", length = 500)
    private String beneficiaryBankName;

    @Column(name = "BENEFICIARY_BANK_CODE", length = 100)
    private String beneficiaryBankCode;

    @Column(name = "GL_SEGMENT2", length = 100)
    private String glSegment2;

    @Column(name = "GL_SEGMENT4", length = 100)
    private String glSegment4;

    @Column(name = "GL_SEGMENT5", length = 100)
    private String glSegment5;

    @Column(name = "GL_SEGMENT8", length = 100)
    private String glSegment8;

    @Column(name = "GL_SEGMENT9", length = 100)
    private String glSegment9;

    @Column(name = "GL_SEGMENT10", length = 100)
    private String glSegment10;

    @Column(name = "GL_SEGMENT12", length = 100)
    private String glSegment12;

    @Column(name = "GL_SEGMENT13", length = 100)
    private String glSegment13;
}
