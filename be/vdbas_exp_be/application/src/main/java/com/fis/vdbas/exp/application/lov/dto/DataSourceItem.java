package com.fis.vdbas.exp.application.lov.dto;

import lombok.Data;

/** LOV item nguồn gốc hồ sơ (schema {@code DataSourceItem}). */
@Data
public class DataSourceItem {

    private String code;
    private String name;
    private Boolean isDefault;
}
