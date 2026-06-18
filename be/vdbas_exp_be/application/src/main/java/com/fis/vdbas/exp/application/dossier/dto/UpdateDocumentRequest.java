package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** Cập nhật chứng từ (schema {@code UpdateDocumentRequest} = AddDocumentRequest + version). */
@Data
@EqualsAndHashCode(callSuper = true)
public class UpdateDocumentRequest extends AddDocumentRequest {

    @NotNull(message = "{document.version.required}")
    private Integer version;
}
