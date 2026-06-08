package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PermissionDto extends BaseAuditingDto {

    @NotBlank(message = "{permission.appCode.required}")
    @Size(max = 50, message = "{permission.appCode.size}")
    private String appCode;

    @NotBlank(message = "{permission.permissionCode.required}")
    @Size(max = 100, message = "{permission.permissionCode.size}")
    private String permissionCode;

    @NotBlank(message = "{permission.permissionName.required}")
    @Size(max = 255, message = "{permission.permissionName.size}")
    private String permissionName;

    @Size(max = 255, message = "{permission.permissionNameEn.size}")
    private String permissionNameEn;

    @Size(max = 100, message = "{permission.parentCode.size}")
    private String parentCode;

    @Size(max = 20, message = "{permission.type.size}")
    private String type;

    @Size(max = 500, message = "{permission.path.size}")
    private String path;

    @Size(max = 10, message = "{permission.method.size}")
    private String method;
}
