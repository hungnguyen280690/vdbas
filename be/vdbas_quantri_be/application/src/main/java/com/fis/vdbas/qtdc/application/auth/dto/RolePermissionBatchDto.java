package com.fis.vdbas.qtdc.application.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class RolePermissionBatchDto {
    @NotBlank(message = "App code is required")
    private String appCode;

    @NotBlank(message = "Role code is required")
    private String roleCode;

    private List<String> permissionCodes;
}
