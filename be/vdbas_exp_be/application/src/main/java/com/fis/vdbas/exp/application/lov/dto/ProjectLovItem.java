package com.fis.vdbas.exp.application.lov.dto;

import lombok.Data;

/** LOV item dự án (schema {@code ProjectLovItem}). */
@Data
public class ProjectLovItem {

    private String projectCode;
    private String projectName;
    private String projectTypeCode;
    private String organizationCode;
    /** true nếu có dự án đặc thù con (NOTE-02). */
    private Boolean hasSpecific;
}
