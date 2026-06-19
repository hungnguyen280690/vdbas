package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Ghi chú khi check/approve OPEX (schema {@code ApproveRequest}) — GAP-04.
 * <p>Khác CAPEX: {@code reason} OPTIONAL theo contract OPEX (không {@code @NotBlank}).
 * Field {@code digitalSign} (ký số) là out-of-scope MVP.</p>
 */
@Data
public class OpexApproveRequest {

    @Size(max = 500, message = "{dossier.reason.size}")
    private String reason;

    // TODO (out-of-scope): DigitalSignInfo digitalSign — luồng ký số chưa hiện thực (NOTE-03)
}
