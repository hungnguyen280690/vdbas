package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RoleSearchDto extends BaseSearchDto {
    private String roleCode;
    private String roleName;
    private String appCode;
    private Boolean deleted;
}
