package com.fis.vdbas.qtdc.application.profile.dto;

import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class OrganizationTreeDto {
    private UUID id;
    private UUID parentId;
    private String orgName;
    private String orgCode;

    private boolean isLeaf;

    private List<OrganizationTreeDto> children = new ArrayList<>();

    public OrganizationTreeDto(OrganizationProfile entity) {
        this.id = entity.getId();
        this.parentId = entity.getParentId();
        this.orgName = entity.getOrgName();
        this.orgCode = entity.getOrgCode();
        this.isLeaf = false;
    }
}
