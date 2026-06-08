package com.fis.vdbas.qtdc.application.profile.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class OrganizationPersonSearchDto extends BaseSearchDto {
    private UUID personId;
    private UUID orgId;
    private String positionName;
    private Boolean main;
    private Boolean active;
}
