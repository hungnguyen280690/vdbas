package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApplicationDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "{app.appCode.required}")
    @Size(max = 50, message = "{app.appCode.size}")
    private String appCode;

    @NotBlank(message = "{app.appName.required}")
    @Size(max = 255, message = "{app.appName.size}")
    private String appName;

    private String appUrl;

    private UUID orgId;
    private String orgCode;
    private String orgName;
    private String clientId;
    private String clientSecret;
    private String adminInfo;
    private String description;
    private Boolean active;
}
