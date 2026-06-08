package com.fis.vdbas.qtdc.application.profile.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class OrganizationProfileDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "{org.orgCode.required}")
    @Size(max = 50, message = "{org.orgCode.size}")
    private String orgCode;

    @NotBlank(message = "{org.orgName.required}")
    @Size(max = 255, message = "{org.orgName.size}")
    private String orgName;

    @Email(message = "{org.email.email}")
    @Size(max = 100, message = "{org.email.size}")
    private String email;

    @Size(max = 20, message = "{org.phone.size}")
    private String phone;

    private String address;

    @Size(max = 50, message = "{org.orgType.size}")
    private String orgType;

    private UUID parentId;
    private UUID unitId;
    private String paths;
    private Boolean active;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private List<UUID> sourceOrgIds;
    private String transformationType;
    private String decisionNumber;
    private LocalDateTime effectiveDate;

    // Additional info
    private String parentCode;
    private String parentName;
    private String unitCode;
    private String unitName;
}
