package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RoleDto extends BaseAuditingDto {

    @NotBlank(message = "{role.appCode.required}")
    @Size(max = 50, message = "{role.appCode.size}")
    private String appCode;

    @NotBlank(message = "{role.roleCode.required}")
    @Size(max = 100, message = "{role.roleCode.size}")
    private String roleCode;

    @NotBlank(message = "{role.roleName.required}")
    @Size(max = 255, message = "{role.roleName.size}")
    private String roleName;
}
