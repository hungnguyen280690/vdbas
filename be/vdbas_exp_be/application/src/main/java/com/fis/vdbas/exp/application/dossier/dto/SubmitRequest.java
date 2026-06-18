package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Gửi kiểm soát (inline body {@code {version}} của endpoint submit). */
@Data
public class SubmitRequest {

    @NotNull(message = "{dossier.version.required}")
    private Integer version;
}
