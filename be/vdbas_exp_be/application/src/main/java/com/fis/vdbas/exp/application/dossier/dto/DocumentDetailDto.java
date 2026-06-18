package com.fis.vdbas.exp.application.dossier.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

/** Chi tiết chứng từ (schema {@code DocumentDetail} = DocumentSummary + metadata). */
@Data
@EqualsAndHashCode(callSuper = true)
public class DocumentDetailDto extends DocumentSummaryDto {

    private UUID dossierId;
    private Integer status;
    private String createdBy;
    private LocalDateTime createdDate;
    private String updatedBy;
    private LocalDateTime updatedDate;
}
