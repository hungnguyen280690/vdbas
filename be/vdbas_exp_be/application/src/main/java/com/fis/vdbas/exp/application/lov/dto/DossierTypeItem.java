package com.fis.vdbas.exp.application.lov.dto;

import lombok.Data;

/** LOV item loại hồ sơ CAPEX/OPEX (schema {@code DossierTypeItem}) — GAP-11. */
@Data
public class DossierTypeItem {

    private String dossierTypeCode;
    private String dossierTypeName;
}
