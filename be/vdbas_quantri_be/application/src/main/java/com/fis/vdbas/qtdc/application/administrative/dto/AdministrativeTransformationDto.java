package com.fis.vdbas.qtdc.application.administrative.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AdministrativeTransformationDto {

    private UUID id;

    @NotNull(message = "Source unit ID is required")
    private UUID sourceUnitId;

    @NotNull(message = "Target unit ID is required")
    private UUID targetUnitId;

    @NotBlank(message = "Transformation type is required")
    @Size(max = 50, message = "Transformation type must not exceed 50 characters")
    private String transformationType;

    @NotNull(message = "Effective date is required")
    private LocalDateTime effectiveDate;

    @Size(max = 100, message = "Decision number must not exceed 100 characters")
    private String decisionNumber;

    private String sourceUnitName;

    private String sourceUnitCode;

    private LocalDateTime sourceUnitStartDate;

    private LocalDateTime sourceUnitEndDate;

    private String targetUnitName;

    private String targetUnitCode;

    private LocalDateTime targetUnitStartDate;

    private LocalDateTime targetUnitEndDate;
}
