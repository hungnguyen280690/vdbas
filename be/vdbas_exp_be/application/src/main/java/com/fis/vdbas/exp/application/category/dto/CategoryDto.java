package com.fis.vdbas.exp.application.category.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "{category.groupCode.required}")
    @Size(max = 50, message = "{category.groupCode.size}")
    private String groupCode;

    @NotBlank(message = "{category.itemCode.required}")
    @Size(max = 50, message = "{category.itemCode.size}")
    private String itemCode;

    @NotBlank(message = "{category.itemName.required}")
    @Size(max = 255, message = "{category.itemName.size}")
    private String itemName;

    private String extAttributes;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private UUID parentId;
    private Integer orderIndex;
    private Integer catLevel;
    private String catPath;
}
