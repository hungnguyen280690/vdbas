package com.fis.vdbas.qtdc.application.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RolePermissionDto {

    @NotBlank(message = "App code is required")
    @Size(max = 50, message = "App code must not exceed 50 characters")
    private String appCode;

    @NotBlank(message = "Role code is required")
    @Size(max = 100, message = "Role code must not exceed 100 characters")
    private String roleCode;

    @NotBlank(message = "Permission code is required")
    @Size(max = 100, message = "Permission code must not exceed 100 characters")
    private String permissionCode;

    private LocalDateTime createdAt;
    private String createdBy;
}
