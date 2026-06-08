package com.fis.vdbas.exp.application.category.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategorySearchDto extends BaseSearchDto {
    private String groupCode;
    private String itemCode;
    private String itemName;
    private Boolean deleted;
    private String isActive;
    private UUID parentId;
    private Integer catLevel;
    private Map<String, Object> extAttributes;
}
