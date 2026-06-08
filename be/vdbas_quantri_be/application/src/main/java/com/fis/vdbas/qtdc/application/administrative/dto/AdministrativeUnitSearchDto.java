package com.fis.vdbas.qtdc.application.administrative.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AdministrativeUnitSearchDto { // extends BaseSearchDto {
    private String unitCode;
    private String unitName;
    private Integer unitLevel;
    private UUID parentId;
    private Boolean active;
    private Boolean hasEndDate;
    private Boolean deleted;
}
