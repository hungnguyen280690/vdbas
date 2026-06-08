package com.fis.vdbas.exp.application.category.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryGroupSearchDto extends BaseSearchDto {
    private String groupCode;
    private String groupName;
    private Boolean active;
    private Boolean system;
    private Boolean deleted;
}
