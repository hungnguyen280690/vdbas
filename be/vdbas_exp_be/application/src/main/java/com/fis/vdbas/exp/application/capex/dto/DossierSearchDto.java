package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DossierSearchDto {
    private String dossierCode;
    private String projectCode;
    private String stateCode;
    private LocalDate fromDate;
    private LocalDate toDate;
    private int page = 0;
    private int size = 20;
}
