package com.fis.vdbas.exp.application.capex.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeleteRequestDto {
    @NotBlank
    @Size(min = 10, max = 500)
    private String deleteReason;
    @NotNull
    private Boolean confirmReviewed;
}
