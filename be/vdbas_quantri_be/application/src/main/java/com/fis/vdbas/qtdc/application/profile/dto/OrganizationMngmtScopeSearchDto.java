package com.fis.vdbas.qtdc.application.profile.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import com.fis.vdbas.qtdc.common.enums.ManageScopeType;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class OrganizationMngmtScopeSearchDto extends BaseSearchDto {
    private UUID managerOrgId;
    private String targetOrgType;
    private UUID targetOrgId;
    private ManageScopeType manageScopeType;
}
