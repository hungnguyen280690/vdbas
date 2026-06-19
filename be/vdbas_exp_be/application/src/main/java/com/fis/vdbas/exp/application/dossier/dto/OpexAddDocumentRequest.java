package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Thêm/sửa chứng từ OPEX (schema {@code DocumentCreateRequest}/{@code DocumentUpdateRequest}) — GAP-04/09.
 * <p>required theo contract: {@code [documentTypeCode, treasuryCode, documentDate, accountingDate,
 * originalAmount, baseAmount]}. {@code documentNo}/{@code documentName} backend sinh (GAP-14) —
 * KHÔNG nhận từ client. {@code originalAmount} bắt buộc cho OPEX (GAP-09). {@code currencyCode}
 * không persist (GAP-08) — loại khỏi DTO.</p>
 */
@Data
public class OpexAddDocumentRequest {

    @NotBlank(message = "{document.documentTypeCode.required}")
    @Size(max = 100, message = "{document.documentTypeCode.size}")
    private String documentTypeCode;

    @NotBlank(message = "{document.treasuryCode.required}")
    @Size(max = 100, message = "{document.treasuryCode.size}")
    private String treasuryCode;

    @NotNull(message = "{document.documentDate.required}")
    private LocalDate documentDate;

    @NotNull(message = "{document.accountingDate.required}")
    private LocalDate accountingDate;

    @NotNull(message = "{document.originalAmount.required}")
    private Long originalAmount;

    @NotNull(message = "{document.baseAmount.required}")
    private Long baseAmount;
}
