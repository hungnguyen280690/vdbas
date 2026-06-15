package com.fis.vdbas.exp.application.masterdata.dto;

import lombok.Data;

@Data
public class ProjectInfoDto {
    private String projectCode;
    private String projectName;
    private String projectTypeCode;
    private String projectManagementCode;
    private String projectManagementName;
    private String investorCode;
}
