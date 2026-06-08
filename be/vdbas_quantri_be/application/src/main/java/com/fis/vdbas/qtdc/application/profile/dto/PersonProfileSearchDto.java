package com.fis.vdbas.qtdc.application.profile.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class PersonProfileSearchDto extends BaseSearchDto {
    private String fullName;
    private String email;
    private String phone;
    private String identityNumber;
    private String gender;
    private Boolean internal;
    private Boolean deleted;
    private Boolean active;
    private UUID orgId;
}
