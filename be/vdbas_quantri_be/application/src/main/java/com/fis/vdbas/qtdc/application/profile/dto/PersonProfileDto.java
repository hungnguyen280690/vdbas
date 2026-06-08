package com.fis.vdbas.qtdc.application.profile.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class PersonProfileDto extends BaseAuditingDto {

    private UUID id;

    @NotBlank(message = "{person.fullName.required}")
    @Size(max = 255, message = "{person.fullName.size}")
    private String fullName;

    @Email(message = "{person.email.email}")
    @Size(max = 255, message = "{person.email.size}")
    private String email;

    @Size(max = 20, message = "{person.phone.size}")
    private String phone;

    @Size(max = 50, message = "{person.identityNumber.size}")
    private String identityNumber;

    @Size(max = 10, message = "{person.gender.size}")
    private String gender;

    private Boolean internal;

    private UUID orgId;

    private String orgCode;

    private String orgName;

    private String positionCode;

    private String positionName;

    private Boolean active;
}
