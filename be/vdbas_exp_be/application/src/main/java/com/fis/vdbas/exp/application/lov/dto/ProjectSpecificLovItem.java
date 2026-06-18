package com.fis.vdbas.exp.application.lov.dto;

import lombok.Data;

/** LOV item dự án đặc thù (schema {@code ProjectSpecificLovItem}). */
@Data
public class ProjectSpecificLovItem {

    private String projectSpecificCode;
    private String projectSpecificName;
    private String projectCode;
}
