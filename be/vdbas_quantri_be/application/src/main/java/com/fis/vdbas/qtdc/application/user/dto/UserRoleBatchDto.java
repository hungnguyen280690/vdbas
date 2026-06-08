package com.fis.vdbas.qtdc.application.user.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

import lombok.Data;

@Data
public class UserRoleBatchDto {
    @NotBlank(message = "App code is required")
    private String appCode;

    // @NotBlank(message = "User is required")
    private UUID userId;

    private List<UserRoleDto> roles;

}
