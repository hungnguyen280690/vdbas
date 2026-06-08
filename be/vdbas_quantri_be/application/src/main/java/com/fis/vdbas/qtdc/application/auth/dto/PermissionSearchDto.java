package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PermissionSearchDto extends BaseSearchDto {
    private String appCode;
    private String permissionCode;
    private String permissionName;
    private String permissionNameEn;
    private String type;
}
