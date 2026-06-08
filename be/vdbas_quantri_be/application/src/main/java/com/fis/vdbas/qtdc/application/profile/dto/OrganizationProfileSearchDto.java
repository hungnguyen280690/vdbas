package com.fis.vdbas.qtdc.application.profile.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class OrganizationProfileSearchDto {
    private String orgCode;
    private String orgName;
    private String email;
    private String orgType;
    private UUID parentId;
    private UUID unitId;
    private Boolean active;
    private Boolean deleted;
}
