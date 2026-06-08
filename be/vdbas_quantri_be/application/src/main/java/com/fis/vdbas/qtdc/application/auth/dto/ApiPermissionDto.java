package com.fis.vdbas.qtdc.application.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiPermissionDto {

    private String code;
    private String name;
    private String path;
    private String method;
}



