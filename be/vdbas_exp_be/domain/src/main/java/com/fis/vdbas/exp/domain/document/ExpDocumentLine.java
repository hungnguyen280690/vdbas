package com.fis.vdbas.exp.domain.document;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "exp_document_line")
@Getter @Setter @NoArgsConstructor
public class ExpDocumentLine implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "document_line_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID documentLineId;

    @Column(name = "document_id", columnDefinition = "uuid", nullable = false)
    private UUID documentId;

    @Column(name = "investment_source_code", length = 100)
    private String investmentSourceCode;

    @Column(name = "allocation_criteria_code", length = 100)
    private String allocationCriteriaCode;

    @Column(name = "payment_request_amount", precision = 18, scale = 2)
    private BigDecimal paymentRequestAmount;

    @Column(name = "payment_request_amount_vnd", precision = 18, scale = 2)
    private BigDecimal paymentRequestAmountVnd;

    @Column(name = "gl_segment2", length = 100)
    private String glSegment2;

    @Column(name = "gl_segment4", length = 100)
    private String glSegment4;

    @Column(name = "gl_segment5", length = 100)
    private String glSegment5;

    @Column(name = "gl_segment8", length = 100)
    private String glSegment8;

    @Column(name = "gl_segment9", length = 100)
    private String glSegment9;

    @Column(name = "gl_segment10", length = 100)
    private String glSegment10;

    @Column(name = "gl_segment12", length = 100)
    private String glSegment12;

    @Column(name = "gl_segment13", length = 100)
    private String glSegment13;
}
