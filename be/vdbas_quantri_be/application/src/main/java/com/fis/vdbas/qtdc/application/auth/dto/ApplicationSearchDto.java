package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApplicationSearchDto extends BaseSearchDto {
    private String appCode;
    private String appName;
    private UUID orgId;
    private String clientId;
    private Boolean active;
    private Boolean deleted;
}
