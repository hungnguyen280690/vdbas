package com.fis.vdbas.qtdc.application.auth.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
public class PermissionAppDto implements Serializable {

    private String appCode;
    private String appUrl;

}
