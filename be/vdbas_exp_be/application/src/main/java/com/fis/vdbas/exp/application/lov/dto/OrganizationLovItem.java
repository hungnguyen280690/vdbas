package com.fis.vdbas.exp.application.lov.dto;

import lombok.Data;

/** LOV item đơn vị quan hệ ngân sách (schema {@code OrganizationLovItem}). */
@Data
public class OrganizationLovItem {

    private String organizationCode;
    private String organizationName;
}
