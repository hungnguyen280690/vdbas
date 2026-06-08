package com.fis.vdbas.qtdc.application.administrative.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class AdministrativeUnitDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "Unit code is required")
    @Size(max = 50, message = "Unit code must not exceed 50 characters")
    private String unitCode;

    @NotBlank(message = "Unit name is required")
    @Size(max = 255, message = "Unit name must not exceed 255 characters")
    private String unitName;

    @NotNull(message = "Unit level is required")
    private Integer unitLevel;

    private String unitType;

    private UUID parentId;
    private Boolean active;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private List<UUID> sourceUnitIds;
    private String transformationType;
    private String decisionNumber;
    private LocalDateTime effectiveDate;
}
