package com.fis.vdbas.qtdc.application.user.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import com.fis.vdbas.qtdc.common.enums.AuthSource;
import com.fis.vdbas.qtdc.common.enums.OwnerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "{user.username.required}")
    @Size(max = 100, message = "{user.username.size}")
    private String username;

    private String externalId;
    private AuthSource authSource;
    private UUID ownerId;
    private OwnerType ownerType;
    private Boolean isOrgAdmin;

    @Size(max = 255, message = "{user.displayName.size}")
    private String displayName;

    @Size(max = 50, message = "{user.userType.size}")
    private String userType;

    private Integer status;
}
