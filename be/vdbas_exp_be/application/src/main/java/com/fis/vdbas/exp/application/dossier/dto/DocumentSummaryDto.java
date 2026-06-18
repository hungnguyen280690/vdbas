package com.fis.vdbas.exp.application.dossier.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/** Tóm tắt chứng từ trên grid §B1.2 (schema {@code DocumentSummary}). */
@Data
public class DocumentSummaryDto {

    private UUID id;
    /** NOTE-01: STT tính runtime. */
    private Integer seqNo;
    private String documentTypeCode;
    private String documentName;
    private String documentNo;
    private LocalDate documentDate;
    private LocalDate accountingDate;
    /** DEC-02: nullable. */
    private Long originalAmount;
    private Long baseAmount;
}
