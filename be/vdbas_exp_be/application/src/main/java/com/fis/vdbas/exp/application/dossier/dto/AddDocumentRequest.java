package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/** Thêm chứng từ vào hồ sơ (schema {@code AddDocumentRequest}). */
@Data
public class AddDocumentRequest {

    @NotBlank(message = "{document.documentTypeCode.required}")
    @Size(max = 100, message = "{document.documentTypeCode.size}")
    private String documentTypeCode;

    @Size(max = 500, message = "{document.documentName.size}")
    private String documentName;

    @NotBlank(message = "{document.documentNo.required}")
    @Size(max = 200, message = "{document.documentNo.size}")
    private String documentNo;

    @NotNull(message = "{document.documentDate.required}")
    private LocalDate documentDate;

    @NotNull(message = "{document.accountingDate.required}")
    private LocalDate accountingDate;

    /** DEC-02: nullable — null khi VND thuần. */
    private Long originalAmount;

    @NotNull(message = "{document.baseAmount.required}")
    private Long baseAmount;
}
