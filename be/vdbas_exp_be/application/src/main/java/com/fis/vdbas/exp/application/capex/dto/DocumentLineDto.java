package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class DocumentLineDto {
    private UUID documentLineId;
    private UUID documentId;
    private Integer capitalYear;
    private Integer extended;
    private String investmentSourceCode;
    private String allocationCriteriaCode;
    private BigDecimal paymentRequestAmount;
    private BigDecimal paymentRequestAmountVnd;
    private BigDecimal approvedAmount;
    private BigDecimal approvedAmountVnd;
    private BigDecimal advanceDeductionAmount;
    private BigDecimal advanceDeductionAmountVnd;
    private BigDecimal warrantyAmount;
    private BigDecimal warrantyAmountVnd;
    private BigDecimal pendingSettlementAmount;
    private BigDecimal pendingSettlementAmountVnd;
    private BigDecimal valueAddedTaxAmount;
    private BigDecimal transferBeneficiaryAmount;
    private BigDecimal transferBeneficiaryAmountVnd;
    private String beneficiaryName;
    private String beneficiaryAccount;
    private String beneficiaryBankName;
    private String beneficiaryBankCode;
    private GlSegmentsDto glSegments;

    public String getGlSegment2() { return glSegments != null ? glSegments.getSegment2() : null; }
    public String getGlSegment4() { return glSegments != null ? glSegments.getSegment4() : null; }
    public String getGlSegment5() { return glSegments != null ? glSegments.getSegment5() : null; }
    public String getGlSegment8() { return glSegments != null ? glSegments.getSegment8() : null; }
    public String getGlSegment9() { return glSegments != null ? glSegments.getSegment9() : null; }
    public String getGlSegment10() { return glSegments != null ? glSegments.getSegment10() : null; }
    public String getGlSegment12() { return glSegments != null ? glSegments.getSegment12() : null; }
    public String getGlSegment13() { return glSegments != null ? glSegments.getSegment13() : null; }

    public void setGlSegment2(String v) { ensureGl(); glSegments.setSegment2(v); }
    public void setGlSegment4(String v) { ensureGl(); glSegments.setSegment4(v); }
    public void setGlSegment5(String v) { ensureGl(); glSegments.setSegment5(v); }
    public void setGlSegment8(String v) { ensureGl(); glSegments.setSegment8(v); }
    public void setGlSegment9(String v) { ensureGl(); glSegments.setSegment9(v); }
    public void setGlSegment10(String v) { ensureGl(); glSegments.setSegment10(v); }
    public void setGlSegment12(String v) { ensureGl(); glSegments.setSegment12(v); }
    public void setGlSegment13(String v) { ensureGl(); glSegments.setSegment13(v); }

    private void ensureGl() { if (glSegments == null) glSegments = new GlSegmentsDto(); }
}
