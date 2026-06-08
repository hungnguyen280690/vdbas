package com.fis.vdbas.exp.application.capex.dto;

import com.fis.vdbas.common.dto.BaseSearchDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class CapexDossierSearchDto extends BaseSearchDto {

    private String dossierCode;
    private String projectCode;
    private String stateCode;
    private String dataSourceCode;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String createdBy;
    private Boolean deleted;
}
