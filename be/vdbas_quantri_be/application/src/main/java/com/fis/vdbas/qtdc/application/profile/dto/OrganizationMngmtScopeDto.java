package com.fis.vdbas.qtdc.application.profile.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;
import com.fis.vdbas.qtdc.common.enums.ManageScopeType;

@Data
public class OrganizationMngmtScopeDto {
    private UUID id;
    private UUID managerOrgId;
    private String targetOrgType;
    private UUID targetOrgId;
    private ManageScopeType manageScopeType;
    private String description;
    private LocalDateTime createdAt;
    private String createdBy;

    // Optional: for displaying names
    private String managerOrgName;
    private String targetOrgName;
}
