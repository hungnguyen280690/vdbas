package com.fis.vdbas.qtdc.application.user.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserRoleDto {

    private UUID userId;
    private String appCode;
    private String roleCode;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
