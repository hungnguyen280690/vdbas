package com.fis.vdbas.qtdc.application.user.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserSearchDto extends BaseSearchDto {
    private String username;
    private String displayName;
    private String externalId;
    private Integer status;
    private Boolean deleted;
    private String type;
    private String ownerType;
}
