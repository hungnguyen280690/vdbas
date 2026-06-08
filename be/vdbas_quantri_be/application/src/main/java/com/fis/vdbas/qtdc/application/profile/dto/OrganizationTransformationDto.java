package com.fis.vdbas.qtdc.application.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class OrganizationTransformationDto {

    private UUID id;

    @NotNull(message = "Source organization ID is required")
    private UUID sourceOrgId;

    @NotNull(message = "Target organization ID is required")
    private UUID targetOrgId;

    @NotBlank(message = "Transformation type is required")
    @Size(max = 50, message = "Transformation type must not exceed 50 characters")
    private String transformationType;

    @NotNull(message = "Effective date is required")
    private LocalDateTime effectiveDate;

    @Size(max = 100, message = "Decision number must not exceed 100 characters")
    private String decisionNumber;
}
